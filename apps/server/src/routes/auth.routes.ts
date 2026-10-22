import { Router } from "express";
import { loginInputSchema, registerInputSchema } from "@chat/shared";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import {
  getUserById,
  login,
  register,
} from "../services/auth.service.js";

export const authRouter = Router();

authRouter.post("/register", validate(registerInputSchema), async (req, res) => {
  const result = await register(req.body);
  res.status(201).json(result);
});

authRouter.post("/login", validate(loginInputSchema), async (req, res) => {
  const result = await login(req.body);
  res.json(result);
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await getUserById(req.user!.sub);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user });
});
