import 'dotenv/config';
import express from "express";
import mongoose from "mongoose";
import handlebars from "express-handlebars";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

// Importación de Routers
import productsRouter from "./routes/products.router.js";
import cartsRouter from "./routes/carts.router.js";
import viewsRouter from "./routes/views.router.js";

// Importación de Modelos y Herramientas
import { productModel } from "./models/product.model.js";
import uploader from "./utils/uploader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// --- 1. CONEXIÓN A MONGODB ---

const MONGO_URL = process.env.MONGO_URL; 

mongoose.connect(MONGO_URL)
    .then(() => console.log("✅ Conectado a MongoDB (vía variables de entorno)"))
    .catch(err => console.error("❌ Error al conectar a MongoDB:", err));

// --- 2. CONFIGURACIONES ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Configuración de Handlebars
app.engine("handlebars", handlebars.engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// --- 3. RUTAS ---
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/", viewsRouter);


app.get('/', (req, res) => {
    res.redirect('/products');
});

// --- 4. LÓGICA DE CARGA DE PRODUCTOS (Live Products) ---

app.post("/api/live-products", uploader.single("image"), async (req, res) => {
    try {
        const { title, price, username, phone } = req.body;
        const thumbnail = req.file ? `/img/${req.file.filename}` : "";

        
        const newProd = await productModel.create({
            title,
            price: Number(price),
            user: username,
            phone,
            thumbnail,
            description: "Producto cargado desde el panel en vivo", 
            code: `code-${Date.now()}`,
            stock: 10,
            category: "General",
            status: true
        });

        
        const allProducts = await productModel.find().lean();
        const io = req.app.get("io");
        io.emit("updateProducts", allProducts);

        res.json({ status: "success", product: newProd });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// --- 5. SERVIDOR Y SOCKETS ---
const httpServer = app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

const io = new Server(httpServer);
app.set("io", io); 

io.on("connection", async (socket) => {
    console.log("Cliente conectado:", socket.id);

    
    const products = await productModel.find().lean();
    socket.emit("updateProducts", products);

    
    socket.on("deleteProduct", async (productId) => {
        try {
            await productModel.findByIdAndDelete(productId);
            const updatedProducts = await productModel.find().lean();
            io.emit("updateProducts", updatedProducts);
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
    });
});