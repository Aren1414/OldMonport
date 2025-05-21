import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { connectWallet, getWalletAddress } from "../wallet";
import TokenSelector from "./TokenSelector";
import ERC20_ABI from "../abis/ERC20.json";

const tokenAddresses = [
  "0x0000000000000000000000000000000000000000", // MON
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
  const [wallet, setWallet] = useState(null);
  const [fromToken, setFromToken] = useState("");
  const [toToken, setToToken] = useState("");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [balances, setBalances] = useState({});
  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [swapping, setSwapping] = useState(false);

  useEffect(() => {
    const connect = async () => {
      const address = await connectWallet();
      if (address) {
        setWallet(address);
        await loadBalances(address);
      }
    };
    connect();
  }, []);

  useEffect(() => {
    if (fromAmount && fromToken && toToken && fromToken !== toToken) {
      fetchQuote();
    } else {
      setToAmount("");
    }
  }, [fromAmount, fromToken, toToken]);

  const loadBalances = async (user) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balancesObj = {};

    for (const address of tokenAddresses) {
      try {
        if (address === "0x0000000000000000000000000000000000000000") {
          const balance = await provider.getBalance(user);
          balancesObj[address] = ethers.utils.formatEther(balance);
        } else {
          const contract = new ethers.Contract(address, ERC20_ABI, provider);
          const balance = await contract.balanceOf(user);
          const decimals = await contract.decimals();
          balancesObj[address] = ethers.utils.formatUnits(balance, decimals);
        }
      } catch (err) {
        balancesObj[address] = "0";
      }
    }

    setBalances(balancesObj);
  };

  const fetchQuote = async () => {
    setFetchingQuote(true);
    try {
      const amountIn = ethers.utils.parseUnits(fromAmount, 18).toString();
      const url = `https://testnet.api.0x.org/swap/v2/quote?buyToken=${toToken}&sellToken=${fromToken}&sellAmount=${amountIn}`;
      const response = await fetch(url);
      const data = await response.json();
      const estimated = ethers.utils.formatUnits(data.buyAmount, 18);
      setToAmount(estimated);
    } catch (err) {
      console.error("Error fetching quote:", err);
      setToAmount("0");
    } finally {
      setFetchingQuote(false);
    }
  };

  const executeSwap = async () => {
    if (!wallet || !fromToken || !toToken || !fromAmount || fromToken === toToken) return;
    setSwapping(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const amountIn = ethers.utils.parseUnits(fromAmount, 18).toString();

      const url = `https://testnet.api.0x.org/swap/v2/quote?buyToken=${toToken}&sellToken=${fromToken}&sellAmount=${amountIn}&takerAddress=${wallet}`;
      const res = await fetch(url);
      const data = await res.json();

      if (fromToken !== "0x0000000000000000000000000000000000000000") {
        const tokenContract = new ethers.Contract(fromToken, ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(wallet, data.allowanceTarget);
        if (allowance.lt(amountIn)) {
          const approveTx = await tokenContract.approve(data.allowanceTarget, amountIn);
          await approveTx.wait();
        }
      }

      const tx = await signer.sendTransaction({
        to: data.to,
        data: data.data,
        value: data.value || "0",
        gasLimit: data.gas || 500000
      });
      await tx.wait();
      alert("Swap successful!");
      await loadBalances(wallet);
    } catch (err) {
      console.error("Swap error:", err);
      alert("Swap failed. See console for details.");
    } finally {
      setSwapping(false);
    }
  };

  return (
    <div className="swap-container">
      <h2>Token Swap</h2>

      <label>From:</label>
      <TokenSelector
        selectedToken={fromToken}
        onSelectToken={setFromToken}
        tokenAddresses={tokenAddresses}
        balances={balances}
      />
      <input
        type="number"
        placeholder="Amount"
        value={fromAmount}
        onChange={(e) => setFromAmount(e.target.value)}
      />

      <label>To:</label>
      <TokenSelector
        selectedToken={toToken}
        onSelectToken={setToToken}
        tokenAddresses={tokenAddresses}
        balances={balances}
      />
      <input type="text" placeholder="Estimated" value={toAmount} disabled />

      <button onClick={executeSwap} disabled={swapping || fetchingQuote || !wallet}>
        {swapping ? "Swapping..." : "Swap"}
      </button>
    </div>
  );
};

export default SwapTab;
