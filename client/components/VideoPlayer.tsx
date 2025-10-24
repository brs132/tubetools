import { useEffect, useRef, useCallback } from "react";

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

let youtubeApiReady = false;
const apiReadyCallbacks: (() => void)[] = [];

export default function VideoPlayer({
  videoId,
  onTimeUpdate,
  onDurationReady,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube API once globally
  useEffect(() => {
    if (youtubeApiReady || window.YT) {
      youtubeApiReady = true;
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      youtubeApiReady = true;
      apiReadyCallbacks.forEach((cb) => cb());
      apiReadyCallbacks.length = 0;
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Initialize player
  useEffect(() => {
    if (!containerRef.current || !youtubeApiReady) return;

    if (!window.YT) return;

    const container = containerRef.current;
    if (!container) return;

    // Cleanup previous player
    if (playerRef.current) {
      try {
        playerRef.current.destroy?.();
      } catch (err) {
        // Ignore
      }
      playerRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Create new player
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
          try {
            const duration = event.target.getDuration();
            if (duration > 0) {
              onDurationReady(duration);
            }
          } catch (err) {
            // Ignore
          }
        },
      },
    });

    // Start polling for time
    intervalRef.current = setInterval(() => {
      if (!playerRef.current) return;

      try {
        const state = playerRef.current.getPlayerState();
        // Only update if playing (state 1 = PLAYING)
        if (state === 1) {
          const time = playerRef.current.getCurrentTime();
          onTimeUpdate(time);
        }
      } catch (err) {
        // Ignore errors from API
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoId, onTimeUpdate, onDurationReady]);

  return <div ref={containerRef} className="w-full h-full" />;
}
