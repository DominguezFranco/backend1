import fs from "fs";
import crypto from "crypto";


class ProductManager {
    constructor(pathFile){
        this.pathFile = pathFile;
    }

    generateNewId(){
        return crypto.randomUUID();
    }

    async addProduct(newProduct){
        try{
            const fileData = await fs.readFile(this.pathFile, "utf-8");
            const products = JSON.parse(fileData);
            const newId = this.generateNewId();
            const product = {id: newId, ...newProduct};
            products.push(product);
            await fs.writeFile(this.pathFile, JSON.stringify(products, null, 2), "utf-8");
            return products;
        } catch (error){
            throw new Error("Error al agregar el producto" + error.message);
        }
    }

    async getProducts(){
        try{
            const fileData = await fs.readFile(this.pathFile, "utf-8");
            const products = JSON.parse(fileData);
            return products;
        } catch (error){
            throw new Error ("Error al obtener los productos" + error.message);
        }
    }

    async getProductById(pid, updates){
        try{
            const products = await this.addProduct();
            const indexProduct = products.findIndex(prod => prod.id === pid);
            if (indexProduct === -1) throw new Error ("Producto no encontrado");
            products [indexProduct] = {...products[indexProduct], ...updates};
            await fs.writeFile(this.pathFile, JSON.stringify(products, null, 2), "utf-8"); 
        } catch (error){
            throw new Error ("Error al actualizar el producto" + error.message);
        }
    }

    async deleteProductById(pid){
        try{
            const products = await this.getProducts();
            const filteredProducts = products.filter(prod => prod.id !== pid);
            await fs.writeFile(this.pathFile, JSON.stringify(filteredProducts, null, 2), "utf-8");
            return filteredProducts;
        } catch (error){
            throw new Error ("Error al eliminar el producto" + error.message);
        }
    }


}

export default ProductManager;