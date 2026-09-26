"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Poster = { src: string; width: number; height: number } | null;

/**
 * Click-to-play: only the poster loads with the page. The video file isn't
 * requested until someone taps play, and it never starts on its own.
 */
export default function VideoFacade({ src, poster }: { src: string; poster: Poster }) {
  const [playing, setPlaying] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const ratio = poster ? poster.width / poster.height : 16 / 9;

  useEffect(() => {
    if (playing) video.current?.play().catch(() => {});
  }, [playing]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-paper/15 bg-ink"
      style={{ aspectRatio: ratio, width: `min(100%, calc(78svh * ${ratio}))` }}
    >
      {playing ? (
        <video
          ref={video}
          src={src}
          poster={poster?.src}
          controls
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 flex items-center justify-center"
        >
          {poster ? (
            <Image src={poster.src} alt="" fill sizes="(min-width: 1024px) 640px, 100vw" className="object-cover" />
          ) : null}
          <span className="absolute inset-0 bg-ink/25" aria-hidden="true" />
          <span className="relative inline-flex min-h-12 items-center gap-3 rounded-full bg-coral px-6 font-medium text-ink shadow-lg transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none">
            <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
              <path d="M2 1l9 5-9 5z" fill="currentColor" />
            </svg>
            Watch the 30-second video
          </span>
        </button>
      )}
    </div>
  );
}
