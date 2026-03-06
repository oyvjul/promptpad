import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";

const WSL_CLIP = "/mnt/c/Windows/System32/clip.exe";

function getClipboardCommand(): { cmd: string; args: string[] } | null {
  const os = platform();

  if (os === "darwin") {
    return { cmd: "pbcopy", args: [] };
  }

  if (os === "win32") {
    return { cmd: "clip", args: [] };
  }

  // Linux — check for WSL first, then fall back to xclip/xsel
  if (existsSync(WSL_CLIP)) {
    return { cmd: WSL_CLIP, args: [] };
  }

  return { cmd: "xclip", args: ["-selection", "clipboard"] };
}

export function copyToClipboard(text: string): void {
  try {
    const clip = getClipboardCommand();
    if (clip) {
      execFileSync(clip.cmd, clip.args, { input: text });
    }
  } catch {
    // Silently fail if no clipboard tool available
  }
}
