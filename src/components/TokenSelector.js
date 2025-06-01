import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20_ABI from "../abis/ERC20.json";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const TokenSelector = ({ selectedToken, onSelectToken, tokenAddresses, balances }) => {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const fetchTokenSymbols = async () => {
      if (!window.ethereum || !tokenAddresses?.length) return;

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const tokenList = [];

        for (const address of tokenAddresses) {
          if (address === ZERO_ADDRESS) {
            tokenList.push({ address, symbol: "MON" });
          } else {
            try {
              const contract = new ethers.Contract(address, ERC20_ABI, provider);
              const symbol = await contract.symbol();
              tokenList.push({ address, symbol });
            } catch (error) {
              console.warn(`Failed to fetch symbol for token: ${address}`);
              tokenList.push({ address, symbol: "UNKNOWN" });
            }
          }
        }

        setTokens(tokenList);
      } catch (err) {
        console.error("Provider error:", err);
      }
    };

    fetchTokenSymbols();
  }, [tokenAddresses]);

  return (
    <select
      value={selectedToken}
      onChange={(e) => onSelectToken(e.target.value)}
      className="token-select"
    >
      <option value="">Select Token</option>
      {tokens.map(({ address, symbol }) => {
        const balance = balances?.[address] || "0";
        const formatted = Number(balance).toFixed(4);
        return (
          <option key={address} value={address}>
            {symbol} - {formatted}
          </option>
        );
      })}
    </select>
  );
};

export default TokenSelector;
