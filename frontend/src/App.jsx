import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { GameCanvas } from "./components/GameCanvas"
import FramesPreLoader from "./components/FramesPreLoader";

const socket = io("http://localhost:3001", {
  transports: ['websocket', 'polling']
});

function App() {
  const [gameState, setGameState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [frames, setFrames] = useState(null);

  useEffect(() => {
    // Connection event handlers
    socket.on("connect", () => {
      console.log("✅ Connected to backend:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from backend");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("⚠️ Connection error:", error.message);
      setIsConnected(false);
    });

    // Full state updates (initial + periodic sync)
    socket.on("gameState", (data) => {
      setGameState(data);
    });

    // OPTIMIZED: Delta updates (only changes)
    socket.on("gameStateDelta", (delta) => {
      setGameState((prevState) => {
        if (!prevState) return prevState;

        const newState = { ...prevState };

        // Update MC
        if (delta.mc !== undefined) {
          newState.mc = delta.mc;
        }

        // Merge NPC updates
        if (delta.npcs) {
          newState.npcs = {
            ...prevState.npcs,
            ...delta.npcs
          };
        }

        // Remove NPCs
        if (delta.removedNpcs && delta.removedNpcs.length > 0) {
          newState.npcs = { ...prevState.npcs };
          for (const npcId of delta.removedNpcs) {
            delete newState.npcs[npcId];
          }
        }

        // Merge island updates (if any)
        if (delta.island) {
          newState.island = {
            ...prevState.island,
            ...delta.island
          };
        }

        newState.timestamp = delta.timestamp;

        return newState;
      });
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("gameState");
      socket.off("gameStateDelta");
    };
  }, []);

  if (!frames) {
    return <FramesPreLoader onLoaded={setFrames} />;
  }



  return (
    <>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px', borderRadius: '5px' }}>
        Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}
      </div>
      <GameCanvas gameState={gameState} frames={frames} socket={socket} />
    </>
  );
}

export default App;