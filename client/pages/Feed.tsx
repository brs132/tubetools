import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getUser } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api-client";
import { Video, VoteResponse } from "@shared/api";
import Layout from "@/components/Layout";
import { ThumbsUp, ThumbsDown, Play, ChevronRight } from "lucide-react";

export default function Feed() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [votedVideos, setVotedVideos] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

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

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await apiGet<Video[]>("/api/videos");
      setVideos(data);
      if (data.length > 0) {
        setSelectedVideo(data[0]);
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

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        {selectedVideo ? (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="md:col-span-2 space-y-4">
              <div className="card-base p-0 overflow-hidden">
                <div className="aspect-video bg-black/5 flex items-center justify-center relative">
                  <video
                    key={selectedVideo.id}
                    src={selectedVideo.url}
                    controls
                    className="w-full h-full"
                    autoPlay
                  />
                </div>
              </div>

              {/* Video Info */}
              <div className="card-base space-y-3">
                <h2 className="text-2xl font-bold">{selectedVideo.title}</h2>
                <p className="text-muted-foreground">{selectedVideo.description}</p>

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
                    <p className="text-lg font-bold text-accent">
                      ${userBalance.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vote Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleVote(selectedVideo.id, "like")}
                  disabled={voting || votedVideos.has(selectedVideo.id)}
                  className="flex-1 flex items-center justify-center gap-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ThumbsUp className="h-5 w-5" />
                  <span>Like</span>
                </button>
                <button
                  onClick={() => handleVote(selectedVideo.id, "dislike")}
                  disabled={voting || votedVideos.has(selectedVideo.id)}
                  className="flex-1 flex items-center justify-center gap-2 btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ThumbsDown className="h-5 w-5" />
                  <span>Dislike</span>
                </button>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Video List Sidebar */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg">More Videos</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {videos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedVideo?.id === video.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className="aspect-video bg-black/5 rounded mb-2 flex items-center justify-center overflow-hidden">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-semibold line-clamp-2">
                      {video.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ${video.rewardMin.toFixed(2)} - ${video.rewardMax.toFixed(2)}
                    </p>
                    {votedVideos.has(video.id) && (
                      <p className="text-xs text-accent font-semibold mt-1">✓ Voted</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center min-h-96">
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No videos available</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
