import { Router } from "express";
import { productModel } from "../models/product.model.js"; // Asegurate que la ruta al modelo sea correcta

const router = Router();

// POST para agregar producto
router.post("/", async (req, res) => {
    try {
        // Guardamos en MongoDB
        await productModel.create(req.body);
        
        // Obtenemos la lista actualizada de Mongo para avisar por Sockets
        const productosActualizados = await productModel.find().lean();
        
        
        req.io.emit("updateProducts", productosActualizados);

        res.status(201).json({ status: "success", payload: productosActualizados });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// DELETE para eliminar producto
router.delete("/:pid", async (req, res) => {
    try {
        const { pid } = req.params;
        // Eliminamos de MongoDB
        await productModel.findByIdAndDelete(pid);
        
        // Obtenemos la lista actualizada
        const productosActualizados = await productModel.find().lean();
        
        
        req.io.emit("updateProducts", productosActualizados);

        res.json({ status: "success", message: "Producto eliminado", payload: productosActualizados });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

export default router;