import React from "react";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { connectWallet, getWalletAddress } from "../utils/wallet";
import { getTokenSymbol, getTokenBalance } from "../utils/erc20";

const tokenList = [
  "0x0000000000000000000000000000000000000000",
  "0xb2f82D0f38dc453D596Ad40A37799446Cc89274A",
  "0xE0590015A873bF326bd645c3E1266d4db41C4E6B",
  "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50",
  "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714",
  "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
  "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
  "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",
  "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d"
];

const SwapTab = () => {
  const [fromToken, setFromToken] = useState(tokenList[0]);
  const [toToken, setToToken] = useState(tokenList[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState(null);
  const [tokenSymbols, setTokenSymbols] = useState({});
  const [tokenBalances, setTokenBalances] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const address = await connectWallet();
        setWalletAddress(address);

        const symbols = {};
        const balances = {};

        for (const token of tokenList) {
          symbols[token] = await getTokenSymbol(token, address);
          balances[token] = await getTokenBalance(token, address);
        }

        setTokenSymbols(symbols);
        setTokenBalances(balances);
      } catch (err) {
        setError("Failed to initialize wallet and tokens");
        console.error("Initialization error:", err);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const fetchPrice = async () => {
      if (!fromAmount || !walletAddress) return;
      if (isNaN(fromAmount) || parseFloat(fromAmount) <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      const sellAmount = ethers.utils.parseUnits(fromAmount, 18).toString();
      const priceParams = new URLSearchParams({
        chainId: '10143',
        sellToken: fromToken,
        buyToken: toToken,
        sellAmount: sellAmount,
        takerAddress: walletAddress
      });

      try {
        const res = await fetch(`https://v2.api.0x.org/swap/price?${priceParams}`);
        const data = await res.json();
        const amountOut = ethers.utils.formatUnits(data.buyAmount, 18);
        setToAmount(amountOut);
        setError(null);
      } catch (err) {
        console.error("Price fetch error:", err);
        setError("Failed to fetch price");
        setToAmount("");
      }
    };

    fetchPrice();
  }, [fromToken, toToken, fromAmount, walletAddress]);

  const handleSwap = async () => {
    if (!walletAddress || !fromAmount) return;
    if (isNaN(fromAmount) || parseFloat(fromAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const sellAmount = ethers.utils.parseUnits(fromAmount, 18).toString();
    const quoteParams = new URLSearchParams({
      chainId: '10143',
      sellToken: fromToken,
      buyToken: toToken,
      sellAmount: sellAmount,
      takerAddress: walletAddress
    });

    try {
      const res = await fetch(`https://v2.api.0x.org/swap/quote?${quoteParams}`);
      const data = await res.json();

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const tx = await signer.sendTransaction({
        to: data.to,
        data: data.data,
        value: data.value ? ethers.BigNumber.from(data.value) : undefined
      });

      await tx.wait();
      alert("Swap successful");
      setError(null);
    } catch (err) {
      console.error("Swap error:", err);
      setError("Swap failed");
    }
  };

  return (
    <div className="swap-tab">
      <h2>Token Swap</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div>
        <label>From:</label>
        <select value={fromToken} onChange={(e) => setFromToken(e.target.value)}>
          {tokenList.map((token) => (
            <option key={token} value={token}>
              {tokenSymbols[token] || "Loading..."} ({tokenBalances[token] || "0"})
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Amount"
          value={fromAmount}
          onChange={(e) => setFromAmount(e.target.value)}
        />
      </div>

      <div>
        <label>To:</label>
        <select value={toToken} onChange={(e) => setToToken(e.target.value)}>
          {tokenList.map((token) => (
            <option key={token} value={token}>
              {tokenSymbols[token] || "Loading..."} ({tokenBalances[token] || "0"})
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Estimated amount"
          value={toAmount}
          readOnly
        />
      </div>

      <button onClick={handleSwap}>Swap</button>
    </div>
  );
};

export default SwapTab;
