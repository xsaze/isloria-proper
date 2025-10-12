import {
  Application,
  extend
} from '@pixi/react'
import {
  Container,
  Graphics,
  AnimatedSprite,
  Sprite
} from 'pixi.js'
import { Npc } from "./Npc";
import { IslandRenderer } from "./IslandRenderer";
import { tileLoader } from '../helpers/TileLoader';
import { useEffect, useState } from 'react';


extend({
  Container,
  Graphics,
  AnimatedSprite,
  Sprite
})

export const GameCanvas = ({ frames, gameState, socket }) => {
  console.log("GameCanvas rendering with frames:", frames);
  console.log("GameCanvas gameState:", gameState);

  // Track tile loading state
  const [tilesLoaded, setTilesLoaded] = useState(false);

  // Load tiles on mount
  useEffect(() => {
    const loadTiles = async () => {
      try {
        await tileLoader.load();
        setTilesLoaded(true);
      } catch (error) {
        console.error('Failed to load tiles:', error);
      }
    };

    loadTiles();
  }, []);

  // Get MC and island data from backend gameState
  const mc = gameState?.mc || 0;
  const islandData = gameState?.island || null;

  // MC control functions - emit socket events to backend
  const increaseMc = () => {
    if (socket) {
      socket.emit('mc:increase', 10000);
    }
  };

  const decreaseMc = () => {
    if (socket) {
      socket.emit('mc:decrease', 10000);
    }
  };

  const resetMc = () => {
    if (socket) {
      socket.emit('mc:reset');
    }
  };

  if (!frames) {
    return <div>Loading frames...</div>;
  }

  // Extract NPCs array from gameState, or use empty array as fallback
  const npcs = gameState?.npcs ? Object.entries(gameState.npcs) : [];

  return (
    <>
      {/* MC Control Interface */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        minWidth: '200px'
      }}>
        <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
          MC Control Panel
        </div>
        <div style={{
          fontSize: '24px',
          marginBottom: '15px',
          textAlign: 'center',
          color: mc >= 0 ? '#4ade80' : '#f87171'
        }}>
          {mc.toLocaleString()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={increaseMc}
            style={{
              padding: '8px 12px',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            + 10,000
          </button>
          <button
            onClick={decreaseMc}
            style={{
              padding: '8px 12px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            - 10,000
          </button>
          <button
            onClick={resetMc}
            style={{
              padding: '8px 12px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Game Canvas */}
      <Application resizeTo={window}>
        <container sortableChildren>
          {/* Render Island (if tiles are loaded) */}
          {tilesLoaded && islandData && (
            <IslandRenderer
              islandData={islandData}
              x={0}
              y={0}
            />
          )}

          {/* Render NPCs on top of island */}
          {npcs.map(([npcId, npcData]) => (
            <Npc
              key={npcId}
              frames={frames}
              npcType={npcData.npcType || 'stag'}
              x={npcData.x}
              y={npcData.y}
              state={npcData.state || 'idle'}
              direction={npcData.direction || 'NE'}
            />
          ))}
        </container>
      </Application>
    </>
  )
}