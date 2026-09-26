import fs from "node:fs";
import path from "node:path";
import VideoFacade from "./VideoFacade";

const VIDEO_DIR = path.join(process.cwd(), "public", "video");

// Reads a PNG's pixel size from its IHDR header, so the player can reserve
// exactly the right shape (the video may be vertical or horizontal).
function pngSize(file: string): { width: number; height: number } | null {
  try {
    const header = fs.readFileSync(file).subarray(16, 24);
    return { width: header.readUInt32BE(0), height: header.readUInt32BE(4) };
  } catch {
    return null;
  }
}

/**
 * The 30-second launch video. Renders nothing at all until
 * public/video/launch.mp4 exists, so there's never an empty box.
 */
export default function LaunchVideo() {
  if (!fs.existsSync(path.join(VIDEO_DIR, "launch.mp4"))) return null;
  const posterFile = path.join(VIDEO_DIR, "poster.png");
  const poster = fs.existsSync(posterFile) ? pngSize(posterFile) : null;

  // Spacing lives here, so a missing video leaves no gap behind.
  return (
    <div className="mt-14 lg:ml-[41.66%]">
      <VideoFacade
        src="/video/launch.mp4"
        poster={poster ? { src: "/video/poster.png", ...poster } : null}
      />
    </div>
  );
}
