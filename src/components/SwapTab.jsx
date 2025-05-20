import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { connectWallet } from "../utils/wallet";
import TokenSelector from "./TokenSelector";
import CrocSwap_ABI from "../abis/CrocSwapDex.json";
import ERC20_ABI from "../abis/ERC20.json";

const CROC_SWAP_ADDRESS = "0x88B96aF200c8a9c35442C8AC6cd3D22695AaE4F0";
const MON_ADDRESS = ethers.ZeroAddress;

const TOKEN_ADDRESSES = [
  MON_ADDRESS,
  "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea", // USDC
  "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37", // WETH
  "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D", // USDT
  "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d", // WBTC
  "0x836047a99e11F376522B447bffb6e3495Dd0637c", // ETH
  "0xA296f47E8Ff895Ed7A092b4a9498bb13C46ac768", // WWETH
];

const SwapTab = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [fromToken, setFromToken] = useState("");
  const [toToken, setToToken] = useState("");
  const [amount, setAmount] = useState("");
  const [estimated, setEstimated] = useState("-");
  const [balances, setBalances] = useState({});

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
          const contract = new ethers.Contract(addr, ERC20_ABI, provider);
          const balance = await contract.balanceOf(walletAddress);
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
      const parsedAmount = ethers.parseUnits(amount, 18);

      if (fromToken !== ethers.ZeroAddress) {
        const erc20 = new ethers.Contract(fromToken, ERC20_ABI, signer);
        const allowance = await erc20.allowance(walletAddress, CROC_SWAP_ADDRESS);
        if (allowance < parsedAmount) {
          const approveTx = await erc20.approve(CROC_SWAP_ADDRESS, parsedAmount);
          await approveTx.wait();
        }
      }

      const tx = await contract.swap(
        fromToken,
        toToken,
        36000, // pool index from CrocSwap for Monad
        true,  // isBuy
        true,  // inBaseQty
        parsedAmount,
        0,     // tip
        0,     // limitPrice
        0,     // minOut
        0      // reserveFlags
      );
      await tx.wait();
      alert("Swap successful!");
    } catch (err) {
      console.error("Swap failed:", err);
      alert("Swap failed. Check parameters or network.");
    }
  };

  const switchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmount("");
    setEstimated("-");
  };

  useEffect(() => {
    const init = async () => {
      const addr = await connectWallet();
      if (addr) {
        setWalletAddress(addr);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (walletAddress) fetchBalances();
  }, [walletAddress]);

  useEffect(() => {
    if (amount && fromToken && toToken) fetchEstimate();
  }, [amount, fromToken, toToken]);

  return (
    <div className="tab swap-tab">
      <h2>Token Swap</h2>

      <div className="swap-field">
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
          balances={balances}
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
