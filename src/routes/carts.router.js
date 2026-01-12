import { Router } from "express";
import { cartModel } from "../models/cart.model.js";

const router = Router();

// Eliminar un producto del carrito
router.delete("/:cid/products/:pid", async (req, res) => {
    const { cid, pid } = req.params;
    const cart = await cartModel.findById(cid);
    cart.products = cart.products.filter(p => p.product.toString() !== pid);
    await cart.save();
    res.json({ status: "success", message: "Producto eliminado" });
});

// Vaciar carrito
router.delete("/:cid", async (req, res) => {
    await cartModel.findByIdAndUpdate(req.params.cid, { products: [] });
    res.json({ status: "success", message: "Carrito vaciado" });
});

// Obtener carrito con populate
router.get("/:cid", async (req, res) => {
    try {
        
        const cart = await cartModel.findById(req.params.cid)
            .populate('products.product') 
            .lean();

        if (!cart) return res.status(404).json({ status: "error", message: "Carrito no encontrado" });

        res.json({ status: "success", payload: cart });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

export default router;