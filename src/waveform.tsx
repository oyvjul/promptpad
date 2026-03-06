import { Text } from "ink";
import { useState, useEffect, useRef } from "react";

const BLOCKS = "▁▂▃▄▅▆▇█";
const BAR_COUNT = 8;

function getBarColor(height: number): string {
  if (height < 0.4) return "cyan";
  if (height < 0.7) return "#00CED1";
  return "#00FFFF";
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

  const barElements = heights.current.map((h, i) => {
    const idx = Math.round(Math.min(1, Math.max(0, h)) * 7);
    const char = BLOCKS[idx];
    const color = isTyping ? getBarColor(h) : "gray";
    return <Text key={i} color={color}>{char}</Text>;
  });

  return <Text>{barElements}</Text>;
}
