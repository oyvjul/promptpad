import { render, Box, Text, useApp, useInput } from "ink";
import { MultilineInput } from "ink-multiline-input";
import { TextInput } from "./text-input.js";
import { useMemo, useState } from "react";
import { copyToClipboard } from "./clipboard.js";
import { encoding_for_model } from "tiktoken";

const enc = encoding_for_model("gpt-4");

const USE_CUSTOM_INPUT = true;

function Editor() {
  const { exit } = useApp();
  const [value, setValue] = useState("");

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
    <Box flexDirection="column" padding={1}>
      <Box justifyContent="space-between" marginBottom={1}>
        <Text bold color="cyan">
          Claude Text Editor
        </Text>
        <Text dimColor>ESC to exit | Ctrl+C to quit</Text>
      </Box>

      <Box
        borderStyle="round"
        borderColor="gray"
        flexDirection="column"
        minHeight={10}
        flexGrow={1}
      >
        {USE_CUSTOM_INPUT ? (
          <TextInput value={value} onChange={setValue} rows={20} />
        ) : (
          <MultilineInput value={value} onChange={setValue} rows={6} />
        )}
      </Box>

      <Box justifyContent="space-between" marginTop={1}>
        <Text dimColor>
          Lines: {lineCount} | Chars: {charCount} | Tokens: {tokenCount}
        </Text>
      </Box>
    </Box>
  );
}

render(<Editor />, { exitOnCtrlC: false });
