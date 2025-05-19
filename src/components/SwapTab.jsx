import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CROC_SWAP_ADDRESS } from "../utils/contracts";
import CrocSwap_ABI from "../abis/CrocSwapDex.json";
import TokenSelector from "./TokenSelector";

const MON_ADDRESS = ethers.ZeroAddress;

const TOKEN_ADDRESSES = [
  MON_ADDRESS,
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
  const [balances, setBalances] = useState({});

  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
    }
  };

  const fetchBalances = async () => {
    if (!walletAddress) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const newBalances = {};
    for (let addr of TOKEN_ADDRESSES) {
      try {
        if (addr === ethers.ZeroAddress) {
          const balance = await provider.getBalance(walletAddress);
          newBalances[addr] = ethers.formatUnits(balance, 18);
        } else {
          const erc20 = new ethers.Contract(addr, [
            "function balanceOf(address) view returns (uint256)"
          ], provider);
          const balance = await erc20.balanceOf(walletAddress);
          newBalances[addr] = ethers.formatUnits(balance, 18);
        }
      } catch {
        newBalances[addr] = "0";
      }
    }
    setBalances(newBalances);
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

  const handleSwitch = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setEstimated("-");
  };

  useEffect(() => {
    connectWallet();
  }, []);

  useEffect(() => {
    if (walletAddress) fetchBalances();
  }, [walletAddress]);

  return (
    <div className="tab swap-tab" style={{
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
    }}>
      <h2 style={{ marginBottom: "20px", fontSize: "22px" }}>Swap Tokens</h2>

      <div style={{
        backgroundColor: "#f3f3f3",
        borderRadius: "12px",
        padding: "15px",
        marginBottom: "10px"
      }}>
        <TokenSelector
          selectedToken={fromToken}
          onSelectToken={setFromToken}
          tokenAddresses={TOKEN_ADDRESSES.filter(addr => addr !== toToken)}
          balances={balances}
        />
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "10px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "1px solid #ccc"
          }}
        />
      </div>

      <div style={{
        textAlign: "center",
        marginBottom: "10px"
      }}>
        <button onClick={handleSwitch} style={{
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "50%",
          padding: "8px",
          cursor: "pointer"
        }}>
          ⇅
        </button>
      </div>

      <div style={{
        backgroundColor: "#f3f3f3",
        borderRadius: "12px",
        padding: "15px",
        marginBottom: "10px"
      }}>
        <TokenSelector
          selectedToken={toToken}
          onSelectToken={setToToken}
          tokenAddresses={TOKEN_ADDRESSES.filter(addr => addr !== fromToken)}
          balances={balances}
        />
        <div style={{
          marginTop: "10px",
          fontSize: "16px",
          color: "#333"
        }}>
          ≈ {estimated} received
        </div>
      </div>

      <button
        onClick={executeSwap}
        disabled={!walletAddress}
        style={{
          backgroundColor: "#2266ee",
          color: "white",
          padding: "12px",
          borderRadius: "8px",
          fontWeight: "bold",
          width: "100%",
          fontSize: "16px",
          cursor: walletAddress ? "pointer" : "not-allowed",
          opacity: walletAddress ? 1 : 0.6
        }}
      >
        Swap
      </button>
    </div>
  );
};

export default SwapTab;
