import { useEffect, useRef, useState } from "react";

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
const playerCache = new Map<string, any>();

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
  const checkLoadingRef = useRef<NodeJS.Timeout | null>(null);
  const loadSuccessRef = useRef(false);
  const playerReadyRef = useRef(false);
  const [containerKey, setContainerKey] = useState(0);

  // Load YouTube API once
  useEffect(() => {
    if (apiLoaded || window.YT) {
      apiLoaded = true;
      return;
    }

    const loadAPI = () => {
      window.onYouTubeIframeAPIReady = () => {
        console.log("[VideoPlayer] YouTube IFrame API ready");
        apiLoaded = true;
      };

      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        console.error("[VideoPlayer] Failed to load YouTube IFrame API");
        onLoadFail?.();
      };
      document.body.appendChild(script);
    };

    loadAPI();
  }, [onLoadFail]);

  // Create/destroy player when container or API changes
  useEffect(() => {
    if (!window.YT?.Player || !containerRef.current) return;

    const createPlayer = () => {
      try {
        // Clear any existing content
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        playerReadyRef.current = false;
        loadSuccessRef.current = false;

        const newPlayer = new window.YT.Player(containerRef.current, {
          width: "100%",
          height: "100%",
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              console.log(`[VideoPlayer] Player ready for video ${videoId}`);
              playerReadyRef.current = true;

              try {
                const duration = event.target.getDuration?.();
                if (duration > 0) {
                  onDurationReady(duration);
                }
              } catch (err) {
                console.warn("[VideoPlayer] Error getting duration on ready");
              }

              // Start polling
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = setInterval(() => {
                try {
                  if (!playerRef.current || !playerReadyRef.current) return;
                  const state = playerRef.current.getPlayerState?.();
                  if (state === 1) {
                    const time = playerRef.current.getCurrentTime?.();
                    if (typeof time === "number" && time >= 0) {
                      onTimeUpdate(time);
                    }
                  }
                } catch (err) {
                  // Silently ignore
                }
              }, 100);
            },
            onError: (event: any) => {
              console.error(
                `[VideoPlayer] Player error for video ${videoId}:`,
                event.data,
              );
              onLoadFail?.();
            },
          },
        });

        playerRef.current = newPlayer;

        // Setup load timeout
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = setTimeout(() => {
          if (!loadSuccessRef.current && playerReadyRef.current) {
            console.warn(
              `[VideoPlayer] Video ${videoId} did not reach playable state`,
            );
            onLoadFail?.();
          }
        }, 5000);

        // Monitor loading
        if (checkLoadingRef.current) clearInterval(checkLoadingRef.current);
        checkLoadingRef.current = setInterval(() => {
          try {
            if (!playerRef.current || !playerReadyRef.current) return;

            const state = playerRef.current.getPlayerState?.();
            const duration = playerRef.current.getDuration?.();

            // State 0 = ended, 1 = playing, 2 = paused, 3 = buffering, 5 = unstarted, -1 = error
            if (
              duration > 0 &&
              state !== -1 &&
              state !== undefined &&
              !loadSuccessRef.current
            ) {
              loadSuccessRef.current = true;
              if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
              if (checkLoadingRef.current)
                clearInterval(checkLoadingRef.current);
              onLoadSuccess?.();
            }

            if (state === -1 && !loadSuccessRef.current) {
              console.error(`[VideoPlayer] Video ${videoId} error state`);
              if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
              if (checkLoadingRef.current)
                clearInterval(checkLoadingRef.current);
              onLoadFail?.();
            }
          } catch (err) {
            // Ignore
          }
        }, 200);
      } catch (err) {
        console.error(`[VideoPlayer] Failed to create player:`, err);
        onLoadFail?.();
      }
    };

    createPlayer();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      if (checkLoadingRef.current) clearInterval(checkLoadingRef.current);
    };
  }, [containerKey, onTimeUpdate, onDurationReady, onLoadFail, onLoadSuccess]);

  // Change video without destroying player
  useEffect(() => {
    if (!playerRef.current?.loadVideoById || !playerReadyRef.current) {
      // If player not ready, recreate it
      setContainerKey((prev) => prev + 1);
      return;
    }

    loadSuccessRef.current = false;

    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    if (checkLoadingRef.current) clearInterval(checkLoadingRef.current);

    try {
      playerRef.current.loadVideoById(videoId);

      loadTimeoutRef.current = setTimeout(() => {
        if (!loadSuccessRef.current) {
          console.warn(
            `[VideoPlayer] Video ${videoId} failed to load within 5s`,
          );
          onLoadFail?.();
        }
      }, 5000);

      checkLoadingRef.current = setInterval(() => {
        try {
          if (!playerRef.current || !playerReadyRef.current) return;

          const state = playerRef.current.getPlayerState?.();
          const duration = playerRef.current.getDuration?.();

          if (
            duration > 0 &&
            state !== -1 &&
            state !== undefined &&
            !loadSuccessRef.current
          ) {
            loadSuccessRef.current = true;
            if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
            if (checkLoadingRef.current)
              clearInterval(checkLoadingRef.current);
            onLoadSuccess?.();
          }

          if (state === -1 && !loadSuccessRef.current) {
            if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
            if (checkLoadingRef.current)
              clearInterval(checkLoadingRef.current);
            onLoadFail?.();
          }
        } catch (err) {
          // Ignore
        }
      }, 200);
    } catch (err) {
      console.error(`[VideoPlayer] Failed to load video ${videoId}:`, err);
      onLoadFail?.();
    }
  }, [videoId, onDurationReady, onLoadFail, onLoadSuccess]);

  return <div key={containerKey} ref={containerRef} className="w-full h-full" />;
}
