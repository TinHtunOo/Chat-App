import { z } from "zod";

export const messageSchema = z.object({
  id: z.string(),
  author: z.string().min(1).max(50),
  text: z.string().min(1).max(2000),
  createdAt: z.string().datetime(),
});

export type Message = z.infer<typeof messageSchema>;

export const sendMessageSchema = messageSchema.pick({
  author: true,
  text: true,
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
