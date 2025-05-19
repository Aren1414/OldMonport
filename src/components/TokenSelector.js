import React, { useEffect, useState } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import ERC20_ABI from "../abis/ERC20.json";

const TokenSelector = ({ selectedToken, onSelectToken, tokenAddresses, balances }) => {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const fetchTokenData = async () => {
      const provider = new BrowserProvider(window.ethereum);
      const tokenList = [];

      for (const address of tokenAddresses) {
        if (address === ethers.ZeroAddress) {
          tokenList.push({ address, symbol: "MON" }); // Native token
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
    <div style={{ marginBottom: "16px" }}>
      <select
        value={selectedToken}
        onChange={(e) => onSelectToken(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          fontSize: "15px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          backgroundColor: "#f9f9f9",
        }}
      >
        <option value="">Select Token</option>
        {tokens.map((token) => (
          <option key={token.address} value={token.address}>
            {token.symbol} — {balances?.[token.address] ? parseFloat(balances[token.address]).toFixed(4) : "0.0000"}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TokenSelector;
