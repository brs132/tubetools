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

let apiLoading = false;
let apiReady = false;

export default function VideoPlayer({
  videoId,
  onTimeUpdate,
  onDurationReady,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playerIdRef = useRef(`yt-player-${Date.now()}`);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube API
  useEffect(() => {
    if (apiReady || apiLoading) return;

    apiLoading = true;
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;

    window.onYouTubeIframeAPIReady = () => {
      apiReady = true;
    };

    document.body.appendChild(script);
  }, []);

  // Create player and sync time
  useEffect(() => {
    if (!apiReady || !containerRef.current) return;

    const playerId = playerIdRef.current;
    const container = containerRef.current;

    // Clear previous content
    container.innerHTML = "";

    // Create player
    playerRef.current = new window.YT.Player(container, {
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

          // Start polling time when playing
          const checkTime = setInterval(() => {
            if (!playerRef.current) return;

            try {
              const state = playerRef.current.getPlayerState();
              // Only update time if playing (state === 1)
              if (state === 1) {
                const time = playerRef.current.getCurrentTime();
                onTimeUpdate(time);
              }
            } catch (err) {
              // Ignore errors
            }
          }, 100);

          if (timeoutRef.current) clearInterval(timeoutRef.current);
          timeoutRef.current = checkTime as any;
        },
      },
    });

    return () => {
      // Don't destroy player, just clear the interval
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current as any);
      }
    };
  }, [videoId, onTimeUpdate, onDurationReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current as any);
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
