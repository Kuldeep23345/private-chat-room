import { treaty } from "@elysiajs/eden";
import { app } from "../app/api/[[...slugs]]/route";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
};

export const client = treaty<typeof app>(getBaseUrl()).api;

