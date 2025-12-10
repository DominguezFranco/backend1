import express from "express";
import ProductManager from "../productManager";

const viewsRouter = express.Router();
const productManager = new ProductManager("./src/products.json");

viewsRouter.get("/", async (req, res) => {
    res.render("home");
});

viewsRouter.get("/dashboard", async (req, res) => {
    try{
        const user = {username: "pepe", isAdmin: true};
        const products = await productManager.getProducts();
        res.render("dashboard", {user, products});
    } catch (error){
        console.log(error);
    }
});

export default viewsRouter;