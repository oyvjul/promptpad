import { Box, Text, useInput } from "ink";
import { useState, useEffect } from "react";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  isActive?: boolean;
  placeholder?: string;
}

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

function expandTabs(text: string, tabSize = 2): string {
  return text.replace(/\t/g, " ".repeat(tabSize));
}

function getCursorLineAndColumn(
  text: string,
  cursorIndex: number,
): { line: number; col: number } {
  let line = 0;
  let col = 0;
  for (let i = 0; i < cursorIndex; i++) {
    if (text[i] === "\n") {
      line++;
      col = 0;
    } else {
      col++;
    }
  }
  return { line, col };
}

function getLineStartOffset(text: string, lineIndex: number): number {
  let offset = 0;
  for (let i = 0; i < lineIndex; i++) {
    const nl = text.indexOf("\n", offset);
    if (nl === -1) return text.length;
    offset = nl + 1;
  }
  return offset;
}

function getLineLength(text: string, lineIndex: number): number {
  const start = getLineStartOffset(text, lineIndex);
  const nl = text.indexOf("\n", start);
  return nl === -1 ? text.length - start : nl - start;
}

function findWordBoundaryLeft(text: string, fromIndex: number): number {
  if (fromIndex <= 0) return 0;
  let i = fromIndex - 1;
  // Skip whitespace
  while (i > 0 && /\s/.test(text[i]!)) i--;
  // Skip word chars
  while (i > 0 && !/\s/.test(text[i - 1]!)) i--;
  return i;
}

function findWordBoundaryRight(text: string, fromIndex: number): number {
  const len = text.length;
  if (fromIndex >= len) return len;
  let i = fromIndex;
  // Skip word chars
  while (i < len && !/\s/.test(text[i]!)) i++;
  // Skip whitespace
  while (i < len && /\s/.test(text[i]!)) i++;
  return i;
}

export function TextInput({
  value,
  onChange,
  rows = 6,
  isActive = true,
  placeholder,
}: TextInputProps) {
  const [cursorIndex, setCursorIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Clamp cursor when value shrinks (e.g. external change)
  useEffect(() => {
    setCursorIndex((prev) => Math.min(prev, value.length));
  }, [value]);

  // Compute cursor line and keep it in viewport
  const cursorLine = getCursorLineAndColumn(value, cursorIndex).line;

  useEffect(() => {
    setScrollOffset((prev) => {
      if (cursorLine < prev) return cursorLine;
      if (cursorLine >= prev + rows) return cursorLine - rows + 1;
      return prev;
    });
  }, [cursorLine, rows]);

  useInput(
    (input, key) => {
      // Tab and Ctrl+C pass through
      if (key.tab) {
        const indent = "  ";
        const newValue =
          value.slice(0, cursorIndex) + indent + value.slice(cursorIndex);
        onChange(newValue);
        setCursorIndex((i) => i + indent.length);
        return;
      }
      if (key.ctrl && input === "c") return;

      // Navigation
      if (key.leftArrow && !key.ctrl && !key.meta) {
        setCursorIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (key.rightArrow && !key.ctrl && !key.meta) {
        setCursorIndex((i) => Math.min(value.length, i + 1));
        return;
      }
      if (key.leftArrow && (key.ctrl || key.meta)) {
        setCursorIndex((i) => findWordBoundaryLeft(value, i));
        return;
      }
      if (key.rightArrow && (key.ctrl || key.meta)) {
        setCursorIndex((i) => findWordBoundaryRight(value, i));
        return;
      }

      if (key.upArrow) {
        setCursorIndex((i) => {
          const { line, col } = getCursorLineAndColumn(value, i);
          if (line === 0) return i;
          const prevLineLen = getLineLength(value, line - 1);
          const prevLineStart = getLineStartOffset(value, line - 1);
          return prevLineStart + Math.min(col, prevLineLen);
        });
        return;
      }
      if (key.downArrow) {
        setCursorIndex((i) => {
          const { line, col } = getCursorLineAndColumn(value, i);
          const lines = value.split("\n");
          if (line >= lines.length - 1) return i;
          const nextLineStart = getLineStartOffset(value, line + 1);
          const nextLineLen = getLineLength(value, line + 1);
          return nextLineStart + Math.min(col, nextLineLen);
        });
        return;
      }

      // Home / Ctrl+A
      if (key.home || (key.ctrl && input === "a")) {
        setCursorIndex((i) => {
          const { line } = getCursorLineAndColumn(value, i);
          return getLineStartOffset(value, line);
        });
        return;
      }
      // End / Ctrl+E
      if (key.end || (key.ctrl && input === "e")) {
        setCursorIndex((i) => {
          const { line } = getCursorLineAndColumn(value, i);
          const start = getLineStartOffset(value, line);
          const len = getLineLength(value, line);
          return start + len;
        });
        return;
      }

      // Backspace (ink maps physical Backspace to key.delete on Linux/WSL)
      if (key.backspace || key.delete) {
        if (cursorIndex > 0) {
          const newValue =
            value.slice(0, cursorIndex - 1) + value.slice(cursorIndex);
          onChange(newValue);
          setCursorIndex((i) => i - 1);
        }
        return;
      }

      // Enter
      if (key.return) {
        const newValue =
          value.slice(0, cursorIndex) + "\n" + value.slice(cursorIndex);
        onChange(newValue);
        setCursorIndex((i) => i + 1);
        return;
      }

      // Escape - ignore (handled by parent)
      if (key.escape) return;

      // Printable input (including paste)
      if (input && !key.ctrl && !key.meta) {
        const normalized = expandTabs(normalizeLineEndings(input));
        const newValue =
          value.slice(0, cursorIndex) + normalized + value.slice(cursorIndex);
        onChange(newValue);
        setCursorIndex((i) => i + normalized.length);
      }
    },
    { isActive },
  );

  // Render
  if (!value && placeholder) {
    return (
      <Box flexGrow={1} overflow="hidden">
        <Text dimColor>{placeholder}</Text>
      </Box>
    );
  }

  const beforeCursor = value.slice(0, cursorIndex);
  const cursorChar = cursorIndex < value.length ? value[cursorIndex] : " ";
  const afterCursor =
    cursorIndex < value.length ? value.slice(cursorIndex + 1) : "";

  return (
    <Box flexGrow={1} overflow="hidden" flexDirection="column">
      <Box flexDirection="column" marginTop={-scrollOffset}>
        <Text>
          {beforeCursor}
          <Text inverse>{cursorChar === "\n" ? " \n" : cursorChar}</Text>
          {afterCursor}
        </Text>
      </Box>
    </Box>
  );
}
