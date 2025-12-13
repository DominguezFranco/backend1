import { Router } from "express";
import ProductManager from "./ProductManager.js";

const router = Router();
const manager = new ProductManager();


export default (io) => {

  
  router.get("/", async (req, res) => {
    const products = await manager.getProducts();
    res.json(products);
  });

  
  router.post("/", async (req, res) => {
    const newProduct = await manager.addProduct(req.body);
    
    const products = await manager.getProducts();
    io.emit("updateProducts", products);

    res.json({ status: "success", newProduct });
  });

  
  router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);

    const updated = await manager.deleteProduct(id);
    io.emit("updateProducts", updated);

    res.json({ status: "success", updated });
  });

  return router;
};
