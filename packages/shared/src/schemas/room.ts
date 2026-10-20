import { z } from "zod";

export const roomSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
});

export type Room = z.infer<typeof roomSchema>;

export const createRoomInputSchema = z.object({
  name: z.string().min(1).max(100),
});

export type CreateRoomInput = z.infer<typeof createRoomInputSchema>;
