import { Text } from "ink";
import { useState, useEffect, useRef } from "react";

const BLOCKS = "▁▂▃▄▅▆▇█";
const BAR_COUNT = 8;

function getColor(intensity: number): string {
  if (intensity < 0.33) return "green";
  if (intensity < 0.66) return "yellow";
  return "magenta";
}

export function Waveform({
  isTyping,
  intensity,
}: {
  isTyping: boolean;
  intensity: number;
}) {
  const [tick, setTick] = useState(0);
  const heights = useRef(new Array(BAR_COUNT).fill(0));

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Update bar heights
  for (let i = 0; i < BAR_COUNT; i++) {
    if (isTyping) {
      const target = (Math.sin(tick * 0.5 + i * 0.8) * 0.5 + 0.5) * intensity;
      heights.current[i] += (target - heights.current[i]) * 0.5;
    } else {
      heights.current[i] *= 0.7;
    }
  }

  const bars = heights.current
    .map((h) => {
      const idx = Math.round(Math.min(1, Math.max(0, h)) * 7);
      return BLOCKS[idx];
    })
    .join("");

  const color = isTyping ? getColor(intensity) : "gray";

  return <Text color={color}>{bars}</Text>;
}
