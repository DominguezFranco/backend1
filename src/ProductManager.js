import fs from "fs";
import path from "path";

const productsPath = path.resolve("src/products.json");

export default class ProductManager {

  getProducts = async () => {
    if (!fs.existsSync(productsPath)) return [];
    const data = await fs.promises.readFile(productsPath, "utf-8");
    return JSON.parse(data);
  };

  addProduct = async (product) => {
    const products = await this.getProducts();
    const newProduct = {
      id: products.length > 0 ? products[products.length - 1].id + 1 : 1,
      ...product,
    };

    products.push(newProduct);
    await fs.promises.writeFile(productsPath, JSON.stringify(products, null, 2));
    return newProduct;
  };

  deleteProduct = async (id) => {
    const products = await this.getProducts();
    const updated = products.filter(p => p.id !== id);
    await fs.promises.writeFile(productsPath, JSON.stringify(updated, null, 2));
    return updated;
  };
}
