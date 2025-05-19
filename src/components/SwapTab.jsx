import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CROC_SWAP_ADDRESS } from "../utils/contracts";
import CrocSwap_ABI from "../abis/CrocSwap.json";
import TokenSelector from "./TokenSelector";

const TOKEN_ADDRESSES = [
  "0xb2f82D0f38dc453D596Ad40A37799446Cc89274A",
  "0xE0590015A873bF326bd645c3E1266d4db41C4E6B",
  "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50",
  "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714",
  "0xaEef2f6B429Cb59C9B2D7bB2141ADa993E8571c3",
  "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
  "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
  "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",
  "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d"
];

const SwapTab = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [fromToken, setFromToken] = useState("");
  const [toToken, setToToken] = useState("");
  const [amount, setAmount] = useState("");
  const [estimated, setEstimated] = useState("-");

  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
    }
  };

  const fetchEstimate = async () => {
    if (!fromToken || !toToken || !amount) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CROC_SWAP_ADDRESS, CrocSwap_ABI, provider);
      const result = await contract.getQuote(fromToken, toToken, ethers.parseUnits(amount, 18));
      setEstimated(ethers.formatUnits(result, 18));
    } catch (err) {
      console.error("Estimate failed:", err);
      setEstimated("-");
    }
  };

  const executeSwap = async () => {
    if (!walletAddress || !fromToken || !toToken || !amount) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CROC_SWAP_ADDRESS, CrocSwap_ABI, signer);
      const tx = await contract.swap(fromToken, toToken, ethers.parseUnits(amount, 18));
      await tx.wait();
      alert("Swap successful!");
    } catch (err) {
      console.error("Swap failed:", err);
      alert("Swap failed.");
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  return (
    <div className="tab swap-tab">
      <h2>Swap Tokens</h2>

      <label>From Token</label>
      <TokenSelector
        selectedToken={fromToken}
        onSelectToken={setFromToken}
        tokenAddresses={TOKEN_ADDRESSES.filter(addr => addr !== toToken)}
      />

      <label>To Token</label>
      <TokenSelector
        selectedToken={toToken}
        onSelectToken={setToToken}
        tokenAddresses={TOKEN_ADDRESSES.filter(addr => addr !== fromToken)}
      />

      <input
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={fetchEstimate}>Estimate</button>
      <p>Estimated Output: {estimated}</p>

      <button onClick={executeSwap}>Execute Swap</button>
    </div>
  );
};

export default SwapTab;
