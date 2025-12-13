import { Router } from "express";
import ProductManager from "./ProductManager.js";

const router = Router();
const pm = new ProductManager("./src/products.json");

// 📌 Crear un producto
router.post("/", async (req, res) => {
  try {
    const productosActualizados = await pm.addProduct(req.body);

    // 🔥 Websocket emit
    req.io.emit("updateProducts", productosActualizados);

    res.status(201).json({ status: "success", productos: productosActualizados });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Eliminar un producto
router.delete("/:pid", async (req, res) => {
  try {
    const productosActualizados = await pm.deleteProductById(req.params.pid);

    // 🔥 Websocket emit
    req.io.emit("updateProducts", productosActualizados);

    res.json({ status: "success", productos: productosActualizados });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

