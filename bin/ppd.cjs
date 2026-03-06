#!/usr/bin/env node
"use strict";
const { execSync } = require("child_process");
const { realpathSync } = require("fs");
const { dirname, join } = require("path");

const scriptDir = dirname(realpathSync(__filename));
const projectDir = join(scriptDir, "..");
const appPath = join(projectDir, "dist", "app.js");

const inTmux = !!process.env.TMUX;

try {
  if (inTmux) {
    execSync(
      `tmux display-popup -E -w 100% -h 60% -T " Promptpad " "node ${appPath}"`,
      { stdio: "inherit" }
    );
  } else {
    execSync(
      `tmux new-session -d -s promptpad 2>/dev/null; tmux attach-session -t promptpad \\; display-popup -E -w 100% -h 60% -T " Promptpad " "node ${appPath}" \\; kill-session -t promptpad`,
      { stdio: "inherit" }
    );
  }
} catch {
  // tmux returns non-zero when popup is dismissed; this is normal
}
