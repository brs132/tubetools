interface VideoPlayerProps {
  videoId: string;
  onTimeUpdate?: (time: number) => void;
  onDurationReady?: (duration: number) => void;
}

export default function VideoPlayer({
  videoId,
  onTimeUpdate,
  onDurationReady,
}: VideoPlayerProps) {
  return (
    <iframe
      width="100%"
      height="100%"
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1`}
      title={`YouTube video ${videoId}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="w-full h-full"
    />
  );
}
