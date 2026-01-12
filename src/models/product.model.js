import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const productSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    thumbnail: String,
    code: { type: String, unique: true },
    stock: Number,
    category: String,
    status: { type: Boolean, default: true },
    user: String,  
    phone: String  
});

productSchema.plugin(mongoosePaginate);
export const productModel = mongoose.model('products', productSchema);