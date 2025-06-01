import React, { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import { getFarcasterProfile } from "../utils/farcaster";
import "../styles/App.css";

const ProfileTab = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("0");
  const [referrals, setReferrals] = useState(0);
  const [points, setPoints] = useState(0);
  const [userData, setUserData] = useState(null);

  const connectWallet = useCallback(async () => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum); //
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(accounts[0] || "");
      } catch (err) {
        console.error("Failed to connect wallet:", err);
      }
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const balanceRaw = await provider.getBalance(walletAddress);
      setBalance(formatEther(balanceRaw)); //
    } catch (e) {
      console.error("Balance fetch error:", e);
    }
  }, [walletAddress]);

  const fetchUserData = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const profile = await getFarcasterProfile(walletAddress);
      setUserData(profile || null);
      setReferrals(profile?.referrals || 0);
      setPoints(profile?.points || 0);
    } catch (e) {
      console.error("Error fetching Farcaster profile:", e);
    }
  }, [walletAddress]);

  useEffect(() => {
    connectWallet();
  }, [connectWallet]);

  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
      fetchUserData();
    }
  }, [walletAddress, fetchBalance, fetchUserData]);

  return (
    <div className="tab profile-tab">
      <h2>Your Profile</h2>
      {userData ? (
        <div className="farcaster-info">
          <img src={userData.avatar || "/default-avatar.png"} alt="avatar" className="avatar" />
          <h3>@{userData.username}</h3>
        </div>
      ) : (
        <p>No profile data available.</p>
      )}
      <p><strong>Wallet:</strong> {walletAddress}</p>
      <p><strong>Balance:</strong> {balance} MON</p>
      <p><strong>Referrals:</strong> {referrals}</p>
      <p><strong>Total Points:</strong> {points}</p>
    </div>
  );
};

export default ProfileTab;
