"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveDBToFile = saveDBToFile;
exports.getDB = getDB;
exports.resetDB = resetDB;
exports.getDailyVoteCount = getDailyVoteCount;
exports.incrementDailyVoteCount = incrementDailyVoteCount;
exports.generateId = generateId;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let db = {
    users: new Map(),
    videos: new Map(),
    votes: new Map(),
    transactions: new Map(),
    withdrawals: new Map(),
    emailToUserId: new Map(),
    dailyVoteCount: new Map(),
};
const DB_FILE = path.join(process.cwd(), ".data", "db.json");
function ensureDataDir() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
        try {
            fs.mkdirSync(dir, { recursive: true });
        }
        catch (err) {
            // Ignore if can't create directory (e.g., read-only filesystem)
        }
    }
}
function loadDBFromFile() {
    try {
        ensureDataDir();
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, "utf-8");
            const parsed = JSON.parse(data);
            // Restore Maps from JSON
            db.users = new Map(parsed.users || []);
            db.votes = new Map(parsed.votes || []);
            db.transactions = new Map(parsed.transactions || []);
            db.withdrawals = new Map(parsed.withdrawals || []);
            db.emailToUserId = new Map(parsed.emailToUserId || []);
            db.dailyVoteCount = new Map(parsed.dailyVoteCount || []);
            db.videos = new Map(parsed.videos || []);
        }
    }
    catch (err) {
        // If we can't load from file, just use empty DB
        console.debug("Could not load DB from file, using fresh DB");
    }
}
function saveDBToFile() {
    try {
        ensureDataDir();
        const data = {
            users: Array.from(db.users.entries()),
            votes: Array.from(db.votes.entries()),
            transactions: Array.from(db.transactions.entries()),
            withdrawals: Array.from(db.withdrawals.entries()),
            emailToUserId: Array.from(db.emailToUserId.entries()),
            dailyVoteCount: Array.from(db.dailyVoteCount.entries()),
            videos: Array.from(db.videos.entries()),
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(data), "utf-8");
    }
    catch (err) {
        // Ignore write errors (e.g., read-only filesystem on serverless)
        console.debug("Could not save DB to file");
    }
}
// Generate random reward (0.30 to 27.00)
function generateReward() {
    const min = Math.round((Math.random() * (27.0 - 0.3) + 0.3) * 100) / 100;
    const max = Math.round((min + Math.random() * (27.0 - min)) * 100) / 100;
    return { min, max };
}
// Initialize with sample data
function initializeDB() {
    if (db.videos.size > 0)
        return; // Already initialized
    const getVideoReward = () => generateReward();
    const sampleVideos = [
        {
            id: "W5PRZuaQ3VM",
            title: "Video 1",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/W5PRZuaQ3VM",
            thumbnail: "https://img.youtube.com/vi/W5PRZuaQ3VM/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 240,
        },
        {
            id: "keOaQm6RpBg",
            title: "Video 2",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/keOaQm6RpBg",
            thumbnail: "https://img.youtube.com/vi/keOaQm6RpBg/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 180,
        },
        {
            id: "aP2up9N6H-g",
            title: "Video 3",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/aP2up9N6H-g",
            thumbnail: "https://img.youtube.com/vi/aP2up9N6H-g/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 300,
        },
        {
            id: "VGa1imApfdg",
            title: "Video 4",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/VGa1imApfdg",
            thumbnail: "https://img.youtube.com/vi/VGa1imApfdg/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 200,
        },
        {
            id: "C_BZQkU5Cds",
            title: "Video 5",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/C_BZQkU5Cds",
            thumbnail: "https://img.youtube.com/vi/C_BZQkU5Cds/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 240,
        },
        {
            id: "kQcq3rpne78",
            title: "Video 6",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/kQcq3rpne78",
            thumbnail: "https://img.youtube.com/vi/kQcq3rpne78/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 180,
        },
        {
            id: "gx-zPheFnHo",
            title: "Video 7",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/gx-zPheFnHo",
            thumbnail: "https://img.youtube.com/vi/gx-zPheFnHo/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 220,
        },
        {
            id: "0xzN6FM5x_E",
            title: "Video 8",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/0xzN6FM5x_E",
            thumbnail: "https://img.youtube.com/vi/0xzN6FM5x_E/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 260,
        },
        {
            id: "7oBZ8sBjdyQ",
            title: "Video 9",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/7oBZ8sBjdyQ",
            thumbnail: "https://img.youtube.com/vi/7oBZ8sBjdyQ/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 210,
        },
        {
            id: "UYaY2Kb_PKI",
            title: "Video 10",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/UYaY2Kb_PKI",
            thumbnail: "https://img.youtube.com/vi/UYaY2Kb_PKI/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 190,
        },
        {
            id: "s92UMJNjPIA",
            title: "Video 11",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/s92UMJNjPIA",
            thumbnail: "https://img.youtube.com/vi/s92UMJNjPIA/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 250,
        },
        {
            id: "qIVDxL2lgN4",
            title: "Video 12",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/qIVDxL2lgN4",
            thumbnail: "https://img.youtube.com/vi/qIVDxL2lgN4/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 280,
        },
        {
            id: "HXFkg0vwLpQ",
            title: "Video 13",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/HXFkg0vwLpQ",
            thumbnail: "https://img.youtube.com/vi/HXFkg0vwLpQ/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 200,
        },
        {
            id: "o-Ikkh5oxuo",
            title: "Video 14",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/o-Ikkh5oxuo",
            thumbnail: "https://img.youtube.com/vi/o-Ikkh5oxuo/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 240,
        },
        {
            id: "A92_B_mnO-I",
            title: "Video 15",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/A92_B_mnO-I",
            thumbnail: "https://img.youtube.com/vi/A92_B_mnO-I/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 180,
        },
        {
            id: "fvyBCesuxMM",
            title: "Video 16",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/fvyBCesuxMM",
            thumbnail: "https://img.youtube.com/vi/fvyBCesuxMM/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 270,
        },
        {
            id: "7QLzzSml07Y",
            title: "Video 17",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/7QLzzSml07Y",
            thumbnail: "https://img.youtube.com/vi/7QLzzSml07Y/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 230,
        },
        {
            id: "t8Zz1XGuPK8",
            title: "Video 18",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/t8Zz1XGuPK8",
            thumbnail: "https://img.youtube.com/vi/t8Zz1XGuPK8/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 210,
        },
        {
            id: "XMdrHHh2aJc",
            title: "Video 19",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/XMdrHHh2aJc",
            thumbnail: "https://img.youtube.com/vi/XMdrHHh2aJc/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 200,
        },
        {
            id: "ErwS24cBZPc",
            title: "Video 20",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/ErwS24cBZPc",
            thumbnail: "https://img.youtube.com/vi/ErwS24cBZPc/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 190,
        },
        {
            id: "OnQXRxW9VcQ",
            title: "Video 21",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/OnQXRxW9VcQ",
            thumbnail: "https://img.youtube.com/vi/OnQXRxW9VcQ/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 250,
        },
        {
            id: "MRV8mFWwtS4",
            title: "Video 22",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/MRV8mFWwtS4",
            thumbnail: "https://img.youtube.com/vi/MRV8mFWwtS4/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 220,
        },
        {
            id: "6vEEVNAOFFY",
            title: "Video 23",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/6vEEVNAOFFY",
            thumbnail: "https://img.youtube.com/vi/6vEEVNAOFFY/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 240,
        },
        {
            id: "A4WZF74dAg4",
            title: "Video 24",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/A4WZF74dAg4",
            thumbnail: "https://img.youtube.com/vi/A4WZF74dAg4/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 180,
        },
        {
            id: "taOdaf_nw3U",
            title: "Video 25",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/taOdaf_nw3U",
            thumbnail: "https://img.youtube.com/vi/taOdaf_nw3U/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 260,
        },
        {
            id: "imgPdo4TaT8",
            title: "Video 26",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/imgPdo4TaT8",
            thumbnail: "https://img.youtube.com/vi/imgPdo4TaT8/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 210,
        },
        {
            id: "wXcBGfXXL4w",
            title: "Video 27",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/wXcBGfXXL4w",
            thumbnail: "https://img.youtube.com/vi/wXcBGfXXL4w/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 230,
        },
        {
            id: "Kr8XAnR80XA",
            title: "Video 28",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/Kr8XAnR80XA",
            thumbnail: "https://img.youtube.com/vi/Kr8XAnR80XA/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 200,
        },
        {
            id: "qYbhqbOEaY8",
            title: "Video 29",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/qYbhqbOEaY8",
            thumbnail: "https://img.youtube.com/vi/qYbhqbOEaY8/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 270,
        },
        {
            id: "EbXSbP-wEFU",
            title: "Video 30",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/EbXSbP-wEFU",
            thumbnail: "https://img.youtube.com/vi/EbXSbP-wEFU/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 190,
        },
        {
            id: "50A9wjJ40Dk",
            title: "Video 31",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/50A9wjJ40Dk",
            thumbnail: "https://img.youtube.com/vi/50A9wjJ40Dk/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 240,
        },
        {
            id: "O6rHeD5x2tI",
            title: "Video 32",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/O6rHeD5x2tI",
            thumbnail: "https://img.youtube.com/vi/O6rHeD5x2tI/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 250,
        },
        {
            id: "vDGrfhJH1P4",
            title: "Video 33",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/vDGrfhJH1P4",
            thumbnail: "https://img.youtube.com/vi/vDGrfhJH1P4/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 220,
        },
        {
            id: "fLonJKaTQqM",
            title: "Video 34",
            description: "YouTube Video",
            url: "https://www.youtube.com/embed/fLonJKaTQqM",
            thumbnail: "https://img.youtube.com/vi/fLonJKaTQqM/maxresdefault.jpg",
            ...getVideoReward(),
            createdAt: new Date().toISOString(),
            duration: 280,
        },
    ];
    sampleVideos.forEach((video) => {
        db.videos.set(video.id, video);
    });
}
let isInitialized = false;
function getDB() {
    if (!isInitialized) {
        console.log("Initializing database...");
        loadDBFromFile();
        initializeDB();
        isInitialized = true;
        console.log(`Database initialized. Users: ${db.users.size}, Videos: ${db.videos.size}`);
    }
    return db;
}
function resetDB() {
    db = {
        users: new Map(),
        videos: new Map(),
        votes: new Map(),
        transactions: new Map(),
        withdrawals: new Map(),
        emailToUserId: new Map(),
        dailyVoteCount: new Map(),
    };
    initializeDB();
}
function getDailyVoteCount(userId) {
    const today = new Date().toISOString().split("T")[0];
    const record = db.dailyVoteCount.get(`${userId}:${today}`);
    return record ? record.count : 0;
}
function incrementDailyVoteCount(userId) {
    const today = new Date().toISOString().split("T")[0];
    const key = `${userId}:${today}`;
    const current = db.dailyVoteCount.get(key);
    db.dailyVoteCount.set(key, {
        count: (current?.count || 0) + 1,
        date: today,
    });
}
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
