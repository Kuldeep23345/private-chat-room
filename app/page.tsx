"use client";

import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Page = () => {
  const { username, updateUsername } = useUsername();
  const router = useRouter();
  const [roomInput, setRoomInput] = useState("");
  const [joinError, setJoinError] = useState("");

  const { mutate: createRoom } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post();
      if (res.status === 200) {
        router.push(`/room/${res.data?.roomId}`);
      }
    },
  });

  const extractRoomId = (value: string) => {
    const raw = value.trim();
    if (!raw) return null;

    const roomPathMatch = raw.match(/(?:^|\/)room\/([A-Za-z0-9_-]+)/);
    if (roomPathMatch?.[1]) return roomPathMatch[1];

    try {
      const url = new URL(raw);
      const parts = url.pathname.split("/").filter(Boolean);
      const roomIndex = parts.indexOf("room");
      if (roomIndex >= 0 && parts[roomIndex + 1]) {
        return parts[roomIndex + 1];
      }
    } catch {
      try {
        const url = new URL(`https://${raw}`);
        const parts = url.pathname.split("/").filter(Boolean);
        const roomIndex = parts.indexOf("room");
        if (roomIndex >= 0 && parts[roomIndex + 1]) {
          return parts[roomIndex + 1];
        }
      } catch {
        // ignore invalid URLs and try raw-id fallback below
      }
    }

    if (/^[A-Za-z0-9_-]+$/.test(raw)) return raw;
    return null;
  };

  const joinRoom = () => {
    setJoinError("");
    const roomId = extractRoomId(roomInput);
    if (!roomId) {
      setJoinError("Enter a valid room ID or room invite link.");
      return;
    }
    router.push(`/room/${roomId}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-green-500">
            {">"}private_chat
          </h1>
          <p className="text-zinc-500 text-sm">
            A private, self-destructing chat room.
          </p>
          <p className="text-zinc-600 text-xs">Maximum 2 users per room.</p>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center text-zinc-500 text-xs uppercase tracking-widest">
                Room ID / Invite Link
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => {
                    setRoomInput(e.target.value);
                    if (joinError) setJoinError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") joinRoom();
                  }}
                  className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-200 font-mono focus:outline-none focus:border-zinc-700 transition-colors"
                  placeholder="Paste room ID or full room URL..."
                />
                <button
                  onClick={joinRoom}
                  disabled={!roomInput.trim()}
                  className="bg-zinc-800 text-zinc-300 px-4 py-3 text-xs font-bold hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  JOIN
                </button>
              </div>
              {joinError && <p className="text-xs text-red-400">{joinError}</p>}
            </div>
            <div className="space-y-2">
              <label className="flex items-center text-zinc-500 text-xs uppercase tracking-widest">
                Your Identity
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => updateUsername(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-sm text-green-500 font-mono focus:outline-none focus:border-zinc-700 transition-colors"
                  placeholder="Enter your alias..."
                />
              </div>
            </div>
            <button
              onClick={() => createRoom()}
              disabled={!username.trim()}
              className="w-full bg-zinc-100 text-black p-3 text-sm font-bold hover:bg-zinc-50 hover:text-black transition-colors mt-2 cursor-pointer disabled:opacity-50"
            >
              CREATE SECURE ROOM
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
