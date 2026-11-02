import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { searchUsersQuerySchema, type SearchUsersQuery } from "@chat/shared";
import { searchUsers } from "../services/user.service.js";

const userRouter = Router();

userRouter.get(
  "/search",
  requireAuth,
  validate(searchUsersQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const { q } = res.locals.query as SearchUsersQuery;
      const users = await searchUsers(q, req.user!.sub);
      res.json(users);
    } catch (error) {
      next(error);
    }
  },
);

export { userRouter };
