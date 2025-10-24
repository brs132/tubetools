import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getUser } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api-client";
import { Video, VoteResponse } from "@shared/api";
import Layout from "@/components/Layout";
import MoneyAnimation from "@/components/MoneyAnimation";
import VideoPlayer from "@/components/VideoPlayer";
import { VIDEO_MIN_WATCH_SECONDS } from "@/lib/constants";
import {
  ThumbsUp,
  ThumbsDown,
  Play,
  Zap,
  Eye,
  MessageCircle,
  Calendar,
  Star,
} from "lucide-react";

interface MoneyAnimationData {
  id: string;
  amount: number;
  x: number;
  y: number;
}

interface EnhancedVideo extends Video {
  rating?: number;
  views?: number;
  uploadedAt?: string;
  sessionId?: string;
}

export default function Feed() {
  const navigate = useNavigate();
  const user = getUser();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [displayedVideos, setDisplayedVideos] = useState<EnhancedVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<EnhancedVideo | null>(
    null,
  );
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [votedVideos, setVotedVideos] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [dailyVotesRemaining, setDailyVotesRemaining] = useState(7);
  const [moneyAnimations, setMoneyAnimations] = useState<MoneyAnimationData[]>(
    [],
  );
  const [totalVideosWatched, setTotalVideosWatched] = useState(0);
  const [votingStreak, setVotingStreak] = useState(user?.votingStreak || 0);
  const [votingDaysCount, setVotingDaysCount] = useState(
    user?.votingDaysCount || 0,
  );
  const [videoDuration, setVideoDuration] = useState(180);
  const [videoLoadAttempts, setVideoLoadAttempts] = useState<
    Record<string, number>
  >({});
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState(false);
  const [videoRetryTrigger, setVideoRetryTrigger] = useState(0);

  // Shuffle array
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Generate random video rating 1-10
  const generateRating = (): number => {
    return Math.floor(Math.random() * 10) + 1;
  };

  // Generate random views
  const generateViews = (): number => {
    return Math.floor(Math.random() * 1000000) + 10000;
  };

  // Generate random reward range (0.30 to 27.00)
  const generateRewardRange = (): { min: number; max: number } => {
    const min = Math.round((Math.random() * (27.0 - 0.3) + 0.3) * 100) / 100;
    const max = Math.round((min + Math.random() * (27.0 - min)) * 100) / 100;
    return { min, max };
  };

  // Generate enhanced videos with infinite scroll capability
  const generateEnhancedVideos = (videos: Video[]): EnhancedVideo[] => {
    return videos.map((video) => {
      const { min, max } = generateRewardRange();
      return {
        ...video,
        rating: generateRating(),
        views: generateViews(),
        uploadedAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        rewardMin: min,
        rewardMax: max,
      };
    });
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }

    const user = getUser();
    if (user) {
      setUserBalance(user.balance);
      setVotingStreak(user.votingStreak || 0);
    }

    loadVideos();
    loadUserStats();
  }, [navigate]);

  const loadUserStats = async () => {
    try {
      const data = await apiGet<any>("/api/balance");
      if (data.user) {
        setUserBalance(data.user.balance);
        setVotingStreak(data.user.votingStreak || 0);
        // Update local storage with synced user data
        const authToken = localStorage.getItem("authToken");
        if (authToken) {
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...data.user,
              votingDaysCount: data.user.votingDaysCount || 0,
            }),
          );
        }
      }

      // Refetch daily votes remaining and total votes from server
      const voteData = await apiGet<any>("/api/daily-votes");
      setDailyVotesRemaining(voteData.remaining || 7);
      setTotalVideosWatched(voteData.totalVotes || 0);
    } catch (err) {
      // Silently fail - use local state
      console.debug("Failed to load user stats:", err);
    }
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await apiGet<Video[]>("/api/videos");
      setAllVideos(data);

      // Generate initial batch with randomization
      generateNewBatch(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const generateNewBatch = (baseVideos: Video[]) => {
    const shuffled = shuffleArray(baseVideos);
    const enhanced = generateEnhancedVideos(shuffled);
    setDisplayedVideos(enhanced);

    if (enhanced.length > 0) {
      setSelectedVideo(enhanced[0]);
      setWatchedSeconds(0);
    }
  };

  // When selected video changes, reset watched seconds and loading state
  useEffect(() => {
    if (selectedVideo) {
      setWatchedSeconds(0);
      setVideoDuration(selectedVideo.duration || 180);
      setVideoLoading(true);
      setVideoLoadError(false);
      setMoneyAnimations([]);
      setVideoRetryTrigger(0);
    }
  }, [selectedVideo]);

  // Memoized callbacks para evitar recriação do player
  const handleTimeUpdate = useCallback((time: number) => {
    setWatchedSeconds(time);
  }, []);

  const handleDurationReady = useCallback((duration: number) => {
    setVideoDuration(duration);
  }, []);

  const handleVote = useCallback(
    async (
      videoId: string,
      voteType: "like" | "dislike",
      event: React.MouseEvent,
    ) => {
      const effectiveDuration = Math.max(1, videoDuration - 1);
      const secondsRemaining = Math.max(0, effectiveDuration - watchedSeconds);

      if (dailyVotesRemaining <= 0) {
        setError("You've reached your daily vote limit. Come back tomorrow!");
        return;
      }

      if (watchedSeconds < effectiveDuration) {
        const remaining = Math.ceil(secondsRemaining);
        setError(
          `Por favor, assista o vídeo completo. ${remaining}s restantes.`,
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
        setTotalVideosWatched((prev) => prev + 1);
        setVotingStreak(response.votingStreak || 0);
        setVotingDaysCount(response.votingDaysCount || votingDaysCount);

        // Add money animation
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const newAnimation: MoneyAnimationData = {
          id: `anim-${Date.now()}-${Math.random()}`,
          amount: response.rewardAmount,
          x: rect.left + rect.width / 2,
          y: rect.top,
        };
        setMoneyAnimations((prev) => [...prev, newAnimation]);

        // Move to next video
        setTimeout(() => {
          setMoneyAnimations([]); // Clear any lingering money animations
          const currentIndex = displayedVideos.findIndex(
            (v) => v.id === videoId,
          );
          if (currentIndex < displayedVideos.length - 1) {
            setSelectedVideo(displayedVideos[currentIndex + 1]);
            setWatchedSeconds(0);
          } else if (response.dailyVotesRemaining > 0) {
            // Generate infinite videos by reshuffling
            generateNewBatch(allVideos);
            setWatchedSeconds(0);
          } else {
            setError(
              "You've reached your daily vote limit. Come back tomorrow!",
            );
          }
        }, 800);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "";
        if (errorMsg.includes("daily vote limit")) {
          setDailyVotesRemaining(0);
          setError("You've reached your daily vote limit. Come back tomorrow!");
        } else {
          // Silently fail for other errors
          console.error("Vote error:", err);
        }
      } finally {
        setVoting(false);
      }
    },
    [
      videoDuration,
      watchedSeconds,
      dailyVotesRemaining,
      votingDaysCount,
      displayedVideos,
      allVideos,
    ],
  );

  const removeMoneyAnimation = (id: string) => {
    setMoneyAnimations((prev) => prev.filter((anim) => anim.id !== id));
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const getTimeAgo = (date: string): string => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diff < 60) return "now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 604800)}w ago`;
  };

  if (!isAuthenticated()) return null;

  // Reduce duration by 1 second for voting threshold
  const effectiveDuration = Math.max(1, videoDuration - 1);
  const canVote =
    watchedSeconds >= effectiveDuration && dailyVotesRemaining > 0;
  const watchProgressPercent = Math.min(
    effectiveDuration > 0 ? (watchedSeconds / effectiveDuration) * 100 : 0,
    100,
  );
  const secondsRemaining = Math.max(0, effectiveDuration - watchedSeconds);

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
              {/* Daily Votes & Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card-base p-4 bg-gradient-to-r from-red-600/10 to-red-600/5 border-red-200 dark:border-red-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Votes Left
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {dailyVotesRemaining}
                      </p>
                    </div>
                    <Zap className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="card-base p-4 bg-gradient-to-r from-blue-600/10 to-blue-600/5 border-blue-200 dark:border-blue-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Watched
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {totalVideosWatched}
                      </p>
                    </div>
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="card-base p-4 bg-gradient-to-r from-orange-600/10 to-orange-600/5 border-orange-200 dark:border-orange-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Streak
                      </p>
                      <p className="text-2xl font-bold text-orange-600">
                        {votingStreak}
                      </p>
                    </div>
                    <span className="text-xl">🔥</span>
                  </div>
                </div>
              </div>

              {selectedVideo ? (
                <>
                  {/* Video Container */}
                  <div
                    className="card-base p-0 bg-black relative"
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      className="aspect-video w-full relative flex items-center justify-center"
                      style={{ overflow: "hidden" }}
                    >
                      {videoLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4" />
                          <p className="text-white text-sm">
                            Carregando vídeo...
                          </p>
                        </div>
                      )}
                      {videoLoadError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                          <p className="text-red-500 text-sm mb-4">
                            Erro ao carregar vídeo
                          </p>
                          <button
                            onClick={() => {
                              setVideoRetryTrigger((prev) => prev + 1);
                              setVideoLoadError(false);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                          >
                            Tentar Novamente
                          </button>
                        </div>
                      )}
                      <VideoPlayer
                        key={`${selectedVideo.id}-${videoRetryTrigger}`}
                        videoId={selectedVideo.id}
                        onTimeUpdate={handleTimeUpdate}
                        onDurationReady={handleDurationReady}
                        onLoadFail={() => {
                          const attempts =
                            videoLoadAttempts[selectedVideo.id] || 0;
                          const newAttempts = attempts + 1;

                          console.log(
                            `[Feed] Video ${selectedVideo.id} load failed, attempt ${newAttempts}/2`,
                          );

                          if (newAttempts >= 2) {
                            // Skip to next video after 2 failed attempts
                            console.log(
                              `[Feed] Max attempts reached, skipping to next video`,
                            );
                            setError(
                              "Vídeo não carregou. Pulando para o próximo...",
                            );

                            setTimeout(() => {
                              const currentIndex =
                                displayedVideos.findIndex(
                                  (v) => v.id === selectedVideo.id,
                                ) || 0;
                              if (currentIndex < displayedVideos.length - 1) {
                                setSelectedVideo(
                                  displayedVideos[currentIndex + 1],
                                );
                              } else {
                                // Generate new batch if at end
                                generateNewBatch(allVideos);
                              }
                              setVideoLoadAttempts({});
                              setVideoLoadError(false);
                            }, 2000);
                          } else {
                            // Show error and allow retry
                            setVideoLoadAttempts((prev) => ({
                              ...prev,
                              [selectedVideo.id]: newAttempts,
                            }));
                            setVideoLoadError(true);
                          }
                        }}
                        onLoadSuccess={() => {
                          console.log(
                            `[Feed] Video ${selectedVideo.id} loaded successfully`,
                          );
                          setVideoLoading(false);
                          setVideoLoadError(false);
                          // Reset attempts on success
                          setVideoLoadAttempts({});
                        }}
                      />
                    </div>
                  </div>

                  {/* Watch Progress Bar */}
                  {!votedVideos.has(selectedVideo.id) && (
                    <div className="space-y-2">
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-red-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${watchProgressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Video Info */}
                  <div className="card-base space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        {selectedVideo.title}
                      </h2>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>
                            {formatViews(selectedVideo.views || 0)} views
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {getTimeAgo(
                              selectedVideo.uploadedAt ||
                                new Date().toISOString(),
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Star className="h-4 w-4 fill-yellow-600" />
                          <span>{selectedVideo.rating || 5}/10</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          REWARD
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
                        <p className="text-lg font-bold text-green-600">
                          ${userBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vote Buttons */}
                  {dailyVotesRemaining <= 0 && (
                    <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200 text-sm">
                      You've reached your daily vote limit. Come back tomorrow!
                    </div>
                  )}

                  {!votedVideos.has(selectedVideo.id) &&
                    watchedSeconds < videoDuration && (
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-sm">
                        Por favor, assista o vídeo completo.{" "}
                        <span className="font-semibold">
                          {Math.ceil(secondsRemaining)}s
                        </span>{" "}
                        restantes para votar.
                      </div>
                    )}

                  <div className="flex gap-3">
                    <button
                      onClick={(e) => handleVote(selectedVideo.id, "like", e)}
                      disabled={voting || !canVote}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ThumbsUp className="h-5 w-5" />
                      <span>Like</span>
                    </button>
                    <button
                      onClick={(e) =>
                        handleVote(selectedVideo.id, "dislike", e)
                      }
                      disabled={voting || !canVote}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ThumbsDown className="h-5 w-5" />
                      <span>Dislike</span>
                    </button>
                  </div>

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
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Play className="h-4 w-4" />
                Playlist
              </h3>
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {displayedVideos.slice(0, 10).map((video, index) => (
                  <button
                    key={`${video.id}-${index}`}
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
                      <div className="absolute top-1 right-1 text-xs font-bold text-yellow-600 bg-black/70 px-1.5 py-0.5 rounded">
                        {video.rating || 5}/10
                      </div>
                    </div>
                    <p className="text-xs font-semibold line-clamp-2">
                      {index + 1}. {video.title}
                    </p>
                    <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                      <span>${video.rewardMin.toFixed(2)}</span>
                      {votedVideos.has(video.id) && (
                        <span className="text-red-600 font-semibold">✓</span>
                      )}
                    </div>
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
