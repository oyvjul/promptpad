import { render, Box, Text, useApp, useInput, useStdout } from "ink";
import { MultilineInput } from "ink-multiline-input";
import { TextInput } from "./textInput.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Waveform } from "./waveform.js";
import { copyToClipboard } from "./clipboard.js";
import { encoding_for_model } from "tiktoken";

const enc = encoding_for_model("gpt-4");

const USE_CUSTOM_INPUT = true;

function Editor() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [value, setValue] = useState("");
  const keystrokeTimes = useRef<number[]>([]);
  const [typingIntensity, setTypingIntensity] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    keystrokeTimes.current.push(Date.now());
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      keystrokeTimes.current = keystrokeTimes.current.filter(
        (t) => now - t < 2000,
      );
      const count = keystrokeTimes.current.length;
      const lastTime =
        keystrokeTimes.current[keystrokeTimes.current.length - 1] ?? 0;

      setIsTyping(now - lastTime < 500);
      setTypingIntensity(Math.min(1, count / 20));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useInput((input, key) => {
    if (
      key.escape &&
      !key.upArrow &&
      !key.downArrow &&
      !key.leftArrow &&
      !key.rightArrow
    ) {
      if (value) copyToClipboard(value);
      exit();
    }

    if (key.ctrl && input === "c") {
      if (value) copyToClipboard(value);
      exit();
    }
  });

  const lineCount = value.split("\n").length;
  const charCount = value.length;
  const tokenCount = useMemo(() => enc.encode(value).length, [value]);

  return (
    <Box flexDirection="column" height={stdout.rows}>
      <Box flexDirection="column" minHeight={10} height="80%" flexGrow={1}>
        {USE_CUSTOM_INPUT ? (
          <TextInput value={value} onChange={handleChange} rows={20} />
        ) : (
          <MultilineInput value={value} onChange={handleChange} rows={6} />
        )}
      </Box>

      <Box justifyContent="space-between">
        <Text dimColor>
          Lines: {lineCount} | Chars: {charCount} | Tokens: {tokenCount}
        </Text>
        <Waveform isTyping={isTyping} intensity={typingIntensity} />
        <Text dimColor>ESC to exit | Ctrl+C to quit</Text>
      </Box>
    </Box>
  );
}

render(<Editor />, { exitOnCtrlC: false });
