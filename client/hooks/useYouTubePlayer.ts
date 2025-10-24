import { useEffect, useRef } from "react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

let apiLoaded = false;
let apiCallbacks: (() => void)[] = [];

export function useYouTubePlayer(
  videoId: string,
  onTimeUpdate: (time: number) => void,
  onDurationChange: (duration: number) => void,
) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load API once
  useEffect(() => {
    if (apiLoaded) {
      return;
    }

    const loadApi = () => {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    };

    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      apiCallbacks.forEach((cb) => cb());
      apiCallbacks = [];
    };

    loadApi();
  }, []);

  // Create player
  useEffect(() => {
    const setupPlayer = () => {
      if (!window.YT || !containerRef.current || playerRef.current) {
        return;
      }

      const containerId = `yt-${videoId}`;
      containerRef.current.id = containerId;

      playerRef.current = new window.YT.Player(containerId, {
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
                onDurationChange(duration);
              }
            } catch (err) {
              // Ignore
            }
          },
        },
      });

      // Start polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          try {
            const time = playerRef.current.getCurrentTime();
            if (time >= 0) {
              onTimeUpdate(time);
            }
          } catch (err) {
            // Ignore
          }
        }
      }, 100);
    };

    if (apiLoaded) {
      setupPlayer();
    } else {
      apiCallbacks.push(setupPlayer);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [videoId, onTimeUpdate, onDurationChange]);

  return containerRef;
}
