import { UserData, Video, Vote, Transaction, Withdrawal } from "@shared/api";

// In-memory database (for development - would be replaced with real DB)
export interface DBUser extends UserData {}
export interface DBVideo extends Video {}
export interface DBVote extends Vote {}
export interface DBTransaction extends Transaction {}
export interface DBWithdrawal extends Withdrawal {}

interface DB {
  users: Map<string, DBUser>;
  videos: Map<string, DBVideo>;
  votes: Map<string, DBVote>;
  transactions: Map<string, DBTransaction>;
  withdrawals: Map<string, DBWithdrawal>;
  emailToUserId: Map<string, string>;
}

let db: DB = {
  users: new Map(),
  videos: new Map(),
  votes: new Map(),
  transactions: new Map(),
  withdrawals: new Map(),
  emailToUserId: new Map(),
};

// Initialize with sample data
function initializeDB() {
  if (db.videos.size > 0) return; // Already initialized

  const sampleVideos: DBVideo[] = [
    {
      id: "video-1",
      title: "Amazing Nature Documentary",
      description: "Breathtaking views of wildlife in their natural habitat",
      url: "https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4",
      thumbnail:
        "https://peach.blender.org/wp-content/uploads/12_video_bunny.png?x11217",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "video-2",
      title: "Cooking Tutorial - Easy Pasta",
      description: "Learn how to make delicious homemade pasta in 10 minutes",
      url: "https://commondatastorage.googleapis.com/gtv-videos-library/sample/ElephantsDream.mp4",
      thumbnail:
        "https://download.blender.org/demo/movies/ElephantsDream/ed_teaser.png",
      rewardMin: 0.5,
      rewardMax: 1.5,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "video-3",
      title: "Tech News Update",
      description: "Latest developments in technology and AI",
      url: "https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerBlazes.mp4",
      thumbnail:
        "https://peach.blender.org/wp-content/uploads/12_video_bunny.png?x11217",
      rewardMin: 0.3,
      rewardMax: 1.8,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: "video-4",
      title: "Fitness Challenge - Home Workout",
      description: "30-minute full body workout no equipment needed",
      url: "https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerEscapes.mp4",
      thumbnail:
        "https://download.blender.org/demo/movies/ElephantsDream/ed_teaser.png",
      rewardMin: 0.4,
      rewardMax: 2.0,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: "video-5",
      title: "Travel Vlog - Japan Adventure",
      description: "Exploring the streets of Tokyo and local culture",
      url: "https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerJoyrides.mp4",
      thumbnail:
        "https://peach.blender.org/wp-content/uploads/12_video_bunny.png?x11217",
      rewardMin: 0.6,
      rewardMax: 2.0,
      createdAt: new Date(Date.now() - 345600000).toISOString(),
    },
  ];

  sampleVideos.forEach((video) => {
    db.videos.set(video.id, video);
  });
}

export function getDB(): DB {
  initializeDB();
  return db;
}

export function resetDB() {
  db = {
    users: new Map(),
    videos: new Map(),
    votes: new Map(),
    transactions: new Map(),
    withdrawals: new Map(),
    emailToUserId: new Map(),
  };
  initializeDB();
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
