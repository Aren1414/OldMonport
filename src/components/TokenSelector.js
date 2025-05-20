import React, { useEffect, useState } from "react";
import { ethers, Contract } from "ethers";
import ERC20_ABI from "../abis/ERC20.json";

const TokenSelector = ({ selectedToken, onSelectToken, tokenAddresses, balances }) => {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const fetchTokenData = async () => {
      if (!window.ethereum) return;
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const tokenList = [];

      for (const address of tokenAddresses) {
        if (address === ethers.constants.AddressZero) {
          tokenList.push({ address, symbol: "MON" });
        } else {
          try {
            const contract = new Contract(address, ERC20_ABI, provider);
            const symbol = await contract.symbol();
            tokenList.push({ address, symbol });
          } catch {
            tokenList.push({ address, symbol: "UNKNOWN" });
          }
        }
      }
      setTokens(tokenList);
    };

    fetchTokenData();
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
          {symbol} — {balances?.[address] ? parseFloat(balances[address]).toFixed(4) : "0.0000"}
        </option>
      ))}
    </select>
  );
};

export default TokenSelector;
