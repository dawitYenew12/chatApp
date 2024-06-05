import { signup_post, login_post, logout_get } from "../controllers/authController.js";
import express from "express";
export const userRouter = express.Router();

userRouter.post('/signup', signup_post);
userRouter.post('/login', login_post);
userRouter.get('/logout', logout_get);

export default userRouter;

