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
import { OceanBackground } from "./OceanBackground";
import { WalkableGridDebug } from "./WalkableGridDebug";
import { NpcDebugOverlay } from "./NpcDebugOverlay";
import { tileLoader } from '../helpers/TileLoader';
import { useEffect, useState } from 'react';


extend({
  Container,
  Graphics,
  AnimatedSprite,
  Sprite
})

export const GameCanvas = ({ frames, gameState, socket }) => {

  // Track tile loading state
  const [tilesLoaded, setTilesLoaded] = useState(false);

  // Debug overlays visibility
  const [showWalkableGrid, setShowWalkableGrid] = useState(false);
  const [showNpcDebug, setShowNpcDebug] = useState(false);

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
  const walkableGrid = islandData?.walkableGrid || null;

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

  const resetState = () => {
    if (socket) {
      socket.emit('game:reset');
    }
  };

  if (!frames) {
    return <div>Loading frames...</div>;
  }

  // Extract NPCs array from gameState, or use empty array as fallback
  const npcs = gameState?.npcs ? Object.entries(gameState.npcs) : [];

  // Calculate offset to center everything on screen
  // The island's center tile should be at the screen center
  const gridSize = islandData?.gridSize || 5;
  const centerTile = Math.floor(gridSize / 2);

  // Calculate where the center tile is in world coordinates (backend coordinate system)
  const TILE_WIDTH = 64;
  const TILE_HEIGHT = 32;
  const backendOriginX = 400;
  const backendOriginY = 200;
  const islandCenterX = ((centerTile - centerTile) * (TILE_WIDTH / 2)) + backendOriginX;
  const islandCenterY = ((centerTile + centerTile) * (TILE_HEIGHT / 2)) + backendOriginY;

  // Calculate offset to center the island's center tile on screen
  const centerOffsetX = (window.innerWidth / 2) - islandCenterX;
  const centerOffsetY = (window.innerHeight / 2) - islandCenterY;

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
            onClick={resetState}
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
          <button
            onClick={() => setShowWalkableGrid(!showWalkableGrid)}
            style={{
              padding: '8px 12px',
              background: showWalkableGrid ? '#10b981' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginTop: '8px'
            }}
          >
            {showWalkableGrid ? '✓ ' : ''}Grid
          </button>
          <button
            onClick={() => setShowNpcDebug(!showNpcDebug)}
            style={{
              padding: '8px 12px',
              background: showNpcDebug ? '#3b82f6' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginTop: '8px'
            }}
          >
            {showNpcDebug ? '✓ ' : ''}NPC Debug
          </button>
        </div>
      </div>

      {/* Game Canvas */}
      <Application resizeTo={window}>
        <container sortableChildren>
          {/* Render Ocean Background (simple colored rectangle) */}
          <OceanBackground />

          {/* Render Island (if tiles are loaded) */}
          {tilesLoaded && islandData && (
            <IslandRenderer
              islandData={islandData}
              x={0}
              y={0}
            />
          )}

          {/* DEBUG: Render Walkable Grid Overlay */}
          {showWalkableGrid && walkableGrid && (
            <WalkableGridDebug
              walkableGrid={walkableGrid}
              gridSize={gridSize}
              visible={showWalkableGrid}
            />
          )}

          {/* Render NPCs on top of island */}
          {npcs.map(([npcId, npcData]) => {
            // Adjust NPC position by half tile north to align with visual tile center
            // In isometric view, half tile = 16px up
            const npcYAdjustment = 0;
            return (
              <Npc
                key={npcId}
                frames={frames}
                npcType={npcData.npcType || 'stag'}
                x={npcData.x + centerOffsetX}
                y={npcData.y + centerOffsetY + npcYAdjustment}
                state={npcData.state || 'idle'}
                direction={npcData.direction || 'NE'}
              />
            );
          })}

          {/* DEBUG: NPC Anchor Points and Foot Positions */}
          {showNpcDebug && (
            <NpcDebugOverlay
              npcs={npcs}
              centerOffsetX={centerOffsetX}
              centerOffsetY={centerOffsetY}
              visible={showNpcDebug}
            />
          )}
        </container>
      </Application>
    </>
  )
}