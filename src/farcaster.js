const WARPCAST_API_KEY = process.env.REACT_APP_WARPCAST_API_KEY;

export async function getFarcasterProfile(address) {
  try {
    const res = await fetch(`https://api.warpcast.com/v2/user-by-verification?address=${address}`, {
      headers: {
        Authorization: `Bearer ${WARPCAST_API_KEY}`,
      },
    });

    if (!res.ok) throw new Error("API Error");
    const data = await res.json();

    return {
      username: data.result.user.username,
      avatar: data.result.user.pfp_url,
      points: data.result.user.points || 0,
      referrals: data.result.user.referrals || 0,
    };
  } catch (err) {
    console.error("Farcaster profile error:", err);
    return {
      username: "Unknown",
      avatar: "https://placehold.co/40x40",
      points: 0,
      referrals: 0,
    };
  }
}

export async function getLeaderboardData() {
  try {
    const res = await fetch("https://your-api.com/leaderboard", {
      headers: {
        Authorization: `Bearer ${WARPCAST_API_KEY}`,
      },
    });

    if (!res.ok) throw new Error("Leaderboard fetch failed");
    const data = await res.json();
    return data.topUsers || [];
  } catch (err) {
    console.error("Leaderboard error:", err);
    return [];
  }
}
