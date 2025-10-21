import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getUser } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api-client";
import { Video, VoteResponse } from "@shared/api";
import Layout from "@/components/Layout";
import MoneyAnimation from "@/components/MoneyAnimation";
import { VIDEO_MIN_WATCH_SECONDS } from "@/lib/constants";
import { ThumbsUp, ThumbsDown, Play, Clock, Zap } from "lucide-react";

interface MoneyAnimationData {
  id: string;
  amount: number;
  x: number;
  y: number;
}

export default function Feed() {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [displayedVideos, setDisplayedVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [votedVideos, setVotedVideos] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [watchTimer, setWatchTimer] = useState<NodeJS.Timeout | null>(null);
  const [isVideoFocused, setIsVideoFocused] = useState(false);
  const [dailyVotesRemaining, setDailyVotesRemaining] = useState(7);
  const [moneyAnimations, setMoneyAnimations] = useState<MoneyAnimationData[]>(
    [],
  );

  // Shuffle array
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

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
      setAllVideos(data);

      // Shuffle videos and select random ones for today
      const shuffled = shuffleArray(data);
      setDisplayedVideos(shuffled);

      if (shuffled.length > 0) {
        setSelectedVideo(shuffled[0]);
        setWatchedSeconds(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (
    videoId: string,
    voteType: "like" | "dislike",
    event: React.MouseEvent,
  ) => {
    if (votedVideos.has(videoId)) {
      setError("You've already voted on this video");
      return;
    }

    if (dailyVotesRemaining <= 0) {
      setError("You've reached your daily vote limit (7 votes)");
      return;
    }

    if (watchedSeconds < VIDEO_MIN_WATCH_SECONDS) {
      setError(
        `Please watch at least ${VIDEO_MIN_WATCH_SECONDS} seconds before voting`,
      );
      return;
    }

    setVoting(true);
    setError("");

    try {
      const response = await apiPost<any>(`/api/videos/${videoId}/vote`, {
        voteType,
      });

      setUserBalance(response.newBalance);
      setVotedVideos((prev) => new Set([...prev, videoId]));
      setDailyVotesRemaining(response.dailyVotesRemaining || 0);

      // Add money animation
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const newAnimation: MoneyAnimationData = {
        id: `anim-${Date.now()}-${Math.random()}`,
        amount: response.rewardAmount,
        x: rect.left + rect.width / 2,
        y: rect.top,
      };
      setMoneyAnimations((prev) => [...prev, newAnimation]);

      // Move to next video after a brief delay
      setTimeout(() => {
        const currentIndex = displayedVideos.findIndex((v) => v.id === videoId);
        if (currentIndex < displayedVideos.length - 1) {
          setSelectedVideo(displayedVideos[currentIndex + 1]);
          setWatchedSeconds(0);
        } else if (response.dailyVotesRemaining > 0) {
          setError("No more videos available today. Come back tomorrow!");
        }
      }, 800);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to vote";
      if (errorMsg.includes("daily vote limit")) {
        setDailyVotesRemaining(0);
      }
      setError(errorMsg);
    } finally {
      setVoting(false);
    }
  };

  const removeMoneyAnimation = (id: string) => {
    setMoneyAnimations((prev) => prev.filter((anim) => anim.id !== id));
  };

  if (!isAuthenticated()) return null;

  const canVote =
    watchedSeconds >= VIDEO_MIN_WATCH_SECONDS && dailyVotesRemaining > 0;
  const watchProgressPercent = Math.min(
    (watchedSeconds / VIDEO_MIN_WATCH_SECONDS) * 100,
    100,
  );

  return (
    <Layout>
      <div className="bg-background min-h-screen">
        {/* Money Animations */}
        {moneyAnimations.map((anim) => (
          <MoneyAnimation
            key={anim.id}
            amount={anim.amount}
            x={anim.x}
            y={anim.y}
            onComplete={() => removeMoneyAnimation(anim.id)}
          />
        ))}

        <div className="container px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Main Video Player */}
            <div className="lg:col-span-2 space-y-4">
              {/* Daily Votes Indicator */}
              <div className="card-base p-4 bg-gradient-to-r from-red-600/10 to-red-600/5 border-red-200 dark:border-red-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-semibold">Daily Votes</p>
                      <p className="text-xs text-muted-foreground">
                        {7 - dailyVotesRemaining} / 7 votes used today
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">
                      {dailyVotesRemaining}
                    </p>
                    <p className="text-xs text-muted-foreground">remaining</p>
                  </div>
                </div>
                <div className="mt-3 w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-red-600 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${((7 - dailyVotesRemaining) / 7) * 100}%`,
                    }}
                  />
                </div>
              </div>

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
                          {Math.round(watchedSeconds)}s /{" "}
                          {VIDEO_MIN_WATCH_SECONDS}s
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
                    <h2 className="text-2xl font-bold">
                      {selectedVideo.title}
                    </h2>
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
                      {!canVote && dailyVotesRemaining > 0 && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-sm flex gap-2">
                          <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <p>
                            Watch at least {VIDEO_MIN_WATCH_SECONDS} seconds
                            before voting
                          </p>
                        </div>
                      )}

                      {dailyVotesRemaining <= 0 && (
                        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200 text-sm">
                          You've reached your daily vote limit. Come back
                          tomorrow!
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={(e) =>
                            handleVote(selectedVideo.id, "like", e)
                          }
                          disabled={voting || !canVote}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ThumbsUp className="h-5 w-5" />
                          <span>Like</span>
                        </button>
                        <button
                          onClick={(e) =>
                            handleVote(selectedVideo.id, "dislike", e)
                          }
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

            {/* Videos Sidebar - Desktop Only */}
            <div className="space-y-3 hidden lg:block">
              <h3 className="font-bold text-lg">
                Today's Videos ({displayedVideos.length})
              </h3>
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {displayedVideos.map((video, index) => (
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
                      ${video.rewardMin.toFixed(2)} - $
                      {video.rewardMax.toFixed(2)}
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
