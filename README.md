# Promptpad

A minimal terminal text editor built with [React Ink](https://github.com/vadimdemedes/ink).

## Features

- Multiline text editing in the terminal
- Cursor navigation (arrows, Home/End, word jumping with Ctrl/Meta)
- Tab indentation
- Scrolling viewport
- Live token count (using tiktoken, GPT-4 tokenizer)
- Line and character count
- Auto-copy to clipboard on exit

## Getting Started

```bash
npm install
npm start
```

## Keybindings

| Key                    | Action                          |
| ---------------------- | ------------------------------- |
| Arrow keys             | Move cursor                     |
| Ctrl/Meta + Left/Right | Jump by word                    |
| Home / Ctrl+A          | Go to start of line             |
| End / Ctrl+E           | Go to end of line               |
| Tab                    | Insert 2-space indent           |
| Enter                  | New line                        |
| Backspace              | Delete character                |
| ESC / Ctrl+C           | Copy text to clipboard and exit |

## Tech Stack

- [React](https://react.dev/) + [Ink](https://github.com/vadimdemedes/ink) for terminal UI
- [tiktoken](https://github.com/openai/tiktoken) for token counting
- [TypeScript](https://www.typescriptlang.org/) with [tsx](https://github.com/privatenumber/tsx) for execution
