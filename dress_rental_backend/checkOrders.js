import mongoose from 'mongoose';
import OrderModel from './models/OrderModel.js';

mongoose.connect('mongodb://127.0.0.1:27017/dress_rental')
  .then(async () => {
    const orders = await OrderModel.find({});
    console.log("ALL ORDERS:", JSON.stringify(orders, null, 2));
    process.exit(0);
  })
  .catch(err => console.error(err));
