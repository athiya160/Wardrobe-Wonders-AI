import { Router } from "express";
import UserModel from "../models/UserModel.js";
import jwt from "jsonwebtoken";

const UserRouter = new Router();

UserRouter.post("/login", async (req, res) => {
  const { body } = req;
  if (!body) return res.send("Please enter username and password");
  if (!body?.email) return res.send("Please enter email");
  if (!body?.password) return res.send("Please enter password");
  const user = await UserModel.findOne({ email: body.email });
  if (!user) return res.send("User not found");
  console.log(
    "pass",
    user,
    body.password,
    user.password,
    body.password == user.password
  );
  if (body.password == user.password) {
    const data = {
      id: user._id,
      username: user.username,
      email: user.email,
    };
    const token = jwt.sign(data, process.env.SECRET);
    return res.send({
      status: true,
      user: { ...user._doc, password: null },
      token: token,
    });
  }
  return res.send({
    status: false,
    token: null,
  });
});
UserRouter.post("/register", async (req, res) => {
  const { body } = req;
  if (!body) return res.send("Please enter username and password");
  if (!body.username) return res.send("Please enter username");
  if (!body.password) return res.send("Please enter password");
  if (!body.email) return res.send("Please enter email");
  try {
    const isUserThere = await UserModel.findOne({ email: body.email });
    console.log("should be", isUserThere);
    if (isUserThere)
      return res.send({ status: false, message: "user already exist" });
    const user = new UserModel({
      username: body.username,
      password: body.password,
      email: body.email,
      phone: body.phone,
      firstname: body.firstname,
      lastname: body.lastname,
      type: "user",
    });
    await user.save();
    console.log(user);
    return res.status(200).json({ ...user._doc, password: null });
  } catch (error) {
    console.log("object", error);
    return res.status(400).json({ message: error.message });
  }
});

export default UserRouter;
