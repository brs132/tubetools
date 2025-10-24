import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

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
  const portalContainerRef = useRef<HTMLDivElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkLoadingRef = useRef<NodeJS.Timeout | null>(null);
  const loadSuccessRef = useRef(false);
  const playerReadyRef = useRef(false);

  // Create portal container once (attach to body for isolation)
  useEffect(() => {
    if (portalContainerRef.current) return;

    const container = document.createElement("div");
    container.id = "youtube-player-portal-" + Math.random().toString(36);
    document.body.appendChild(container);
    portalContainerRef.current = container;

    return () => {
      if (portalContainerRef.current?.parentNode) {
        portalContainerRef.current.parentNode.removeChild(portalContainerRef.current);
      }
    };
  }, []);

  // Load YouTube API once
  useEffect(() => {
    if (apiLoaded || window.YT) {
      apiLoaded = true;
      return;
    }

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
  }, [onLoadFail]);

  // Create/manage player
  useEffect(() => {
    if (!window.YT?.Player || !playerContainerRef.current) return;

    const createPlayer = async () => {
      try {
        playerReadyRef.current = false;
        loadSuccessRef.current = false;

        // Clear container
        if (playerContainerRef.current) {
          playerContainerRef.current.innerHTML = "";
        }

        await new Promise((resolve) => setTimeout(resolve, 50));

        if (!playerContainerRef.current) return;

        const newPlayer = new window.YT.Player(playerContainerRef.current, {
          width: "100%",
          height: "100%",
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            origin: window.location.origin,
            fs: 1,
            rel: 0,
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
                console.warn("[VideoPlayer] Error getting duration");
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
                  // Ignore
                }
              }, 100);
            },
            onError: (event: any) => {
              console.error(`[VideoPlayer] Player error for ${videoId}:`, event.data);
              if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
              if (checkLoadingRef.current) clearInterval(checkLoadingRef.current);
              onLoadFail?.();
            },
          },
        });

        playerRef.current = newPlayer;

        // Setup timeout
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = setTimeout(() => {
          if (!loadSuccessRef.current && playerReadyRef.current) {
            console.warn(`[VideoPlayer] Video ${videoId} failed to load within 5s`);
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

            if (
              duration > 0 &&
              state !== -1 &&
              state !== undefined &&
              !loadSuccessRef.current
            ) {
              loadSuccessRef.current = true;
              if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
              if (checkLoadingRef.current) clearInterval(checkLoadingRef.current);
              onLoadSuccess?.();
            }

            if (state === -1 && !loadSuccessRef.current) {
              if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
              if (checkLoadingRef.current) clearInterval(checkLoadingRef.current);
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

      try {
        if (playerRef.current?.destroy) {
          playerRef.current.destroy();
        }
      } catch (err) {
        // Ignore
      }
      playerRef.current = null;
    };
  }, [videoId, onTimeUpdate, onDurationReady, onLoadFail, onLoadSuccess]);

  // Portal content - isolated from React DOM tree
  const portalContent = (
    <div
      ref={playerContainerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
        zIndex: 1,
      }}
    />
  );

  return portalContainerRef.current
    ? createPortal(portalContent, portalContainerRef.current)
    : null;
}
