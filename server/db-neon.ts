import { Pool } from "@neondatabase/serverless";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error(
        "[getPool] DATABASE_URL is not set! Available env vars:",
        Object.keys(process.env)
          .filter((k) => !k.includes("SECRET"))
          .sort(),
      );
      throw new Error("DATABASE_URL environment variable is not set");
    }
    console.log("[getPool] Creating new pool with DATABASE_URL");
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function executeQuery(sql: string, params: any[] = []) {
  try {
    const client = await getPool().connect();
    try {
      console.log(
        "[executeQuery] Executing SQL:",
        sql.substring(0, 50),
        "params:",
        params,
      );
      const result = await client.query(sql, params);
      console.log("[executeQuery] Query successful, rows:", result.rows.length);
      return result;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(
      "[executeQuery] Database error:",
      err instanceof Error ? err.message : err,
    );
    throw err;
  }
}

export async function executeSingleQuery(sql: string, params: any[] = []) {
  try {
    const result = await executeQuery(sql, params);
    const row = result.rows[0] || null;
    console.log("[executeSingleQuery] Result:", row ? "found" : "not found");
    return row;
  } catch (err) {
    console.error(
      "[executeSingleQuery] Error:",
      err instanceof Error ? err.message : err,
    );
    throw err;
  }
}

export async function seedVideos() {
  const getVideoReward = () => {
    const min = Math.round((Math.random() * (27.0 - 0.3) + 0.3) * 100) / 100;
    const max = Math.round((min + Math.random() * (27.0 - min)) * 100) / 100;
    return { min, max };
  };

  const sampleVideos = [
    {
      id: "W5PRZuaQ3VM",
      title: "Video 1",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/W5PRZuaQ3VM",
      thumbnail: "https://img.youtube.com/vi/W5PRZuaQ3VM/maxresdefault.jpg",
      duration: 240,
    },
    {
      id: "keOaQm6RpBg",
      title: "Video 2",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/keOaQm6RpBg",
      thumbnail: "https://img.youtube.com/vi/keOaQm6RpBg/maxresdefault.jpg",
      duration: 180,
    },
    {
      id: "aP2up9N6H-g",
      title: "Video 3",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/aP2up9N6H-g",
      thumbnail: "https://img.youtube.com/vi/aP2up9N6H-g/maxresdefault.jpg",
      duration: 300,
    },
    {
      id: "VGa1imApfdg",
      title: "Video 4",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/VGa1imApfdg",
      thumbnail: "https://img.youtube.com/vi/VGa1imApfdg/maxresdefault.jpg",
      duration: 200,
    },
    {
      id: "C_BZQkU5Cds",
      title: "Video 5",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/C_BZQkU5Cds",
      thumbnail: "https://img.youtube.com/vi/C_BZQkU5Cds/maxresdefault.jpg",
      duration: 240,
    },
    {
      id: "kQcq3rpne78",
      title: "Video 6",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/kQcq3rpne78",
      thumbnail: "https://img.youtube.com/vi/kQcq3rpne78/maxresdefault.jpg",
      duration: 180,
    },
    {
      id: "gx-zPheFnHo",
      title: "Video 7",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/gx-zPheFnHo",
      thumbnail: "https://img.youtube.com/vi/gx-zPheFnHo/maxresdefault.jpg",
      duration: 220,
    },
    {
      id: "0xzN6FM5x_E",
      title: "Video 8",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/0xzN6FM5x_E",
      thumbnail: "https://img.youtube.com/vi/0xzN6FM5x_E/maxresdefault.jpg",
      duration: 260,
    },
    {
      id: "7oBZ8sBjdyQ",
      title: "Video 9",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/7oBZ8sBjdyQ",
      thumbnail: "https://img.youtube.com/vi/7oBZ8sBjdyQ/maxresdefault.jpg",
      duration: 210,
    },
    {
      id: "UYaY2Kb_PKI",
      title: "Video 10",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/UYaY2Kb_PKI",
      thumbnail: "https://img.youtube.com/vi/UYaY2Kb_PKI/maxresdefault.jpg",
      duration: 190,
    },
    {
      id: "s92UMJNjPIA",
      title: "Video 11",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/s92UMJNjPIA",
      thumbnail: "https://img.youtube.com/vi/s92UMJNjPIA/maxresdefault.jpg",
      duration: 250,
    },
    {
      id: "qIVDxL2lgN4",
      title: "Video 12",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/qIVDxL2lgN4",
      thumbnail: "https://img.youtube.com/vi/qIVDxL2lgN4/maxresdefault.jpg",
      duration: 280,
    },
    {
      id: "HXFkg0vwLpQ",
      title: "Video 13",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/HXFkg0vwLpQ",
      thumbnail: "https://img.youtube.com/vi/HXFkg0vwLpQ/maxresdefault.jpg",
      duration: 200,
    },
    {
      id: "o-Ikkh5oxuo",
      title: "Video 14",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/o-Ikkh5oxuo",
      thumbnail: "https://img.youtube.com/vi/o-Ikkh5oxuo/maxresdefault.jpg",
      duration: 240,
    },
    {
      id: "A92_B_mnO-I",
      title: "Video 15",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/A92_B_mnO-I",
      thumbnail: "https://img.youtube.com/vi/A92_B_mnO-I/maxresdefault.jpg",
      duration: 180,
    },
    {
      id: "fvyBCesuxMM",
      title: "Video 16",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/fvyBCesuxMM",
      thumbnail: "https://img.youtube.com/vi/fvyBCesuxMM/maxresdefault.jpg",
      duration: 270,
    },
    {
      id: "7QLzzSml07Y",
      title: "Video 17",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/7QLzzSml07Y",
      thumbnail: "https://img.youtube.com/vi/7QLzzSml07Y/maxresdefault.jpg",
      duration: 230,
    },
    {
      id: "t8Zz1XGuPK8",
      title: "Video 18",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/t8Zz1XGuPK8",
      thumbnail: "https://img.youtube.com/vi/t8Zz1XGuPK8/maxresdefault.jpg",
      duration: 210,
    },
    {
      id: "XMdrHHh2aJc",
      title: "Video 19",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/XMdrHHh2aJc",
      thumbnail: "https://img.youtube.com/vi/XMdrHHh2aJc/maxresdefault.jpg",
      duration: 200,
    },
    {
      id: "ErwS24cBZPc",
      title: "Video 20",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/ErwS24cBZPc",
      thumbnail: "https://img.youtube.com/vi/ErwS24cBZPc/maxresdefault.jpg",
      duration: 190,
    },
    {
      id: "OnQXRxW9VcQ",
      title: "Video 21",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/OnQXRxW9VcQ",
      thumbnail: "https://img.youtube.com/vi/OnQXRxW9VcQ/maxresdefault.jpg",
      duration: 250,
    },
    {
      id: "MRV8mFWwtS4",
      title: "Video 22",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/MRV8mFWwtS4",
      thumbnail: "https://img.youtube.com/vi/MRV8mFWwtS4/maxresdefault.jpg",
      duration: 220,
    },
    {
      id: "6vEEVNAOFFY",
      title: "Video 23",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/6vEEVNAOFFY",
      thumbnail: "https://img.youtube.com/vi/6vEEVNAOFFY/maxresdefault.jpg",
      duration: 240,
    },
    {
      id: "A4WZF74dAg4",
      title: "Video 24",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/A4WZF74dAg4",
      thumbnail: "https://img.youtube.com/vi/A4WZF74dAg4/maxresdefault.jpg",
      duration: 180,
    },
    {
      id: "taOdaf_nw3U",
      title: "Video 25",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/taOdaf_nw3U",
      thumbnail: "https://img.youtube.com/vi/taOdaf_nw3U/maxresdefault.jpg",
      duration: 260,
    },
    {
      id: "imgPdo4TaT8",
      title: "Video 26",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/imgPdo4TaT8",
      thumbnail: "https://img.youtube.com/vi/imgPdo4TaT8/maxresdefault.jpg",
      duration: 210,
    },
    {
      id: "wXcBGfXXL4w",
      title: "Video 27",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/wXcBGfXXL4w",
      thumbnail: "https://img.youtube.com/vi/wXcBGfXXL4w/maxresdefault.jpg",
      duration: 230,
    },
    {
      id: "Kr8XAnR80XA",
      title: "Video 28",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/Kr8XAnR80XA",
      thumbnail: "https://img.youtube.com/vi/Kr8XAnR80XA/maxresdefault.jpg",
      duration: 200,
    },
    {
      id: "qYbhqbOEaY8",
      title: "Video 29",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/qYbhqbOEaY8",
      thumbnail: "https://img.youtube.com/vi/qYbhqbOEaY8/maxresdefault.jpg",
      duration: 270,
    },
    {
      id: "EbXSbP-wEFU",
      title: "Video 30",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/EbXSbP-wEFU",
      thumbnail: "https://img.youtube.com/vi/EbXSbP-wEFU/maxresdefault.jpg",
      duration: 190,
    },
    {
      id: "50A9wjJ40Dk",
      title: "Video 31",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/50A9wjJ40Dk",
      thumbnail: "https://img.youtube.com/vi/50A9wjJ40Dk/maxresdefault.jpg",
      duration: 240,
    },
    {
      id: "O6rHeD5x2tI",
      title: "Video 32",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/O6rHeD5x2tI",
      thumbnail: "https://img.youtube.com/vi/O6rHeD5x2tI/maxresdefault.jpg",
      duration: 250,
    },
    {
      id: "vDGrfhJH1P4",
      title: "Video 33",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/vDGrfhJH1P4",
      thumbnail: "https://img.youtube.com/vi/vDGrfhJH1P4/maxresdefault.jpg",
      duration: 220,
    },
    {
      id: "fLonJKaTQqM",
      title: "Video 34",
      description: "YouTube Video",
      url: "https://www.youtube.com/embed/fLonJKaTQqM",
      thumbnail: "https://img.youtube.com/vi/fLonJKaTQqM/maxresdefault.jpg",
      duration: 280,
    },
  ];

  try {
    for (const video of sampleVideos) {
      const reward = getVideoReward();
      await executeQuery(
        `INSERT INTO videos (id, title, description, url, thumbnail, reward_min, reward_max, duration)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          video.id,
          video.title,
          video.description,
          video.url,
          video.thumbnail,
          reward.min,
          reward.max,
          video.duration,
        ],
      );
    }
    console.log("Videos seeded successfully");
  } catch (err) {
    console.error("Error seeding videos:", err);
  }
}
