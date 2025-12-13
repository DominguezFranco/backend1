
import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import { Server as IOServer } from "socket.io";
import handlebars from "express-handlebars";

import ProductManager from "./productmanager.js"; 


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = process.env.PORT || 8080;


const manager = new ProductManager(path.join(__dirname, "products.json"));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, "public")));


app.engine("handlebars", handlebars.engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));


app.get("/", async (req, res) => {
  try {
    const products = await manager.getProducts();
    return res.render("home", { products });
  } catch (err) {
    return res.status(500).send("Error leyendo productos: " + err.message);
  }
});


app.get("/realtimeproducts", async (req, res) => {
  try {
    const products = await manager.getProducts();
    return res.render("realTimeProducts", { products });
  } catch (err) {
    return res.status(500).send("Error leyendo productos: " + err.message);
  }
});


app.post("/api/products", async (req, res) => {
  try {
    const newProdData = req.body; 
    const updatedProducts = await manager.addProduct(newProdData); 
    
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
    const updatedProducts = await manager.deleteProductById(pid); 
    const io = req.app.get("io");
    if (io) io.emit("updateProducts", updatedProducts);
    return res.json({ status: "success", products: updatedProducts });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});


const httpServer = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const io = new IOServer(httpServer);


app.set("io", io);
app.set("productManager", manager);

import fs from "fs";
import crypto from "crypto";




const LIVE_PRODUCTS_FILE = path.join(__dirname, "liveProducts.json");


let liveProducts = [];
if (fs.existsSync(LIVE_PRODUCTS_FILE)) {
  liveProducts = JSON.parse(fs.readFileSync(LIVE_PRODUCTS_FILE, "utf-8"));
}


import multer from "multer";


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "public", "img")),
  filename: (req, file, cb) => {
    
    const unique = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, unique);
  }
});
const upload = multer({ storage });


app.post("/api/live-products", upload.single("image"), (req, res) => {
  try {
    
    const { title, price, username, phone } = req.body;
    
    const file = req.file;
    
    const thumbnail = file ? `/img/${file.filename}` : null;

    
    const LIVE_PRODUCTS_FILE = path.join(__dirname, "liveProducts.json");
    let liveProducts = [];
    if (fs.existsSync(LIVE_PRODUCTS_FILE)) {
      liveProducts = JSON.parse(fs.readFileSync(LIVE_PRODUCTS_FILE, "utf-8"));
    }

    
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
  
  liveProducts = liveProducts.filter(p => p.id !== productId);

  
  fs.writeFileSync(
    LIVE_PRODUCTS_FILE,
    JSON.stringify(liveProducts, null, 2)
  );

  
  manager.getProducts().then(originalProducts => {
    io.emit("updateProducts", [...originalProducts, ...liveProducts]);
  });
  });


  

  
  socket.emit("updateProducts", liveProducts);

  
  socket.on("newProduct", (data) => {
    const newProduct = {
      id: crypto.randomUUID(),
      ...data
    };

    liveProducts.push(newProduct);

    
    fs.writeFileSync(
      LIVE_PRODUCTS_FILE,
      JSON.stringify(liveProducts, null, 2)
    );

    
    io.emit("updateProducts", [...originalProducts, ...liveProducts]);
  });
});



