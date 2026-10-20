import { z } from "zod";

export const messageSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  authorId: z.string(),
  author: z.string().min(1).max(50),
  text: z.string().min(1).max(2000),
  createdAt: z.string().datetime(),
});

export type Message = z.infer<typeof messageSchema>;

export const sendMessageInputSchema = z.object({
  roomId: z.string(),
  text: z.string().min(1).max(2000),
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;
