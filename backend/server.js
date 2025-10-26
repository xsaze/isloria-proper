/**
 * Main server entry point - now using modular architecture!
 */

import 'dotenv/config';
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

// Import game modules
import { NpcManager } from './npc/NpcManager.js';
import { GameState } from './game/GameState.js';
import { GameLoop } from './game/GameLoop.js';
import { NetworkManager } from './game/NetworkManager.js';
import { PricePoller } from './services/PricePoller.js';

// Setup Express
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*"
  }
});

// Initialize game systems
console.log('🎮 Initializing game systems...');

const npcManager = new NpcManager();
npcManager.initialize();

const gameState = new GameState(npcManager);
const networkManager = new NetworkManager(io, gameState);
const pricePoller = new PricePoller(gameState, networkManager);
const gameLoop = new GameLoop(gameState, networkManager);

// Update networkManager with pricePoller reference (circular dependency fix)
networkManager.pricePoller = pricePoller;

// Initialize network manager (sets up socket handlers)
networkManager.initialize();

// Start the game loop
gameLoop.start();

// Auto-start price polling if enabled via env var
if (process.env.AUTO_START_PRICE_POLLING === 'true') {
  pricePoller.start();
  console.log('📈 Price polling auto-started (controlled by AUTO_START_PRICE_POLLING env var)');
} else {
  console.log('📊 Price polling disabled (set AUTO_START_PRICE_POLLING=true to enable)');
}

// Start HTTP server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Initial state:`, gameState.getStats());
  console.log('');
  console.log('✨ Modular backend architecture active!');
  console.log('   - NpcManager: Handles NPC logic');
  console.log('   - GameLoop: Runs at 60 FPS');
  console.log('   - NetworkManager: Broadcasts at 30 FPS');
  console.log('   - All NPCs synchronized across all clients');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  pricePoller.stop();  // Stop price polling
  gameLoop.stop();
  server.close(() => {
    console.log('👋 Server shut down gracefully');
    process.exit(0);
  });
});
