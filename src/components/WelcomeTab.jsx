import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import welcomeAbi from "../abis/WelcomeNFT.json";
import "../styles/App.css";

const WELCOME_CONTRACT_ADDRESS = "0x40649af9dEE8bDB94Dc21BA2175AE8f5181f14AE";
const NFT_PRICE = 0.3; // in MON
const VIDEO_URL = "https://zxmqva22v53mlvaeypxc7nyw7ucxf5dat53l2ngf2umq6kiftn3a.arweave.net/zdkKg1qvdsXUBMPuL7cW_QVy9GCfdr00xdUZDykFm3Y";

const WelcomeTab = () => {
  const [selectedAmount, setSelectedAmount] = useState(1);
  const [walletAddress, setWalletAddress] = useState("");

  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
    }
  };

  const mintNFT = async () => {
    if (!walletAddress) return alert("Connect wallet first.");
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(WELCOME_CONTRACT_ADDRESS, welcomeAbi, signer);
      const value = ethers.utils.parseUnits((NFT_PRICE * selectedAmount).toString(), 18);
      const tx = await contract.mint(selectedAmount, { value });
      await tx.wait();
      alert("Mint successful!");
    } catch (error) {
      console.error(error);
      alert("Mint failed.");
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  return (
    <div className="tab welcome-tab">
      <h2>Welcome to MonPort</h2>
      <p>Mint your commemorative NFT celebrating Monad & Farcaster</p>

      <video width="100%" controls autoPlay loop muted style={{ borderRadius: "12px" }}>
        <source src={VIDEO_URL} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="mint-options">
        {[1, 5, 10].map((amt) => (
          <button key={amt} onClick={() => setSelectedAmount(amt)} className={selectedAmount === amt ? "active" : ""}>
            {amt}
          </button>
        ))}
      </div>

      <button className="mint-btn" onClick={mintNFT}>Mint ({selectedAmount} NFT)</button>
      <button className="share-btn">Share to Warpcast</button>
      <button className="follow-btn">Follow @overo.eth +200 points</button>

      <div className="points-info">
        <h4>Earn Points:</h4>
        <ul>
          <li>+50 points for each Welcome NFT mint</li>
          <li>+200 points for following @overo.eth</li>
          <li>+30 points per successful referral (first-time mint only)</li>
        </ul>
      </div>
    </div>
  );
};

export default WelcomeTab;
