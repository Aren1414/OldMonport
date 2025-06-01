import React, { useEffect, useState } from "react";
import { Contract, BrowserProvider } from "ethers";
import ERC20_ABI from "../abis/ERC20.json";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const TokenSelector = ({ selectedToken, onSelectToken, tokenAddresses, balances, disabled }) => {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const fetchTokenData = async () => {
      if (!window.ethereum || !tokenAddresses?.length) return;

      try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();  //
        const tokenList = [];

        for (const address of tokenAddresses) {
          if (address === ZERO_ADDRESS) {
            tokenList.push({ address, symbol: "MONAD", decimals: 18 });
          } else {
            try {
              const contract = new Contract(address, ERC20_ABI, signer);  //
              const symbol = await contract.symbol();
              const decimals = await contract.decimals();
              tokenList.push({ address, symbol, decimals });
            } catch (error) {
              console.warn(`Failed to fetch symbol/decimals for token: ${address}`);
              tokenList.push({ address, symbol: "UNKNOWN", decimals: 18 });
            }
          }
        }

        setTokens(tokenList);
      } catch (err) {
        console.error("Provider error:", err);
      }
    };

    fetchTokenData();
  }, [tokenAddresses]);

  return (
    <select
      value={selectedToken || ""}
      onChange={(e) => onSelectToken(e.target.value)}
      disabled={disabled}
      className="token-select"
    >
      <option value="" disabled>
        Select Token
      </option>
      {tokens.map(({ address, symbol }) => {
        const balanceRaw = balances?.[address] || "0";
        const balance = Number(balanceRaw);
        const formatted = balance ? balance.toFixed(4) : "0.0000";

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
