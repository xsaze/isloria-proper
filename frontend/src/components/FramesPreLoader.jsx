import { useEffect, useState } from "react";
import { frameGenerator } from "../helpers/frameGenerator";
import { SPRITE_SHEETS } from "../helpers/SPRITE_SHEETS";


export default function FramesPreLoader({ onLoaded }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const total = Object.values(SPRITE_SHEETS).reduce(
        (sum, stances) => sum + Object.keys(stances).length,
        0
      );
      let count = 0;

      const result = {};

      for (const [animalType, stances] of Object.entries(SPRITE_SHEETS)) {
        result[animalType] = {};

        for (const [stance, data] of Object.entries(stances)) {
          const { image, frameWidth, frameHeight, rows, cols } = data;
          const frames = await frameGenerator({
            [animalType]: { [stance]: data },
          });

          result[animalType][stance] = frames[animalType][stance];

          count++;
          if (isMounted) setProgress(Math.round((count / total) * 100));
        }
      }

      if (isMounted && onLoaded) onLoaded(result);
    })();

    return () => {
      isMounted = false;
    };
  }, [onLoaded]);

  return (
    <div className="fixed bottom-4 right-4 text-sm text-gray-500">
      Loading sprites... {progress}%
    </div>
  );
}
