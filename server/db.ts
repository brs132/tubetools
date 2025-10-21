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
      id: "W5PRZuaQ3VM",
      title: "Video 1",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/W5PRZuaQ3VM",
      thumbnail: "https://img.youtube.com/vi/W5PRZuaQ3VM/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "keOaQm6RpBg",
      title: "Video 2",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/keOaQm6RpBg",
      thumbnail: "https://img.youtube.com/vi/keOaQm6RpBg/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "aP2up9N6H-g",
      title: "Video 3",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/aP2up9N6H-g",
      thumbnail: "https://img.youtube.com/vi/aP2up9N6H-g/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "VGa1imApfdg",
      title: "Video 4",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/VGa1imApfdg",
      thumbnail: "https://img.youtube.com/vi/VGa1imApfdg/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "C_BZQkU5Cds",
      title: "Video 5",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/C_BZQkU5Cds",
      thumbnail: "https://img.youtube.com/vi/C_BZQkU5Cds/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "kQcq3rpne78",
      title: "Video 6",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/kQcq3rpne78",
      thumbnail: "https://img.youtube.com/vi/kQcq3rpne78/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "gx-zPheFnHo",
      title: "Video 7",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/gx-zPheFnHo",
      thumbnail: "https://img.youtube.com/vi/gx-zPheFnHo/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "0xzN6FM5x_E",
      title: "Video 8",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/0xzN6FM5x_E",
      thumbnail: "https://img.youtube.com/vi/0xzN6FM5x_E/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "7oBZ8sBjdyQ",
      title: "Video 9",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/7oBZ8sBjdyQ",
      thumbnail: "https://img.youtube.com/vi/7oBZ8sBjdyQ/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "UYaY2Kb_PKI",
      title: "Video 10",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/UYaY2Kb_PKI",
      thumbnail: "https://img.youtube.com/vi/UYaY2Kb_PKI/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "s92UMJNjPIA",
      title: "Video 11",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/s92UMJNjPIA",
      thumbnail: "https://img.youtube.com/vi/s92UMJNjPIA/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "qIVDxL2lgN4",
      title: "Video 12",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/qIVDxL2lgN4",
      thumbnail: "https://img.youtube.com/vi/qIVDxL2lgN4/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "HXFkg0vwLpQ",
      title: "Video 13",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/HXFkg0vwLpQ",
      thumbnail: "https://img.youtube.com/vi/HXFkg0vwLpQ/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "o-Ikkh5oxuo",
      title: "Video 14",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/o-Ikkh5oxuo",
      thumbnail: "https://img.youtube.com/vi/o-Ikkh5oxuo/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "A92_B_mnO-I",
      title: "Video 15",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/A92_B_mnO-I",
      thumbnail: "https://img.youtube.com/vi/A92_B_mnO-I/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "fvyBCesuxMM",
      title: "Video 16",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/fvyBCesuxMM",
      thumbnail: "https://img.youtube.com/vi/fvyBCesuxMM/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "7QLzzSml07Y",
      title: "Video 17",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/7QLzzSml07Y",
      thumbnail: "https://img.youtube.com/vi/7QLzzSml07Y/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "t8Zz1XGuPK8",
      title: "Video 18",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/t8Zz1XGuPK8",
      thumbnail: "https://img.youtube.com/vi/t8Zz1XGuPK8/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "XMdrHHh2aJc",
      title: "Video 19",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/XMdrHHh2aJc",
      thumbnail: "https://img.youtube.com/vi/XMdrHHh2aJc/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "ErwS24cBZPc",
      title: "Video 20",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/ErwS24cBZPc",
      thumbnail: "https://img.youtube.com/vi/ErwS24cBZPc/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "OnQXRxW9VcQ",
      title: "Video 21",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/OnQXRxW9VcQ",
      thumbnail: "https://img.youtube.com/vi/OnQXRxW9VcQ/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "MRV8mFWwtS4",
      title: "Video 22",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/MRV8mFWwtS4",
      thumbnail: "https://img.youtube.com/vi/MRV8mFWwtS4/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "6vEEVNAOFFY",
      title: "Video 23",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/6vEEVNAOFFY",
      thumbnail: "https://img.youtube.com/vi/6vEEVNAOFFY/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "A4WZF74dAg4",
      title: "Video 24",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/A4WZF74dAg4",
      thumbnail: "https://img.youtube.com/vi/A4WZF74dAg4/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "taOdaf_nw3U",
      title: "Video 25",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/taOdaf_nw3U",
      thumbnail: "https://img.youtube.com/vi/taOdaf_nw3U/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "imgPdo4TaT8",
      title: "Video 26",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/imgPdo4TaT8",
      thumbnail: "https://img.youtube.com/vi/imgPdo4TaT8/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "wXcBGfXXL4w",
      title: "Video 27",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/wXcBGfXXL4w",
      thumbnail: "https://img.youtube.com/vi/wXcBGfXXL4w/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "Kr8XAnR80XA",
      title: "Video 28",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/Kr8XAnR80XA",
      thumbnail: "https://img.youtube.com/vi/Kr8XAnR80XA/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "qYbhqbOEaY8",
      title: "Video 29",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/qYbhqbOEaY8",
      thumbnail: "https://img.youtube.com/vi/qYbhqbOEaY8/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "EbXSbP-wEFU",
      title: "Video 30",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/EbXSbP-wEFU",
      thumbnail: "https://img.youtube.com/vi/EbXSbP-wEFU/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "50A9wjJ40Dk",
      title: "Video 31",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/50A9wjJ40Dk",
      thumbnail: "https://img.youtube.com/vi/50A9wjJ40Dk/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "O6rHeD5x2tI",
      title: "Video 32",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/O6rHeD5x2tI",
      thumbnail: "https://img.youtube.com/vi/O6rHeD5x2tI/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "vDGrfhJH1P4",
      title: "Video 33",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/vDGrfhJH1P4",
      thumbnail: "https://img.youtube.com/vi/vDGrfhJH1P4/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "fLonJKaTQqM",
      title: "Video 34",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/fLonJKaTQqM",
      thumbnail: "https://img.youtube.com/vi/fLonJKaTQqM/maxresdefault.jpg",
      rewardMin: 0.3,
      rewardMax: 2.0,
      createdAt: new Date().toISOString(),
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
