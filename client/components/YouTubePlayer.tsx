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

let ytApiReady = false;

export default function YouTubePlayer({
  videoId,
  onDurationChange,
  onTimeUpdate,
  onStateChange,
  autoplay = true,
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(ytApiReady);

  // Load YouTube API once globally
  useEffect(() => {
    if (ytApiReady || typeof window.YT !== "undefined") {
      setIsReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;

    window.onYouTubeIframeAPIReady = () => {
      ytApiReady = true;
      setIsReady(true);
    };

    document.body.appendChild(script);
  }, []);

  // Create player
  useEffect(() => {
    if (!isReady || !window.YT || !containerRef.current || playerRef.current)
      return;

    const containerId = `yt-player-${videoId}`;
    containerRef.current.id = containerId;

    let isPlaying = false;

    playerRef.current = new window.YT.Player(containerId, {
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

          // Start tracking time
          const interval = setInterval(() => {
            if (playerRef.current) {
              try {
                const state = playerRef.current.getPlayerState();
                const isCurrentlyPlaying =
                  state === window.YT.PlayerState.PLAYING;

                if (isCurrentlyPlaying !== isPlaying) {
                  isPlaying = isCurrentlyPlaying;
                  onStateChange(
                    isCurrentlyPlaying ? "playing" : "paused",
                  );
                }

                if (isCurrentlyPlaying) {
                  const currentTime = playerRef.current.getCurrentTime();
                  onTimeUpdate(currentTime);
                }
              } catch (err) {
                // Ignore errors
              }
            }
          }, 100);

          // Store interval for cleanup
          (event.target as any)._timeInterval = interval;
        },
      },
    });
  }, [isReady, videoId, autoplay, onDurationChange, onTimeUpdate, onStateChange]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          // Ignore
        }
        playerRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full bg-black" />;
}
