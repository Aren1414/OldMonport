import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import TokenSelector from "./TokenSelector";
import { connectWallet, getWalletAddress } from "../utils/wallet";

const API_BASE = "https://api.0x.org/swap/v1/quote";
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
  const [quoteData, setQuoteData] = useState(null);

  const handleConnect = async () => {
    const address = await connectWallet();
    if (address) setWalletAddress(address);
  };

  const fetchQuote = async () => {
    if (!fromToken || !toToken || !amount || !walletAddress) return;

    const sellToken = fromToken === ethers.ZeroAddress ? "ETH" : fromToken;
    const buyToken = toToken === ethers.ZeroAddress ? "ETH" : toToken;
    const sellAmount = ethers.parseUnits(amount, 18).toString();

    try {
      const res = await fetch(`${API_BASE}?sellToken=${sellToken}&buyToken=${buyToken}&sellAmount=${sellAmount}&takerAddress=${walletAddress}`, {
        headers: {
          "0x-api-key": process.env.NEXT_PUBLIC_ZEROX_API_KEY,
        },
      });

      const data = await res.json();
      if (data?.buyAmount) {
        setEstimated(ethers.formatUnits(data.buyAmount, 18));
        setQuoteData(data);
      } else {
        setEstimated("-");
        setQuoteData(null);
      }
    } catch (err) {
      console.error("Quote fetch failed:", err);
      setEstimated("-");
      setQuoteData(null);
    }
  };

  const executeSwap = async () => {
    if (!quoteData || !walletAddress) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction({
        to: quoteData.to,
        data: quoteData.data,
        value: quoteData.value || "0",
        gasLimit: quoteData.gas || 300000,
      });

      await tx.wait();
      alert("Swap successful!");
    } catch (err) {
      console.error("Swap failed:", err);
      alert("Swap failed. Check the console.");
    }
  };

  const switchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmount("");
    setEstimated("-");
    setQuoteData(null);
  };

  useEffect(() => {
    handleConnect();
  }, []);

  useEffect(() => {
    if (fromToken && toToken && amount) {
      fetchQuote();
    }
  }, [fromToken, toToken, amount, walletAddress]);

  return (
    <div className="tab swap-tab">
      <h2>Token Swap</h2>

      <div className="swap-field">
        <TokenSelector
          selectedToken={fromToken}
          onSelectToken={setFromToken}
          tokenAddresses={TOKEN_ADDRESSES.filter(addr => addr !== toToken)}
        />
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="swap-switch">
        <button onClick={switchTokens}>⇅</button>
      </div>

      <div className="swap-field">
        <TokenSelector
          selectedToken={toToken}
          onSelectToken={setToToken}
          tokenAddresses={TOKEN_ADDRESSES.filter(addr => addr !== fromToken)}
        />
        <input type="text" value={estimated} disabled />
      </div>

      <button onClick={executeSwap} className="swap-button">
        Swap
      </button>
    </div>
  );
};

export default SwapTab;
