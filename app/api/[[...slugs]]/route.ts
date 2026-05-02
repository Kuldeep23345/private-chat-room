import { redis } from "@/lib/redis";
import { Elysia } from "elysia";
import { nanoid } from "nanoid";
import { authMiddleware } from "./auth";
import z from "zod";
import { Message, realtime } from "@/lib/realtime";

const MAX_ROOM_USERS = 2;

const rooms = new Elysia({ prefix: "/room" })
  .post("/create", async ({ body }) => {
    const roomId = nanoid();
    const ttl = body?.ttl || 60 * 10;
    await redis.hset(`meta:${roomId}`, {
      connected: [],
      createdAt: Date.now(),
    });
    await redis.expire(`meta:${roomId}`, ttl);
    return { roomId };
  }, {
    body: z.object({
      ttl: z.number().optional()
    }).optional()
  })
  .get(
    "/join",
    async ({ query, cookie: { "x-auth-token": token }, set }) => {
      const { roomId } = query;
      const roomExists = await redis.exists(`meta:${roomId}`);
      if (!roomExists) {
        set.status = 404;
        return { error: "Room not found" };
      }

      let userToken = typeof token.value === "string" ? token.value : undefined;
      if (!userToken) {
        userToken = nanoid();
        token.value = userToken;
        token.path = "/";
        token.maxAge = 60 * 10;
        token.httpOnly = true;
      }

      const connectedRaw =
        (await redis.hget<string[]>(`meta:${roomId}`, "connected")) || [];
      const connected = Array.from(
        new Set(
          connectedRaw.filter(
            (token): token is string => typeof token === "string",
          ),
        ),
      );

      if (!connected.includes(userToken)) {
        if (connected.length >= MAX_ROOM_USERS) {
          set.status = 403;
          return { error: "Room is full" };
        }
        connected.push(userToken);
        await redis.hset(`meta:${roomId}`, { connected });
      }

      await realtime.channel(roomId).emit("chat.presence", {
        roomId,
        participants: connected.length,
        maxParticipants: MAX_ROOM_USERS,
      });

      const ttl = await redis.ttl(`meta:${roomId}`);
      return {
        token: userToken,
        ttl,
        participants: connected.length,
        maxParticipants: MAX_ROOM_USERS,
      };
    },
    {
      query: z.object({ roomId: z.string() }),
    },
  )
  .delete(
    "/",
    async ({ query }) => {
      const { roomId } = query;
      await redis.del(`meta:${roomId}`);
      await redis.del(`messages:${roomId}`);
      await realtime
        .channel(roomId)
        .emit("chat.destroy", { isDestroyed: true });
      return { success: true };
    },
    {
      query: z.object({ roomId: z.string() }),
    },
  );

const message = new Elysia({ prefix: "/message" })
  .use(authMiddleware)
  .get("/history", async ({ auth }) => {
    const messages = await redis.lrange(`messages:${auth.roomId}`, 0, -1);
    return messages;
  })
  .post(
    "/",
    async ({ body, auth }) => {
      const { sender, text } = body;
      const roomExists = await redis.exists(`meta:${auth.roomId}`);
      if (!roomExists) {
        throw new Error("Room does not exist");
      }
      const message: Message = {
        id: nanoid(),
        sender,
        text,
        timeStamp: Date.now(),
        roomId: auth.roomId,
      };
      await redis.rpush(`messages:${auth.roomId}`, {
        ...message,
        token: auth.token,
      });
      await realtime.channel(auth.roomId).emit("chat.message", message);

      const remaining = await redis.ttl(`meta:${auth.roomId}`);
      if (remaining > 0) {
        await redis.expire(`messages:${auth.roomId}`, remaining);
      }

      return message;
    },
    {
      query: z.object({ roomId: z.string() }),
      body: z.object({
        sender: z.string().max(100),
        text: z.string().max(1000),
      }),
    },
  );

export const app = new Elysia({ prefix: "/api" })
  .get("/", { user: { name: "John Doe", age: 30 } })
  .use(rooms)
  .use(message);

export type App = typeof app;

export const GET = app.fetch;
export const POST = app.fetch;
export const DELETE = app.fetch;
