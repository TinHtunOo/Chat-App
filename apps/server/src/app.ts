import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { prisma } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.routes.js";

export const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
}); 

app.get("/health/db", async (_req, res) => {
  try {
    const users = await prisma.user.count();
    res.json({ status: "ok", database: "connected", users });
  } catch (error) {
    console.error("database health check failed", error);
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});

app.use("/auth", authRouter);

app.use(errorHandler);
