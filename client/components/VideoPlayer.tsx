import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  videoId: string;
  onTimeUpdate: (time: number) => void;
  onDurationReady: (duration: number) => void;
  onLoadFail?: () => void;
  onLoadSuccess?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

let apiLoaded = false;

export default function VideoPlayer({
  videoId,
  onTimeUpdate,
  onDurationReady,
  onLoadFail,
  onLoadSuccess,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadSuccessRef = useRef(false);

  // Load YouTube API
  useEffect(() => {
    if (apiLoaded || window.YT) return;

    window.onYouTubeIframeAPIReady = () => {
      console.log("[VideoPlayer] YouTube IFrame API ready");
      apiLoaded = true;
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      console.error("[VideoPlayer] Failed to load YouTube IFrame API");
    };
    document.body.appendChild(script);
  }, []);

  // Create player once
  useEffect(() => {
    if (!window.YT || !containerRef.current || playerRef.current) return;

    // Create player once
    playerRef.current = new window.YT.Player(containerRef.current, {
      width: "100%",
      height: "100%",
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
      },
      events: {
        onReady: (event: any) => {
          const duration = event.target.getDuration();
          if (duration > 0) {
            onDurationReady(duration);
          }

          // Start polling
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = setInterval(() => {
            try {
              if (!playerRef.current) return;
              const state = playerRef.current.getPlayerState?.();
              // Only report time when playing (state 1)
              if (state === 1) {
                const time = playerRef.current.getCurrentTime?.();
                if (typeof time === "number" && time >= 0) {
                  onTimeUpdate(time);
                }
              }
            } catch (err) {
              // Silently ignore polling errors
            }
          }, 100);
        },
      },
    });

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [onTimeUpdate, onDurationReady]);

  // Load different video without recreating player
  useEffect(() => {
    if (!playerRef.current?.loadVideoById) return;

    try {
      playerRef.current.loadVideoById(videoId);
      // Get duration after loading
      const timeoutId = setTimeout(() => {
        try {
          if (playerRef.current?.getDuration) {
            const duration = playerRef.current.getDuration();
            if (duration > 0) {
              onDurationReady(duration);
            }
          }
        } catch (err) {
          // Ignore duration fetch errors
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } catch (err) {
      // Ignore load errors
    }
  }, [videoId, onDurationReady]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
