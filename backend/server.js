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
import presaleRoutes from './routes/presale.js';
import presaleSolanaRoutes from './routes/presaleSolana.js';

// Setup Express
const app = express();

// CORS configuration - allow both main domain and presale subdomain
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'https://binaria.fun',
  'https://island.binaria.fun',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175', // Vite dev server (may use different ports)
  'http://island.localhost:5173' // Vite dev server
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  exposedHeaders: ['X-PAYMENT', 'X-Payment-Required'] // Allow frontend to read x402 headers
}));
app.use(express.json()); // Parse JSON bodies

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
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

// Setup presale routes
// PRIMARY: Solana presale with x402
app.use('/api/presale', presaleSolanaRoutes);

// BACKUP: BSC presale (kept for fallback)
// Uncomment to switch back to BSC:
// app.use('/api/presale', presaleRoutes);

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
