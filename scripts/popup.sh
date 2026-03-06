#!/usr/bin/env bash
# Launch Promptpad as a tmux popup, or directly if not in tmux
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -n "$TMUX" ]; then
    tmux display-popup -E -w 100% -h 80% -T " Promptpad " -d "$DIR" "npx tsx src/app.tsx"
else
    cd "$DIR" && npx tsx src/app.tsx
fi
