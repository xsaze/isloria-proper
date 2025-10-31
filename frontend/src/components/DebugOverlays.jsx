import { useMemo } from 'react';
import { TextStyle } from 'pixi.js';

/**
 * Debug overlays to visualize coordinate zones
 * Helps debug viewport centering and coordinate system issues
 */
export function DebugOverlays({ islandData, viewportRef }) {
  // Calculate island bounds from actual tile positions
  const islandBounds = useMemo(() => {
    if (!islandData || !islandData.tiles || islandData.tiles.length === 0) {
      return null;
    }

    const TILE_WIDTH = 64;
    const TILE_HEIGHT = 32;
    const backendOriginX = 400;
    const backendOriginY = 200;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    // Match the exact gridToWorld calculation from IslandRenderer.jsx
    const gridToWorld = (gridX, gridY) => {
      const worldX = ((gridX - gridY) * (TILE_WIDTH / 2)) + backendOriginX;
      const worldY = ((gridX + gridY) * (TILE_HEIGHT / 2)) + backendOriginY;

      // Apply the same shift as in IslandRenderer
      const shiftX = 4600; // 5000 - 400
      const shiftY = 3520; // 5000 - 1480

      return {
        x: worldX + shiftX,
        y: worldY + shiftY
      };
    };

    // Find bounds of actual tiles (with shift applied)
    islandData.tiles.forEach(tile => {
      const worldPos = gridToWorld(tile.x, tile.y);
      minX = Math.min(minX, worldPos.x);
      maxX = Math.max(maxX, worldPos.x);
      minY = Math.min(minY, worldPos.y);
      maxY = Math.max(maxY, worldPos.y);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX + TILE_WIDTH,
      height: maxY - minY + TILE_HEIGHT,
      originalCenter: {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2
      },
      offsetCenter: {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2
      }
    };
  }, [islandData]);

  return (
    <container>
      {/* Ocean Bounds Overlay - Blue */}
      <graphics
        draw={(g) => {
          g.clear();
          g.lineStyle(4, 0x0000FF, 0.8); // Blue border
          g.drawRect(0, 0, 10000, 10000);
          g.beginFill(0x0000FF, 0.05); // Very transparent blue fill
          g.drawRect(0, 0, 10000, 10000);
          g.endFill();
        }}
        zIndex={9998}
      />

      {/* Ocean Label */}
      <text
        text="Ocean Bounds: (0,0) to (10000,10000)"
        x={100}
        y={100}
        style={new TextStyle({
          fontFamily: 'Arial',
          fontSize: 24,
          fill: 0x0000FF,
          stroke: 0x000000,
          strokeThickness: 3
        })}
        zIndex={9999}
      />

      {/* Island Bounds Overlay - Green */}
      {islandBounds && (
        <>
          <graphics
            draw={(g) => {
              g.clear();
              g.lineStyle(4, 0x00FF00, 0.8); // Green border
              g.drawRect(islandBounds.x, islandBounds.y, islandBounds.width, islandBounds.height);
              g.beginFill(0x00FF00, 0.1); // Semi-transparent green fill
              g.drawRect(islandBounds.x, islandBounds.y, islandBounds.width, islandBounds.height);
              g.endFill();
            }}
            zIndex={9998}
          />

          {/* Island Label */}
          <text
            text={`Island Bounds\nOriginal Center: (${Math.round(islandBounds.originalCenter.x)}, ${Math.round(islandBounds.originalCenter.y)})\nOffset Center: (${Math.round(islandBounds.offsetCenter.x)}, ${Math.round(islandBounds.offsetCenter.y)})`}
            x={islandBounds.x + 10}
            y={islandBounds.y + 10}
            style={new TextStyle({
              fontFamily: 'Arial',
              fontSize: 18,
              fill: 0x00FF00,
              stroke: 0x000000,
              strokeThickness: 3
            })}
            zIndex={9999}
          />
        </>
      )}

      {/* Ocean Center Marker - Red Crosshair at (5000, 5000) */}
      <graphics
        draw={(g) => {
          g.clear();
          g.lineStyle(3, 0xFF0000, 1); // Red
          // Vertical line
          g.moveTo(5000, 4800);
          g.lineTo(5000, 5200);
          // Horizontal line
          g.moveTo(4800, 5000);
          g.lineTo(5200, 5000);
          // Center dot
          g.beginFill(0xFF0000, 1);
          g.drawCircle(5000, 5000, 8);
          g.endFill();
        }}
        zIndex={9999}
      />

      {/* Ocean Center Label */}
      <text
        text="Ocean/Island Center (5000, 5000)"
        x={5020}
        y={4980}
        style={new TextStyle({
          fontFamily: 'Arial',
          fontSize: 20,
          fill: 0xFF0000,
          stroke: 0x000000,
          strokeThickness: 3,
          fontWeight: 'bold'
        })}
        zIndex={9999}
      />

      {/* Viewport Center Marker - Yellow */}
      {viewportRef?.current && (
        <>
          <graphics
            draw={(g) => {
              const viewport = viewportRef.current;
              if (!viewport) return;

              // Calculate viewport center in world coordinates
              const centerX = viewport.center.x;
              const centerY = viewport.center.y;

              g.clear();
              g.lineStyle(3, 0xFFFF00, 1); // Yellow
              // Vertical line
              g.moveTo(centerX, centerY - 150);
              g.lineTo(centerX, centerY + 150);
              // Horizontal line
              g.moveTo(centerX - 150, centerY);
              g.lineTo(centerX + 150, centerY);
              // Center dot
              g.beginFill(0xFFFF00, 1);
              g.drawCircle(centerX, centerY, 6);
              g.endFill();
            }}
            zIndex={9999}
          />

          <text
            text={`Viewport Center\n(${Math.round(viewportRef.current.center.x)}, ${Math.round(viewportRef.current.center.y)})`}
            x={viewportRef.current.center.x + 20}
            y={viewportRef.current.center.y - 40}
            style={new TextStyle({
              fontFamily: 'Arial',
              fontSize: 18,
              fill: 0xFFFF00,
              stroke: 0x000000,
              strokeThickness: 3
            })}
            zIndex={9999}
          />
        </>
      )}
    </container>
  );
}
