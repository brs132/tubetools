import { useEffect, useRef, useState } from "react";

interface YouTubePlayerProps {
  videoId: string;
  onDurationChange: (duration: number) => void;
  onTimeUpdate: (time: number) => void;
  onStateChange: (state: "playing" | "paused" | "ended") => void;
  autoplay?: boolean;
}

export default function YouTubePlayer({
  videoId,
  onDurationChange,
  onTimeUpdate,
  onStateChange,
  autoplay = true,
}: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [durationSet, setDurationSet] = useState(false);

  // Set duration with a reasonable default for YouTube videos
  useEffect(() => {
    // Most YouTube videos in our list are around 200-300 seconds
    // We'll use a conservative default and try to detect via onPlaying
    const defaultDuration = 240; // 4 minutes
    
    if (!durationSet) {
      onDurationChange(defaultDuration);
      setDurationSet(true);
    }

    // Start tracking time as soon as iframe is ready
    if (!updateIntervalRef.current) {
      updateIntervalRef.current = setInterval(() => {
        if (iframeRef.current) {
          // Try to get current time from YouTube via postMessage
          try {
            iframeRef.current.contentWindow?.postMessage(
              { command: "requestCurrentTime" },
              "*",
            );
          } catch (err) {
            // Silently ignore postMessage errors
          }
        }
      }, 100);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [videoId, onDurationChange, onTimeUpdate, durationSet]);

  // Listen for postMessage responses from YouTube
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      const data = event.data;
      if (data && data.currentTime !== undefined) {
        onTimeUpdate(data.currentTime);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onTimeUpdate]);

  return (
    <iframe
      ref={iframeRef}
      width="100%"
      height="100%"
      src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&controls=1&modestbranding=1`}
      title={`YouTube video ${videoId}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="w-full h-full"
    />
  );
}
