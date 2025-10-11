import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Define possible directions
const DIRECTIONS = ["NE", "NW", "SE", "SW"];

// Create NPCs with different types and starting positions
// Note: Different animals have different available states:
// - stag: idle, walk, run
// - boar: idle, run (no walk!)
// - player: idle, walk (no run!)
let gameState = {
  npcs: {
    // Cluster 1: NPCs that will likely collide with each other (center area)
    stag1: { x: 400, y: 300, animation: "walk", direction: "NE", npcType: "stag", speed: 1.5 },
    stag2: { x: 450, y: 300, animation: "walk", direction: "SW", npcType: "stag", speed: 1.2 },
    player1: { x: 425, y: 350, animation: "walk", direction: "NW", npcType: "player", speed: 1.3 },

    // Cluster 2: NPCs spread around to test independent movement
    stag3: { x: 200, y: 200, animation: "walk", direction: "SE", npcType: "stag", speed: 1.8 },
    boar1: { x: 600, y: 200, animation: "run", direction: "SW", npcType: "boar", speed: 1.5 },

    // Single NPC for control (will move freely without immediate collisions)
    stag4: { x: 300, y: 450, animation: "run", direction: "NE", npcType: "stag", speed: 1.4 },
    wolf1: { x: 300, y: 450, animation: "run", direction: "NE", npcType: "wolf", speed: 1.4 }
  },
};

// Every 2 seconds, change direction randomly and broadcast to all clients
setInterval(() => {
  for (const npc of Object.values(gameState.npcs)) {
    const randomDir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    npc.direction = randomDir;
    npc.animation = "idle";
  }
  // Broadcast updated gameState to all connected clients
  io.emit("gameState", gameState);
}, 2000);

io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);
  console.log("📤 Sending initial gameState:", gameState);
  socket.emit("gameState", gameState);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });

  socket.on("error", (error) => {
    console.error("⚠️ Socket error:", error);
  });
});

server.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
  console.log("📊 Initial gameState:", JSON.stringify(gameState, null, 2));
});
