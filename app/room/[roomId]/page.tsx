"use client";

import { Message as MessageComponent } from "@/components/message";
import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import type { Message } from "@/lib/realtime";
import { useRealtime } from "@/lib/realtime-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type PresenceData = {
  roomId: string;
  participants: number;
  maxParticipants: number;
};

const Page = () => {
  const param = useParams();
  const roomId = param.roomId as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { username } = useUsername();

  const [isDestroyed, setIsDestroyed] = useState(false);
  const [presence, setPresence] = useState<PresenceData | null>(null);

  // Join the room and get TTL
  const { data: joinData, error: joinError } = useQuery({
    queryKey: ["join", roomId],
    queryFn: async () => {
      const res = await client.room.join.get({ query: { roomId } });
      if (res.error) {
        throw new Error(res.error.value.summary ?? "Failed to join room");
      }
      return { ...res.data, joinedAt: Date.now() };
    },
    enabled: !!roomId,
    retry: false,
  });

  // Fetch message history
  const { data: history } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await client.message.history.get({ query: { roomId } });
      const data = res.data ?? [];
      return data.map((item) =>
        typeof item === "string"
          ? (JSON.parse(item) as Message)
          : (item as Message),
      );
    },
    enabled: !!joinData,
  });

  // Real-time updates
  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.presence", "chat.destroy"],
    onData: ({ event, data }) => {
      if (event === "chat.message") {
        const message = data as Message;
        queryClient.setQueryData(
          ["messages", roomId],
          (old: Message[] = []) => {
            if (old.some((item) => item.id === message.id)) return old;
            return [...old, message];
          },
        );
      } else if (event === "chat.presence") {
        const presence = data as PresenceData;
        if (presence.roomId === roomId) {
          setPresence(presence);
        }
      } else if (event === "chat.destroy") {
        setIsDestroyed(true);
      }
    },
  });

  // Timer logic
  useEffect(() => {
    if (!joinData?.ttl) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [joinData?.ttl]);

  const timeRemaining =
    joinData?.ttl && joinData.joinedAt
      ? Math.max(0, joinData.ttl - Math.floor((now - joinData.joinedAt) / 1000))
      : null;

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      const res = await client.message.post(
        {
          sender: username,
          text,
        },
        { query: { roomId } },
      );
      if (res.error) {
        throw new Error("Failed to send message");
      }
      return res.data as Message;
    },
    onSuccess: (message) => {
      queryClient.setQueryData(["messages", roomId], (old: Message[] = []) => {
        if (old.some((item) => item.id === message.id)) return old;
        return [...old, message];
      });
    },
  });

  const { mutate: destroyRoom } = useMutation({
    mutationFn: async () => {
      await client.room.delete(undefined, { query: { roomId } });
    },
    onSuccess: () => {
      setIsDestroyed(true);
    },
  });

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (joinError) {
    const errorMessage =
      joinError instanceof Error
        ? joinError.message
        : "Failed to join this room.";
    const isRoomFull = errorMessage.toLowerCase().includes("full");

    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-500">
            {isRoomFull ? "ROOM FULL" : "ROOM NOT FOUND"}
          </h1>
          <p className="text-zinc-500">
            {isRoomFull
              ? "This room already has maximum participants."
              : "This room may have expired or been destroyed."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-zinc-400 hover:text-white underline text-sm"
          >
            GO BACK HOME
          </button>
        </div>
      </main>
    );
  }

  if (isDestroyed || timeRemaining === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">💥</div>
          <h1 className="text-2xl font-bold text-zinc-100">ROOM DESTROYED</h1>
          <p className="text-zinc-500 italic">
            &quot;This message will self-destruct in...&quot;
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-zinc-100 text-black px-6 py-2 text-sm font-bold hover:bg-white transition-colors mt-4"
          >
            NEW SESSION
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-screen max-h-screen overflow-hidden">
      <header className="border-b border-zinc-800 p-3 sm:p-4 flex items-center justify-between bg-zinc-900/30 sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-xs text-zinc-500 uppercase hidden sm:block">
              Room ID
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-500 truncate text-sm sm:text-base">
                {roomId}
              </span>
              <button
                onClick={copyLink}
                className="text-[9px] sm:text-[10px] bg-zinc-800 hover:bg-zinc-700 px-1.5 sm:px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div className="h-6 sm:h-8 w-px bg-zinc-800 shrink-0" />
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] sm:text-xs text-zinc-500 uppercase hidden sm:block">
              Users
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-200">
              {presence?.participants ?? joinData?.participants ?? "--"}/
              {presence?.maxParticipants ?? joinData?.maxParticipants ?? 2}
            </span>
          </div>
          <div className="h-6 sm:h-8 w-px bg-zinc-800 shrink-0" />
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] sm:text-xs text-zinc-500 uppercase hidden sm:block">
              Destruct
            </span>
            <span
              className={`text-xs sm:text-sm font-bold flex items-center gap-2 ${timeRemaining !== null && timeRemaining < 60 ? "text-red-500" : "text-amber-500"}`}
            >
              {timeRemaining !== null ? formatTime(timeRemaining) : "--:--"}
            </span>
          </div>
        </div>
        <button
          onClick={() => destroyRoom()}
          className="text-xs bg-zinc-800 hover:bg-red-600 px-2 sm:px-3 py-1.5 rounded text-zinc-400 hover:text-white font-bold transition-all group flex items-center gap-2 disabled:opacity-50 shrink-0"
        >
          <span className="group-hover:animate-pulse">💣</span>
          <span className="hidden sm:inline">DESTROY NOW</span>
        </button>
      </header>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 scrollbar-thin max-w-4xl mx-auto w-full"
      >
        {history?.map((msg) => (
          <MessageComponent
            key={msg.id}
            message={msg}
            isMe={msg.sender === username}
          />
        ))}
        {(!history || history.length === 0) && (
          <div className="h-full flex flex-col items-center justify-center space-y-2 opacity-50">
            <span className="text-sm text-zinc-500 italic">
              No messages yet.
            </span>
            <span className="text-xs text-zinc-600">
              The walls have no ears.
            </span>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-900/30">
        <div className="flex gap-2 sm:gap-4 max-w-4xl mx-auto w-full">
          <div className="flex-1 relative group">
            <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-green-500 animate animate-pulse text-xs sm:text-sm">
              {`>`}
            </span>
            <input
              type="text"
              ref={inputRef}
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  sendMessage({ text: input });
                  setInput("");
                  inputRef.current?.focus();
                }
              }}
              className="w-full bg-black border border-zinc-800 focus:border-zinc-700 focus:outline-none transition-colors text-zinc-100 placeholder:text-zinc-700 py-2.5 sm:py-3 pl-7 sm:pl-8 pr-3 sm:pr-4 text-sm sm:text-base"
              placeholder="Type a message..."
            />
          </div>
          <button
            onClick={() => {
              if (input.trim()) {
                sendMessage({ text: input });
                inputRef.current?.focus();
                setInput("");
              }
            }}
            disabled={!input.trim() || isPending}
            className="bg-zinc-800 text-zinc-400 px-4 sm:px-6 text-xs sm:text-sm font-bold hover:text-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            SEND
          </button>
        </div>
      </div>
    </main>
  );
};

export default Page;
