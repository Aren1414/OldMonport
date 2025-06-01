import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { connectWallet } from "../utils/wallet";
import { getTokenSymbol, getTokenBalance } from "../utils/erc20";

const CHAIN_ID = "10143";
const API_BASE = "https://tourmaline-periwinkle-airmail.glitch.me/https://v2.api.0x.org/swap";

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
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [tokenSymbols, setTokenSymbols] = useState<{ [key: string]: string }>({});
  const [tokenBalances, setTokenBalances] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const address = await connectWallet();
        setWalletAddress(address);

        const symbols: { [key: string]: string } = {};
        const balances: { [key: string]: string } = {};

        for (const token of tokenList) {
          symbols[token] = await getTokenSymbol(token, address!);
          balances[token] = await getTokenBalance(token, address!);
        }

        setTokenSymbols(symbols);
        setTokenBalances(balances);
      } catch (err) {
        console.error(err);
        setError("Initialization failed");
      }
    };

    init();
  }, []);

  useEffect(() => {
    const fetchPrice = async () => {
      if (!fromAmount || !walletAddress) return;
      if (isNaN(Number(fromAmount)) || parseFloat(fromAmount) <= 0) {
        setError("Invalid amount");
        return;
      }

      const sellAmount = ethers.utils.parseUnits(fromAmount, 18).toString();
      const params = new URLSearchParams({
        chainId: CHAIN_ID,
        sellToken: fromToken,
        buyToken: toToken,
        sellAmount,
        takerAddress: walletAddress
      });

      try {
        const res = await fetch(`${API_BASE}/price?${params}`);
        const data = await res.json();
        setToAmount(ethers.utils.formatUnits(data.buyAmount, 18));
        setError(null);
      } catch (err) {
        console.error("Price fetch error:", err);
        setError("Price fetch failed");
        setToAmount("");
      }
   51
