import { Elysia } from "elysia";

const rooms = new Elysia({ prefix: "/room" }).post("/create", () => {
  console.log("CREATE A ROOM");
});

export const app = new Elysia({ prefix: "/api" })
  .get("/", { user: { name: "John Doe", age: 30 } })
  .use(rooms);

export const GET = app.fetch;
export const POST = app.fetch;
