import { z } from "zod";
import { boolean } from "zod/v4";

// Mirrors the Prisma RoomType enum
export const roomTypeSchema = z.enum(["DIRECT", "GROUP"]);
export type RoomType = z.infer<typeof roomTypeSchema>;

// Basic user info shown in the UI (never email or password hash)
export const roomUserSchema = z.object({
  id: z.string(),
  username: z.string(),
});
export type RoomUser = z.infer<typeof roomUserSchema>;

// The room as the client sees it
export const roomSchema = z.object({
  id: z.string(),
  // Nullable: direct rooms have no name of their own
  name: z.string().min(1).max(100).nullable(),
  type: roomTypeSchema,
  createdAt: z.string().datetime(),
  // directKey and updatedAt are intentionally NOT exposed
});

export type Room = z.infer<typeof roomSchema>;

// Conversation list entry (what listMyRooms will return)
export const roomListItemSchema = roomSchema.extend({
  // For DIRECT rooms: the other person, used as the display name.
  // For GROUP rooms: null.
  otherUser: roomUserSchema.nullable(),
  lastMessage: z
    .object({
      text: z.string(),
      createdAt: z.string().datetime(),
      authorId: z.string(),
    })
    .nullable(),
});

export type RoomListItem = z.infer<typeof roomListItemSchema>;

// Input for starting a direct chat: POST /rooms/direct
export const createDirectRoomInputSchema = z.object({
  targetUserId: z.string().min(1),
});

export type CreateDirectRoomInput = z.infer<typeof createDirectRoomInputSchema>;

export const roomIdParamsSchema = z.object({
  id: z.string().min(1),
});

export type RoomIdParams = z.infer<typeof roomIdParamsSchema>;

export const createDirectRoomResponseSchema = z.object({
  room: roomSchema,
  created: z.boolean(),
});

export type CreateDirectRoomResponse = z.infer<
  typeof createDirectRoomResponseSchema
>;
