import { Schema, model } from "mongoose";

const ProductModel = Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  advance: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    default: [],
  },
  stock: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  tags: {
    type: [String],
    required: false,
  },
  occasion: {
    type: String,
    required: false,
  },
  color: {
    type: String,
    required: false,
  },
  pattern: {
    type: String,
    required: false,
  },
  style: {
    type: String,
    required: false,
  },
  season: {
    type: String,
    required: false,
  },
  reviews: [
    {
      rating: { type: Number, required: true },
      comment: { type: String, required: true },
      username: { type: String, required: true },
      date: { type: Date, default: Date.now },
    }
  ]
});

export default model("Product", ProductModel);
