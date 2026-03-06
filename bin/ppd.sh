#!/usr/bin/env bash
# Launch Promptpad globally as `ppd`
SCRIPT="$(readlink -f "${BASH_SOURCE[0]}")"
DIR="$(cd "$(dirname "$SCRIPT")/.." && pwd)"

if [ -n "$TMUX" ]; then
    tmux display-popup -E -w 100% -h 60% -T " Promptpad " -d "$DIR" "npx tsx $DIR/src/app.tsx"
else
    if ! tmux has-session -t promptpad 2>/dev/null; then
        tmux new-session -d -s promptpad -x "$(tput cols)" -y "$(tput lines)"
    fi
    tmux attach-session -t promptpad \; display-popup -E -w 100% -h 60% -T " Promptpad " -d "$DIR" "npx tsx $DIR/src/app.tsx" \; kill-session -t promptpad
fi
