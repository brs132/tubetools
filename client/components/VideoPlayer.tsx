import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  videoId: string;
  onTimeUpdate: (time: number) => void;
  onDurationReady: (duration: number) => void;
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
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube API
  useEffect(() => {
    if (apiLoaded || window.YT) return;

    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Create/Update player
  useEffect(() => {
    if (!window.YT || !containerRef.current) return;

    // Clear previous player
    if (playerRef.current) {
      playerRef.current.destroy?.();
      playerRef.current = null;
    }

    // Clear polling
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }

    // Create new player
    const playerId = `yt-${videoId}`;
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
          pollRef.current = setInterval(() => {
            try {
              const state = playerRef.current?.getPlayerState();
              // Only report time when playing (state 1)
              if (state === 1) {
                const time = playerRef.current?.getCurrentTime();
                if (time >= 0) {
                  onTimeUpdate(time);
                }
              }
            } catch (err) {
              // Ignore
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
  }, [videoId, onTimeUpdate, onDurationReady]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          // Ignore
        }
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
