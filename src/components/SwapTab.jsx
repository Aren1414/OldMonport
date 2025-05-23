import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { connectWallet } from "../utils/wallet";

const tokenAddresses = [
  "0x0000000000000000000000000000000000000000", // MON native
  "0x183b5Fe6B949cF62fc74BF3F563Aa3DB4E5cf16f",
  "0x64Fa8C701139673F27588Aa3D6A653DeBc58088b",
  "0x90ac7F3D489fF6eA2D2B70e5Cc8E9805cEddf4Cc",
  "0xCfD82A01349634B69aDc4c24356e8D5fF6A04E88",
  "0x7Ed8cD8d7E7bA21f11b51d7d682F9A1BaB2A2dA1",
  "0x8c3a7a1bB74f4cE2F8e4eD23eEa38F9386F9947c",
  "0x5298B5aDD41DE1E9638d0F1671cF9b5e7d3Ca0a1",
  "0x76A63d95f59DdcaF0f2B59E2ED92D7A76A529a95"
];

const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint)"
];

const SwapTab = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [fromToken, setFromToken] = useState(tokenAddresses[0]);
  const [toToken, setToToken] = useState(tokenAddresses[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [symbols, setSymbols] = useState({});
  const [balances, setBalances] = useState({});

  useEffect(() => {
    const initWallet = async () => {
      const address = await connectWallet();
      setWalletAddress(address);
    };
    initWallet();
  }, []);

  useEffect(() => {
    const fetchSymbolsAndBalances = async () => {
      if (!walletAddress || !window.ethereum) return;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const symbolMap = {};
      const balanceMap = {};

      for (const address of tokenAddresses) {
        if (address === "0x0000000000000000000000000000000000000000") {
          symbolMap[address] = "MON";
          const bal = await provider.getBalance(walletAddress);
          balanceMap[address] = ethers.utils.formatEther(bal);
        } else {
          const contract = new ethers.Contract(address, ERC20_ABI, provider);
          try {
            const symbol = await contract.symbol();
            const decimals = await contract.decimals();
            const rawBal = await contract.balanceOf(walletAddress);
            const bal = ethers.utils.formatUnits(rawBal, decimals);
            symbolMap[address] = symbol;
            balanceMap[address] = bal;
          } catch (err) {
            symbolMap[address] = "???";
            balanceMap[address] = "0";
          }
        }
      }

      setSymbols(symbolMap);
      setBalances(balanceMap);
    };

    fetchSymbolsAndBalances();
  }, [walletAddress]);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!fromAmount || !walletAddress) return;
      try {
        const sellAmount = ethers.utils.parseUnits(fromAmount, 18).toString();
        const url = `https://api.0x.org/swap/permit2/quote?chainId=10143&sellToken=${fromToken}&buyToken=${toToken}&sellAmount=${sellAmount}&taker=${walletAddress}`;
        const res = await fetch(url, {
          headers: {
            "0x-api-key": "ca1b360f-cde6-4073-9589-53438e781c22",
            "0x-version": "v2"
          }
        });
        const data = await res.json();
        const estimated = ethers.utils.formatUnits(data.buyAmount, 18);
        setToAmount(estimated);
      } catch (err) {
        console.error("Quote error:", err);
        setToAmount("");
      }
    };

    fetchQuote();
  }, [fromToken, toToken, fromAmount, walletAddress]);

  const handleSwap = async () => {
    if (!walletAddress || !fromAmount) return;
    try {
      const sellAmount = ethers.utils.parseUnits(fromAmount, 18).toString();
      const url = `https://api.0x.org/swap/permit2/quote?chainId=10143&sellToken=${fromToken}&buyToken=${toToken}&sellAmount=${sellAmount}&taker=${walletAddress}`;
      const res = await fetch(url, {
        headers: {
          "0x-api-key": "ca1b360f-cde6-4073-9589-53438e781c22",
          "0x-version": "v2"
        }
      });
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
    } catch (err) {
      console.error("Swap error:", err);
      alert("Swap failed");
    }
  };

  return (
    <div className="swap-tab">
      <h2>Token Swap</h2>

      <div>
        <label>From:</label>
        <select value={fromToken} onChange={(e) => setFromToken(e.target.value)}>
          {tokenAddresses.map((token, i) => (
            <option key={i} value={token}>
              {symbols[token] || token}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Amount"
          value={fromAmount}
          onChange={(e) => setFromAmount(e.target.value)}
        />
        <div>Balance: {balances[fromToken] || "0"}</div>
      </div>

      <div>
        <label>To:</label>
        <select value={toToken} onChange={(e) => setToToken(e.target.value)}>
          {tokenAddresses.map((token, i) => (
            <option key={i} value={token}>
              {symbols[token] || token}
            </option>
          ))}
        </select>
        <input type="text" placeholder="Estimated" value={toAmount} readOnly />
        <div>Balance: {balances[toToken] || "0"}</div>
      </div>

      <button onClick={handleSwap}>Swap</button>
    </div>
  );
};

export default SwapTab;
