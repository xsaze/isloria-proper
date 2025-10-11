// src/utils/spriteUtils.js
import { Texture } from 'pixi.js';

export async function splitSpriteSheet(src, frameWidth, frameHeight, rows, cols) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const frames = [];

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // Create a separate canvas for each frame
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = frameWidth;
          canvas.height = frameHeight;

          ctx.drawImage(
            img,
            x * frameWidth,
            y * frameHeight,
            frameWidth,
            frameHeight,
            0,
            0,
            frameWidth,
            frameHeight
          );

          // Create PixiJS Texture directly from canvas (PixiJS v8 API)
          const texture = Texture.from(canvas);
          frames.push(texture);
        }
      }

      resolve(frames);
    };
    img.onerror = reject;
  });
}

export async function frameGenerator(animals) {
  const result = {};

  for (const [animalType, stances] of Object.entries(animals)) {
    result[animalType] = {};

    for (const [stance, data] of Object.entries(stances)) {
      const {
        image,
        frameWidth = 64,
        frameHeight = 64,
        rows = 1,
        cols = 4,
      } = data;

      const frames = await splitSpriteSheet(
        image,
        frameWidth,
        frameHeight,
        rows,
        cols
      );

      result[animalType][stance] = { frames };
    }
  }

  return result;
}
