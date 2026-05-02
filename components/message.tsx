import { Message as MessageType } from "@/lib/realtime";

interface MessageProps {
  message: MessageType;
  isMe: boolean;
}

export const Message = ({ message, isMe }: MessageProps) => {
  return (
    <div
      className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1 mb-4`}
    >
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
          {message.sender}
        </span>
        <span className="text-[10px] text-zinc-600 font-mono">
          {new Date(message.timeStamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div
        className={`max-w-[85%] sm:max-w-[75%] px-3 sm:px-4 py-2 rounded-lg text-sm break-words whitespace-pre-wrap ${
          isMe
            ? "bg-green-500/10 border border-green-500/20 text-green-400"
            : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-300"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
};
