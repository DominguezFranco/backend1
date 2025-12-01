import express from "express";
import ProductManager from "./productManager.js";
import CartManager from "./CartManager.js";


const app = express();
app.use(express.json());

const cartManager = new CartManager();


app.use(express.json())
const productManager = new ProductManager("./src/products.json");

app.get("/", (req, res)=>{
    res.json({message: "Bienvenidos a mi tienda"});
});

app.get("/api/products", async (req, res)=>{
    try{
        const products=await productManager.getProducts();
        res.status(200).json({message:"Productos obtenidos con exito", products});
    } catch (error){
        res.status(500).json({message: error.message})
    }
});

app.delete("/api/products/:pid", async (req, res)=>{
    try{
        const pid = req.params.pid;
        const products = await productManager.deleteProductById(pid);
        res.status(200).json({message:"Producto eliminado con exito", products});
    } catch (error){
        res.status(500).json({message: error.message})
    }
});

app.post("/api/products", async (req,res)=>{
    try{
        const newProduct = req.body;
        const products = await productManager.addProduct(newProduct);
        res.status(201).json({message:"Producto agregado con exito", products});
    }catch (error){
        res.status(500).json({message: error.message})
    }
})

app.put("/api/products/:pid", async (req,res)=>{
    try{
        const pid = req.params.pid;
        const updates = req.body;
        const products = await productManager.setProductById(pid, updates);
        res.status(200).json({message:"Producto actualizado con exito"});
    }catch (error){
        res.status(500).json({message: error.message});
    }
})

//rutas carrito
app.post("/api/carts", async (req,res)=>{
    const carts = await cartManager.addCart();
    res.status(201).json({carts, message:"Carrito creado con exito"});
})

app.get("/api/carts/:cid", async (req,res)=>{
    const cid = req.params.cid;
    const products = await cartManager.getProductInCartById(cid);
    res.status(200).json({products, message:"Productos obtenidos con exito"});
})

app.post("/api/carts/:cid/products/:pid", async (req,res)=>{
    const cid = req.params.cid;
    const pid = parseInt(req.params.pid);
    const quantity = req.body.quantity;
    const carts = await cartManager.addProductInCart(cid, pid, quantity);
    res.status(200).json({carts, message:"Producto agregado al carrito con exito"});
})

app.listen(8080, ()=> console.log("Servidor escuchando en el puerto 8080"));