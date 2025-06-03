import React, { useState, useEffect, useCallback } from "react";
import { getLeaderboardData, getFarcasterProfile } from "../utils/farcaster";
import "../styles/App.css";

const LeaderboardTab = () => {
  const [userAddress, setUserAddress] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const connectWallet = useCallback(async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setUserAddress(accounts[0]);
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await getLeaderboardData();
      setLeaderboard(data);
    } catch (e) {
      console.error("Failed to load leaderboard", e);
    }
  }, []);

  const loadUserProfile = useCallback(async () => {
    if (!userAddress) return;
    const profile = await getFarcasterProfile(userAddress);
    setUserProfile(profile);
  }, [userAddress]);

  useEffect(() => {
    connectWallet();
  }, [connectWallet]);

  useEffect(() => {
    if (userAddress) {
      loadUserProfile();
      loadLeaderboard();
    }
  }, [userAddress, loadUserProfile, loadLeaderboard]);

  return (
    <div className="tab leaderboard-tab">
      <h2>Leaderboard</h2>

      {userProfile && (
        <div className="user-rank">
          <img src={userProfile.avatar} alt="avatar" className="avatar" />
          <h3>@{userProfile.username}</h3>
          <p>Points: {userProfile.points}</p>
        </div>
      )}

      <div className="leaderboard-list">
        {leaderboard.slice(0, 200).map((user, index) => (
          <div className="leaderboard-item" key={user.address}>
            <span className="rank">#{index + 1}</span>
            <img src={user.avatar} alt="avatar" className="avatar" />
            <span className="username">@{user.username}</span>
            <span className="points">{user.points} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardTab;
