import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getUser } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api-client";
import { Video, VoteResponse } from "@shared/api";
import Layout from "@/components/Layout";
import { VIDEO_MIN_WATCH_SECONDS } from "@/lib/constants";
import { ThumbsUp, ThumbsDown, Play, Clock } from "lucide-react";

export default function Feed() {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [votedVideos, setVotedVideos] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [watchTimer, setWatchTimer] = useState<NodeJS.Timeout | null>(null);
  const [isVideoFocused, setIsVideoFocused] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }

    const user = getUser();
    if (user) {
      setUserBalance(user.balance);
    }

    loadVideos();
  }, [navigate]);

  useEffect(() => {
    // Track video watch time when video is in focus
    if (isVideoFocused && selectedVideo && !votedVideos.has(selectedVideo.id)) {
      const timer = setInterval(() => {
        setWatchedSeconds((prev) => prev + 0.5);
      }, 500);
      setWatchTimer(timer);

      return () => clearInterval(timer);
    } else {
      if (watchTimer) clearInterval(watchTimer);
    }
  }, [isVideoFocused, selectedVideo, votedVideos]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await apiGet<Video[]>("/api/videos");
      setVideos(data);
      if (data.length > 0) {
        setSelectedVideo(data[0]);
        setWatchedSeconds(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (videoId: string, voteType: "like" | "dislike") => {
    if (votedVideos.has(videoId)) {
      setError("You've already voted on this video");
      return;
    }

    if (watchedSeconds < VIDEO_MIN_WATCH_SECONDS) {
      setError(`Please watch at least ${VIDEO_MIN_WATCH_SECONDS} seconds before voting`);
      return;
    }

    setVoting(true);
    setError("");

    try {
      const response = await apiPost<VoteResponse>(
        `/api/videos/${videoId}/vote`,
        { voteType }
      );

      setUserBalance(response.newBalance);
      setVotedVideos((prev) => new Set([...prev, videoId]));

      // Move to next video after a brief delay
      setTimeout(() => {
        const currentIndex = videos.findIndex((v) => v.id === videoId);
        if (currentIndex < videos.length - 1) {
          setSelectedVideo(videos[currentIndex + 1]);
          setWatchedSeconds(0);
        } else {
          setError("You've reached the end of available videos");
        }
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setVoting(false);
    }
  };

  if (!isAuthenticated()) return null;

  const canVote = watchedSeconds >= VIDEO_MIN_WATCH_SECONDS;
  const watchProgressPercent = Math.min((watchedSeconds / VIDEO_MIN_WATCH_SECONDS) * 100, 100);

  return (
    <Layout>
      <div className="bg-background min-h-screen">
        <div className="container py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Video Player */}
            <div className="lg:col-span-2 space-y-4">
              {selectedVideo ? (
                <>
                  {/* Video Container */}
                  <div
                    className="card-base p-0 overflow-hidden bg-black"
                    onMouseEnter={() => setIsVideoFocused(true)}
                    onMouseLeave={() => setIsVideoFocused(false)}
                  >
                    <div className="aspect-video relative">
                      <iframe
                        ref={iframeRef}
                        width="100%"
                        height="100%"
                        src={`${selectedVideo.url}?autoplay=1`}
                        title={selectedVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      ></iframe>
                    </div>
                  </div>

                  {/* Watch Progress */}
                  {!votedVideos.has(selectedVideo.id) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Watch progress
                        </span>
                        <span className="font-semibold">
                          {Math.round(watchedSeconds)}s / {VIDEO_MIN_WATCH_SECONDS}s
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-red-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${watchProgressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Video Info */}
                  <div className="card-base space-y-3">
                    <h2 className="text-2xl font-bold">{selectedVideo.title}</h2>
                    <p className="text-muted-foreground text-sm">
                      {selectedVideo.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          REWARD RANGE
                        </p>
                        <p className="text-lg font-bold">
                          ${selectedVideo.rewardMin.toFixed(2)} - $
                          {selectedVideo.rewardMax.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          YOUR BALANCE
                        </p>
                        <p className="text-lg font-bold text-red-600">
                          ${userBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vote Buttons */}
                  {!votedVideos.has(selectedVideo.id) ? (
                    <>
                      {!canVote && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-sm flex gap-2">
                          <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <p>
                            Watch at least {VIDEO_MIN_WATCH_SECONDS} seconds before voting
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleVote(selectedVideo.id, "like")}
                          disabled={voting || !canVote}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ThumbsUp className="h-5 w-5" />
                          <span>Like</span>
                        </button>
                        <button
                          onClick={() => handleVote(selectedVideo.id, "dislike")}
                          disabled={voting || !canVote}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-background text-foreground font-semibold hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ThumbsDown className="h-5 w-5" />
                          <span>Dislike</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-900 dark:text-green-200 text-sm font-semibold text-center">
                      ✓ You've voted on this video
                    </div>
                  )}

                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 text-sm">
                      {error}
                    </div>
                  )}
                </>
              ) : loading ? (
                <div className="flex items-center justify-center min-h-96 card-base">
                  <p className="text-muted-foreground">Loading videos...</p>
                </div>
              ) : (
                <div className="text-center py-12 card-base">
                  <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No videos available</p>
                </div>
              )}
            </div>

            {/* Videos Sidebar */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg">Recommended</h3>
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {videos.map((video, index) => (
                  <button
                    key={video.id}
                    onClick={() => {
                      setSelectedVideo(video);
                      setWatchedSeconds(0);
                    }}
                    className={`w-full text-left p-2 rounded-lg border transition-colors ${
                      selectedVideo?.id === video.id
                        ? "border-red-600 bg-red-50 dark:bg-red-950"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className="aspect-video bg-black/5 rounded mb-2 flex items-center justify-center overflow-hidden relative group">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <p className="text-xs font-semibold line-clamp-2">
                      {index + 1}. {video.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ${video.rewardMin.toFixed(2)} - ${video.rewardMax.toFixed(2)}
                    </p>
                    {votedVideos.has(video.id) && (
                      <p className="text-xs text-red-600 font-semibold mt-1">
                        ✓ Voted
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
