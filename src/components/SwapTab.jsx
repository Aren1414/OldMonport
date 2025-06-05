import React, { useEffect, useState } from "react";
import { CrocSwapPlan } from "@crocswap-libs/sdk/dist/swap";
import { CrocPoolView } from "@crocswap-libs/sdk/dist/pool";
import { CrocTokenView } from "@crocswap-libs/sdk/dist/tokens";
import { CrocContext } from "@crocswap-libs/sdk/dist/context";
import { ERC20 } from "@crocswap-libs/sdk/dist/abis/erc20";
import { Query } from "@crocswap-libs/sdk/dist/abis/query";
import { Liquidity } from "@crocswap-libs/sdk/dist/encoding/liquidity";
import { PriceCalc } from "@crocswap-libs/sdk/dist/utils/price";
import { JsonRpcProvider } from "ethers"; 

const MONAD_RPC_URL = "https://testnet-rpc.monad.xyz/";
const TOKENS = [
  "0xb2f82D0f38dc453D596Ad40A37799446Cc89274A",
  "0xE0590015A873bF326bd645c3E1266d4db41C4E6B",
  "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50",
  "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714",
  "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
  "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
  "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",
  "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d",
];

const SwapTab = () => {
  const [swapPlan, setSwapPlan] = useState(null);
  const [poolView, setPoolView] = useState(null);
  const [context, setContext] = useState(null);
  const [selectedBaseToken, setSelectedBaseToken] = useState(TOKENS[0]);
  const [selectedQuoteToken, setSelectedQuoteToken] = useState(TOKENS[1]);
  const [amount, setAmount] = useState("1");
  const [slippage, setSlippage] = useState("0.5");
  const [priceImpact, setPriceImpact] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);

  useEffect(() => {
    const provider = new JsonRpcProvider(MONAD_RPC_URL); 
    const swapInstance = new CrocSwapPlan(provider);
    const poolInstance = new CrocPoolView();
    const ctxInstance = new CrocContext(provider);

    setSwapPlan(swapInstance);
    setPoolView(poolInstance);
    setContext(ctxInstance);
  }, []);

  const fetchTokenDetails = async () => {
    if (!context) return;
    const tokenData = await new ERC20(selectedBaseToken, context).getDetails();
    setTokenInfo(tokenData);
  };

  const calculateImpact = async () => {
    if (!poolView) return;
    const impact = await new Liquidity(poolView).calcImpact(selectedBaseToken, selectedQuoteToken, amount);
    setPriceImpact(impact.percentChange);
  };

  const swapTokens = async () => {
    if (!swapPlan) {
      console.error("SDK is not initialized.");
      return;
    }

    try {
      const swapResult = await swapPlan.swap({
        baseToken: selectedBaseToken,
        quoteToken: selectedQuoteToken,
        amount: amount,
        slippage: slippage,
      });

      console.log("Swap Completed:", swapResult);
    } catch (error) {
      console.error("Swap Failed:", error);
    }
  };

  return (
    <div>
      <h2>Swap Tokens on Monad Network</h2>

      <label>Base Token:</label>
      <select value={selectedBaseToken} onChange={(e) => setSelectedBaseToken(e.target.value)}>
        {TOKENS.map((token) => (
          <option key={token} value={token}>{token}</option>
        ))}
      </select>

      <label>Quote Token:</label>
      <select value={selectedQuoteToken} onChange={(e) => setSelectedQuoteToken(e.target.value)}>
        {TOKENS.map((token) => (
          <option key={token} value={token}>{token}</option>
        ))}
      </select>

      <label>Amount:</label>
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />

      <label>Slippage (%):</label>
      <input type="number" value={slippage} onChange={(e) => setSlippage(e.target.value)} />

      <button onClick={fetchTokenDetails}>Fetch Token Info</button>
      {tokenInfo && <p>Token Symbol: {tokenInfo.symbol}, Decimals: {tokenInfo.decimals}</p>}

      <button onClick={calculateImpact}>Calculate Impact</button>
      {priceImpact !== null && <p>Estimated Price Impact: {priceImpact}%</p>}

      {swapPlan ? (
        <button onClick={swapTokens}>Swap Now</button>
      ) : (
        <p>Loading SDK...</p>
      )}
    </div>
  );
};

export default SwapTab;
