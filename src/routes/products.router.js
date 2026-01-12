import { Router } from "express";
import { productModel } from "../models/product.model.js";

const router = Router();


router.get("/", async (req, res) => {
    try {
        let { limit = 10, page = 1, sort, query } = req.query;
        
        // 1. Filtros
        let filter = {};
        if (query) {
            filter = { 
                $or: [
                    { category: query },
                    { status: query === 'true' }
                ] 
            };
        }

        // 2. Opciones de Paginación y Orden
        let options = {
            limit: parseInt(limit),
            page: parseInt(page),
            lean: true 
        };

        if (sort) {
            options.sort = { price: sort === 'asc' ? 1 : -1 };
        }

        // 3. Ejecución de la consulta con Paginate
        let result = await productModel.paginate(filter, options);

        // 4. Formato de respuesta requerido por la consigna
        res.send({
            status: 'success',
            payload: result.docs,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: result.hasPrevPage ? `/api/products?page=${result.prevPage}&limit=${limit}${sort ? `&sort=${sort}` : ''}${query ? `&query=${query}` : ''}` : null,
            nextLink: result.hasNextPage ? `/api/products?page=${result.nextPage}&limit=${limit}${sort ? `&sort=${sort}` : ''}${query ? `&query=${query}` : ''}` : null
        });

    } catch (error) {
        res.status(500).send({ status: 'error', message: error.message });
    }
});

// POST 
router.post("/", async (req, res) => {
    try {
        const newProduct = await productModel.create(req.body);
        
        
        const io = req.app.get("io");
        const allProducts = await productModel.find().lean();
        io.emit("updateProducts", allProducts);

        res.status(201).send({ status: "success", payload: newProduct });
    } catch (error) {
        res.status(500).send({ status: "error", message: error.message });
    }
});

// DELETE
router.delete("/:pid", async (req, res) => {
    try {
        const { pid } = req.params;
        await productModel.findByIdAndDelete(pid);

        const io = req.app.get("io");
        const allProducts = await productModel.find().lean();
        io.emit("updateProducts", allProducts);

        res.send({ status: "success", message: "Producto eliminado" });
    } catch (error) {
        res.status(500).send({ status: "error", message: error.message });
    }
});

export default router;
