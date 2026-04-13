"use client";

import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

const ANIMALS = [
  "wolf",
  "hawk",
  "tiger",
  "eagle",
  "lion",
  "panther",
  "fox",
  "bear",
  "leopard",
  "lynx",
];
const STORAGE_KEY = "chat-username";

const generateRandomUsername = () => {
  const word1 = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `anonymous-${word1}-${nanoid(5)}`;
};

const page = () => {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const main = () => {
      const storedUsername = localStorage.getItem(STORAGE_KEY);
      if (storedUsername) {
        setUsername(storedUsername);
        return;
      }
      const generatedUsername = generateRandomUsername();
      localStorage.setItem(STORAGE_KEY, generatedUsername);
      setUsername(generatedUsername);
    };
    main();
  }, []);

  const { mutate: createRome } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post();
    },
  });

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
        </div>

        <div className="border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center text-zinc-500">
                Your Identity
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-950 border-zinc-800 p-3 text-sm text-zinc-400 font-mono">
                  {username}
                </div>
              </div>
            </div>
            <button
              onClick={() => createRome()}
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

export default page;
