import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import {
  findOrCreateDirectRoom,
  getRoomMessages,
  listMyRooms,
} from "../services/room.service.js";
import {
  roomIdParamsSchema,
  getMessagesQuerySchema,
  type RoomIdParams,
  type GetMessagesQuery,
  createDirectRoomInputSchema,
  CreateDirectRoomInput,
} from "@chat/shared";
import { toRoomDto } from "../helper/mapper.js";

const roomRouter = Router();

roomRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const rooms = await listMyRooms(req.user!.sub);
    res.json(rooms);
  } catch (error) {
    next(error);
  }
});

roomRouter.get(
  "/:id/messages",
  requireAuth,
  validate(roomIdParamsSchema, "params"),
  validate(getMessagesQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const { id } = res.locals.params as RoomIdParams;
      const { limit } = res.locals.query as GetMessagesQuery;

      const result = await getRoomMessages(id, req.user!.sub, { limit });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

roomRouter.post(
  "/direct",
  requireAuth,
  validate(createDirectRoomInputSchema), // body is the default source
  async (req, res, next) => {
    try {
      const { targetUserId } = req.body as CreateDirectRoomInput;

      const { room, created } = await findOrCreateDirectRoom(
        req.user!.sub,
        targetUserId,
      );

      res.status(created ? 201 : 200).json({
        room,
        created,
      });
    } catch (error) {
      next(error);
    }
  },
);

export { roomRouter };
