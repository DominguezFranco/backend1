import { Router } from "express";
import ProductManager from "./ProductManager.js";

const router = Router();
const pm = new ProductManager("./src/products.json");

router.get("/", async (req, res) => {
  const products = await pm.getProducts();
  res.render("home", { products });
});

router.get("/realtimeproducts", async (req, res) => {
  res.render("realTimeProducts");
});

export default router;

