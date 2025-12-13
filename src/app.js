// src/app.js
import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import { Server as IOServer } from "socket.io";
import handlebars from "express-handlebars";

import ProductManager from "./productmanager.js"; // tu clase existente

// --- paths (__dirname compatible con ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- init
const app = express();
const PORT = process.env.PORT || 8080;

// --- instancias
const manager = new ProductManager(path.join(__dirname, "products.json"));

// --- middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// servir carpeta public (ya tenés src/public)
app.use(express.static(path.join(__dirname, "public")));

// --- Handlebars config
app.engine("handlebars", handlebars.engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// --- Rutas de vista
// Home (renderiza productos en servidor)
app.get("/", async (req, res) => {
  try {
    const products = await manager.getProducts();
    return res.render("home", { products });
  } catch (err) {
    return res.status(500).send("Error leyendo productos: " + err.message);
  }
});

// Realtime: pasar productos iniciales al template (evita lista vacía)
app.get("/realtimeproducts", async (req, res) => {
  try {
    const products = await manager.getProducts();
    return res.render("realTimeProducts", { products });
  } catch (err) {
    return res.status(500).send("Error leyendo productos: " + err.message);
  }
});

// --- API endpoints (POST y DELETE) que emiten sockets
// Nota: estos endpoints usan JSON simple. Si querés subir imágenes, después integramos multer.
app.post("/api/products", async (req, res) => {
  try {
    const newProdData = req.body; // { title, price, ... }
    const updatedProducts = await manager.addProduct(newProdData); // tu método devuelve lista
    // emitir via socket (io estará seteado después)
    const io = req.app.get("io");
    if (io) io.emit("updateProducts", updatedProducts);
    return res.status(201).json({ status: "success", products: updatedProducts });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

app.delete("/api/products/:pid", async (req, res) => {
  try {
    const pid = req.params.pid;
    const updatedProducts = await manager.deleteProductById(pid); // tu método devuelve lista
    const io = req.app.get("io");
    if (io) io.emit("updateProducts", updatedProducts);
    return res.json({ status: "success", products: updatedProducts });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

// --- arrancar server HTTP y Socket.IO
const httpServer = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const io = new IOServer(httpServer);

// Guardar io y manager en app para que rutas/otros puedan acceder: req.app.get('io') etc.
app.set("io", io);
app.set("productManager", manager);

import fs from "fs";
import crypto from "crypto";


// Necesario para usar __dirname en ESModules

const LIVE_PRODUCTS_FILE = path.join(__dirname, "liveProducts.json");

// Cargar productos en tiempo real desde disco
let liveProducts = [];
if (fs.existsSync(LIVE_PRODUCTS_FILE)) {
  liveProducts = JSON.parse(fs.readFileSync(LIVE_PRODUCTS_FILE, "utf-8"));
}

// --------- SUBIDA DE IMAGENES Y CREACION DE LIVE PRODUCT ----------
import multer from "multer";

// multer storage: guarda en src/public/img
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "public", "img")),
  filename: (req, file, cb) => {
    // timestamp + originalname para evitar colisiones
    const unique = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, unique);
  }
});
const upload = multer({ storage });

// Endpoint que recibe formulario multipart (imagen + campos) y guarda liveProducts.json
app.post("/api/live-products", upload.single("image"), (req, res) => {
  try {
    // leer fields
    const { title, price, username, phone } = req.body;
    // file procesado por multer
    const file = req.file;
    // thumbnail a servir desde /img/filename
    const thumbnail = file ? `/img/${file.filename}` : null;

    // leer liveProducts.json (si no existe crear array)
    const LIVE_PRODUCTS_FILE = path.join(__dirname, "liveProducts.json");
    let liveProducts = [];
    if (fs.existsSync(LIVE_PRODUCTS_FILE)) {
      liveProducts = JSON.parse(fs.readFileSync(LIVE_PRODUCTS_FILE, "utf-8"));
    }

    // crear producto
    const newProd = {
      id: crypto.randomUUID(),
      title: title || "Sin título",
      price: price ? Number(price) : 0,
      user: username || "anónimo",
      phone: phone || "",
      image: thumbnail
    };

    liveProducts.push(newProd);
    fs.writeFileSync(LIVE_PRODUCTS_FILE, JSON.stringify(liveProducts, null, 2));

    // emitir actualización: mezcla originales + live
    (async () => {
      const originalProducts = await manager.getProducts();
      io.emit("updateProducts", [...originalProducts, ...liveProducts]);
    })();

    return res.json({ status: "success", product: newProd });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
});


io.on("connection", async (socket) => {
  console.log("Cliente conectado:", socket.id);

  socket.on("deleteProduct", (productId) => {
  // filtrar producto
  liveProducts = liveProducts.filter(p => p.id !== productId);

  // guardar en disco
  fs.writeFileSync(
    LIVE_PRODUCTS_FILE,
    JSON.stringify(liveProducts, null, 2)
  );

  // volver a mandar lista actualizada
  manager.getProducts().then(originalProducts => {
    io.emit("updateProducts", [...originalProducts, ...liveProducts]);
  });
  });


  

  // 2) Enviar originales + live
  socket.emit("updateProducts", liveProducts);

  // 3) Recibir producto desde el formulario
  socket.on("newProduct", (data) => {
    const newProduct = {
      id: crypto.randomUUID(),
      ...data
    };

    liveProducts.push(newProduct);

    // Guardar en disco
    fs.writeFileSync(
      LIVE_PRODUCTS_FILE,
      JSON.stringify(liveProducts, null, 2)
    );

    // Mandar a todos los clientes
    io.emit("updateProducts", [...originalProducts, ...liveProducts]);
  });
});



