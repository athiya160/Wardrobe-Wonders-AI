import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

import path from "path";
import { fileURLToPath } from "url";

import productRouter from "./routes/product.router.js";
import UserRouter from "./routes/user.router.js";
import { PaymentRouter } from "./routes/payment.js";
import providerRouter from "./routes/provider.router.js";
import uploadRouter from "./routes/upload.router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
dotenv.config();
app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/upload", uploadRouter);
app.use("/provider/upload", (req, res, next) => {
  req.url = "/provider";
  uploadRouter(req, res, next);
});
app.use("/payment", PaymentRouter);
app.use("/products", productRouter);
app.use("/provider", providerRouter);
app.use(UserRouter);
app.listen(4000, async () => {
  await mongoose
    .connect(
      process.env.MONGO_URI
    )
    .then(() => {
      console.log("DB connected");
    })
    .catch((err) => {
      console.log("object", err);
    });
});
