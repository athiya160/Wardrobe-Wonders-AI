import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

import productRouter from "./routes/product.router.js";
import UserRouter from "./routes/user.router.js";
import { PaymentRouter } from "./routes/payment.js";

const app = express();
dotenv.config();
app.use(cors());
app.use(bodyParser.json());
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/payment", PaymentRouter);
app.use("/products", productRouter);
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
