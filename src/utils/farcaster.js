const API_KEY = process.env.REACT_APP_NEYNAR_API_KEY;
const BASE_URL = "https://api.neynar.com/v2/farcaster";

export async function getUserProfile(fid) {
  try {
    const res = await fetch(`${BASE_URL}/user/bulk?fids=${fid}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });
    const data = await res.json();
    return data.users?.[0] || null;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return null;
  }
}

export async function getFarcasterProfile(fid) {
  try {
    const res = await fetch(`${BASE_URL}/user/bulk?fids=${fid}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });
    const data = await res.json();
    return data.users?.[0] || null;
  } catch (err) {
    console.error("Error fetching Farcaster profile:", err);
    return null;
  }
}

export async function followUser(targetFid, signerUuid) {
  try {
    const res = await fetch(`${BASE_URL}/follow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        signer_uuid: signerUuid,
        target_fid: targetFid,
      }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error following user:", err);
    return null;
  }
}

export async function castToWarpcast(message, signerUuid) {
  try {
    const res = await fetch(`${BASE_URL}/cast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        signer_uuid: signerUuid,
        text: message,
      }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error casting:", err);
    return null;
  }
}

export async function getLeaderboardData() {
  try {
    const res = await fetch(`${BASE_URL}/leaderboard`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error fetching leaderboard data:", err);
    return null;
  }
}
