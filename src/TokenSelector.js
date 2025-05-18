import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20_ABI from "../abis/ERC20.json";

const TokenSelector = ({ selectedToken, onSelectToken, tokenAddresses }) => {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const fetchSymbols = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const tokenList = [];

      for (const address of tokenAddresses) {
        try {
          const contract = new ethers.Contract(address, ERC20_ABI, provider);
          const symbol = await contract.symbol();
          tokenList.push({ address, symbol });
        } catch {
          tokenList.push({ address, symbol: "UNKNOWN" });
        }
      }

      setTokens(tokenList);
    };

    fetchSymbols();
  }, [tokenAddresses]);

  return (
    <select
      value={selectedToken}
      onChange={(e) => onSelectToken(e.target.value)}
      style={{ padding: "10px", fontSize: "16px" }}
    >
      <option value="">Select Token</option>
      {tokens.map((token) => (
        <option key={token.address} value={token.address}>
          {token.symbol}
        </option>
      ))}
    </select>
  );
};

export default TokenSelector;
