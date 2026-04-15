# Private Chat

A self-destructing private chat application that creates secure, ephemeral chat rooms with a maximum of 2 participants per room.

## Features

- **Ephemeral Rooms** - Chat rooms that expire after 10 minutes
- **End-to-End Privacy** - Rooms and messages are permanently deleted when destroyed
- **Real-time Messaging** - WebSocket-based instant messaging
- **Anonymous Identity** - Auto-generated usernames that persist locally
- **Room Invites** - Share room links with anyone to start a private conversation
- **Self-Destruct Timer** - Visual countdown showing remaining room lifetime

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Backend | Elysia, Bun |
| Database | Upstash Redis |
| Real-time | Upstash Realtime (WebSockets) |
| State Management | TanStack Query, Zod |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) or Node.js
- [Upstash Redis](https://upstash.com) account

### Environment Setup

Create a `.env.local` file in the root directory:

```env
UPSTASH_REDIS_REST_URL="your-upstash-redis-rest-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"
```

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes & auth middleware
│   ├── room/[roomId]/    # Chat room page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
├── hooks/                # Custom React hooks
├── lib/                  # Redis, realtime, and client utilities
├── proxy.ts              # Middleware for room validation
└── styles/               # Global styles
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |

## How It Works

1. **Create a Room** - Generate a unique room with a shareable link
2. **Invite Someone** - Share the room link with one other person
3. **Chat Securely** - Messages are sent in real-time via WebSockets
4. **Auto-Cleanup** - Rooms expire after 10 minutes or can be destroyed instantly
