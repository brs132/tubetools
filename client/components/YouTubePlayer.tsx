import { useEffect, useRef, useState } from "react";

interface YouTubePlayerProps {
  videoId: string;
  onDurationChange: (duration: number) => void;
  onTimeUpdate: (time: number) => void;
  onStateChange: (state: "playing" | "paused" | "ended") => void;
  autoplay?: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubePlayer({
  videoId,
  onDurationChange,
  onTimeUpdate,
  onStateChange,
  autoplay = true,
}: YouTubePlayerProps) {
  const playerContainerId = `youtube-player-${videoId}`;
  const playerRef = useRef<any>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT) {
      setIsPlayerReady(true);
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsPlayerReady(true);
    };
  }, []);

  // Create and manage player
  useEffect(() => {
    if (!isPlayerReady || !window.YT) return;

    // Clear any pending intervals
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    // Create new player
    const container = document.getElementById(playerContainerId);
    if (!container) return;

    playerRef.current = new window.YT.Player(playerContainerId, {
      width: "100%",
      height: "100%",
      videoId: videoId,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: 1,
        modestbranding: 1,
      },
      events: {
        onReady: (event: any) => {
          const duration = event.target.getDuration();
          onDurationChange(duration);
        },
        onStateChange: (event: any) => {
          const state = event.data;
          if (state === window.YT.PlayerState.PLAYING) {
            onStateChange("playing");
          } else if (state === window.YT.PlayerState.PAUSED) {
            onStateChange("paused");
          } else if (state === window.YT.PlayerState.ENDED) {
            onStateChange("ended");
          }
        },
      },
    });

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [isPlayerReady, videoId, playerContainerId, onDurationChange, onStateChange, autoplay]);

  // Track current time
  useEffect(() => {
    if (!playerRef.current) return;

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    updateIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          onTimeUpdate(currentTime);
        } catch (err) {
          // Ignore errors if player is not ready
        }
      }
    }, 100);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [onTimeUpdate]);

  return (
    <div id={playerContainerId} className="w-full h-full bg-black" />
  );
}
