import { Router } from "express";
import { productModel } from "../models/product.model.js";

const router = Router();

// 1. VISTA DE PRODUCTOS (CON PAGINACIÓN)
router.get("/products", async (req, res) => {
    try {
        let { limit = 10, page = 1 } = req.query;

        const result = await productModel.paginate({}, { 
            limit: parseInt(limit), 
            page: parseInt(page), 
            lean: true 
        });

        res.render("home", {
            products: result.docs,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            totalPages: result.totalPages,
            limit: limit
        });
    } catch (error) {
        res.status(500).send("Error al cargar el catálogo");
    }
});

// 2. VISTA DE DETALLE DE UN PRODUCTO
router.get("/products/:pid", async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await productModel.findById(pid).lean();
        
        if (!product) {
            return res.status(404).render("error", { message: "Producto no encontrado" });
        }

        res.render("productDetail", { product });
    } catch (error) {
        res.status(500).send("Error al cargar el detalle");
    }
});

// 3. VISTA REAL TIME
router.get("/realtimeproducts", async (req, res) => {
    try {
        const products = await productModel.find().lean();
        res.render("realTimeProducts", { products });
    } catch (error) {
        res.status(500).send("Error al cargar el panel de control");
    }
});

export default router;