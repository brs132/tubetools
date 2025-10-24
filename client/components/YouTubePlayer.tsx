interface YouTubePlayerProps {
  videoId: string;
  onDurationChange: (duration: number) => void;
  onTimeUpdate: (time: number) => void;
  onStateChange: (state: "playing" | "paused" | "ended") => void;
  autoplay?: boolean;
}

export default function YouTubePlayer({
  videoId,
  autoplay = true,
}: YouTubePlayerProps) {
  return (
    <iframe
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
