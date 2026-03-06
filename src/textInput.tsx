import { Box, Text, useInput } from "ink";
import { useState, useEffect, useRef, useCallback } from "react";

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

function stripBracketPasteMarkers(input: string): string {
  return input.replace(/\[20[01]~/g, "");
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

  const valueRef = useRef(value);
  const cursorRef = useRef(cursorIndex);

  // Sync refs on each render so handlers always see fresh values
  valueRef.current = value;
  cursorRef.current = cursorIndex;

  const updateValue = useCallback(
    (newValue: string) => {
      valueRef.current = newValue;
      onChange(newValue);
    },
    [onChange],
  );

  const updateCursor = useCallback(
    (newCursorIndex: number) => {
      cursorRef.current = newCursorIndex;
      setCursorIndex(newCursorIndex);
    },
    [],
  );

  // Clamp cursor when value shrinks (e.g. external change)
  useEffect(() => {
    setCursorIndex((prev) => {
      const clamped = Math.min(prev, value.length);
      cursorRef.current = clamped;
      return clamped;
    });
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
      const val = valueRef.current;
      const cursor = cursorRef.current;

      // Tab and Ctrl+C pass through
      if (key.tab) {
        const indent = "  ";
        const newValue =
          val.slice(0, cursor) + indent + val.slice(cursor);
        updateValue(newValue);
        updateCursor(cursor + indent.length);
        return;
      }
      if (key.ctrl && input === "c") return;

      // Navigation
      if (key.leftArrow && !key.ctrl && !key.meta) {
        updateCursor(Math.max(0, cursor - 1));
        return;
      }
      if (key.rightArrow && !key.ctrl && !key.meta) {
        updateCursor(Math.min(val.length, cursor + 1));
        return;
      }
      if (key.leftArrow && (key.ctrl || key.meta)) {
        updateCursor(findWordBoundaryLeft(val, cursor));
        return;
      }
      if (key.rightArrow && (key.ctrl || key.meta)) {
        updateCursor(findWordBoundaryRight(val, cursor));
        return;
      }

      if (key.upArrow) {
        const { line, col } = getCursorLineAndColumn(val, cursor);
        if (line === 0) return;
        const prevLineLen = getLineLength(val, line - 1);
        const prevLineStart = getLineStartOffset(val, line - 1);
        updateCursor(prevLineStart + Math.min(col, prevLineLen));
        return;
      }
      if (key.downArrow) {
        const { line, col } = getCursorLineAndColumn(val, cursor);
        const lines = val.split("\n");
        if (line >= lines.length - 1) return;
        const nextLineStart = getLineStartOffset(val, line + 1);
        const nextLineLen = getLineLength(val, line + 1);
        updateCursor(nextLineStart + Math.min(col, nextLineLen));
        return;
      }

      // Home / Ctrl+A
      if (key.home || (key.ctrl && input === "a")) {
        const { line } = getCursorLineAndColumn(val, cursor);
        updateCursor(getLineStartOffset(val, line));
        return;
      }
      // End / Ctrl+E
      if (key.end || (key.ctrl && input === "e")) {
        const { line } = getCursorLineAndColumn(val, cursor);
        const start = getLineStartOffset(val, line);
        const len = getLineLength(val, line);
        updateCursor(start + len);
        return;
      }

      // Backspace (ink maps physical Backspace to key.delete on Linux/WSL)
      if (key.backspace || key.delete) {
        if (cursor > 0) {
          const newValue =
            val.slice(0, cursor - 1) + val.slice(cursor);
          updateValue(newValue);
          updateCursor(cursor - 1);
        }
        return;
      }

      // Enter
      if (key.return) {
        const newValue =
          val.slice(0, cursor) + "\n" + val.slice(cursor);
        updateValue(newValue);
        updateCursor(cursor + 1);
        return;
      }

      // Escape - ignore (handled by parent)
      if (key.escape) return;

      // Printable input (including paste)
      if (input && !key.ctrl && !key.meta) {
        const cleaned = stripBracketPasteMarkers(input);
        if (!cleaned) return;
        const normalized = expandTabs(normalizeLineEndings(cleaned));
        const newValue =
          val.slice(0, cursor) + normalized + val.slice(cursor);
        updateValue(newValue);
        updateCursor(cursor + normalized.length);
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
