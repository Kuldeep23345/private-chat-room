import { handle } from "@upstash/realtime";
import { realtime } from "@/lib/realtime";

const handler = handle({ realtime });

export const GET = handler;
export const POST = handler;
