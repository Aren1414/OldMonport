import React, { useEffect, useState } from "react";
import { ethers, Contract } from "ethers";
import ERC20_ABI from "../abis/ERC20.json";

const TokenSelector = ({ selectedToken, onSelectToken, tokenAddresses, balances }) => {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const list = [];

      for (const address of tokenAddresses) {
        if (address === ethers.ZeroAddress) {
          list.push({ address, symbol: "MON" });
        } else {
          try {
            const contract = new Contract(address, ERC20_ABI, provider);
            const symbol = await contract.symbol();
            list.push({ address, symbol });
          } catch {
            list.push({ address, symbol: "UNKNOWN" });
          }
        }
      }

      setTokens(list);
    };

    fetchTokens();
  }, [tokenAddresses]);

  return (
    <select
      value={selectedToken}
      onChange={(e) => onSelectToken(e.target.value)}
      className="token-select"
    >
      <option value="">Select Token</option>
      {tokens.map(({ address, symbol }) => (
        <option key={address} value={address}>
          {symbol} - {balances?.[address] ? Number(balances[address]).toFixed(4) : "0.0000"}
        </option>
      ))}
    </select>
  );
};

export default TokenSelector;
