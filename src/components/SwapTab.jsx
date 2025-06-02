import { useEffect, useState } from "react";
import { Contract, formatUnits, parseUnits, BrowserProvider } from "ethers";
import erc20Abi from "../abis/ERC20.json";
import routerAbi from "../abis/Router.json";
import TokenSelector from "./TokenSelector";
import { connectWallet, switchToMonadNetwork } from "../utils/wallet";
import "../styles/App.css";  

const MONAD_NATIVE_TOKEN = {
  address: "0x0000000000000000000000000000000000000000",
  symbol: "MONAD",
  decimals: 18,
};

const tokenAddresses = [
  MONAD_NATIVE_TOKEN.address,
  "0xb2f82D0f38dc453D596Ad40A37799446Cc89274A",
  "0xE0590015A873bF326bd645c3E1266d4db41C4E6B",
  "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50",
  "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714",
  "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
  "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
  "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",
  "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d",
];

const routerAddress = "0x3108E20b0Da8b267DaA13f538964940C6eBaCCB2";

export default function SwapTab() {
  const [wallet, setWallet] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [balances, setBalances] = useState({});
  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [poolIdx, setPoolIdx] = useState(36000); 
  const [limitPrice, setLimitPrice] = useState(0); 
  const [minOut, setMinOut] = useState(0);         
  const [isBuy, setIsBuy] = useState(true);        

  useEffect(() => {
    init();
  }, []);

  async function init() {
    await switchToMonadNetwork();
    const signer = await connectWallet();
    if (!signer) return;

    setWallet(signer);
    try {
      const address = await signer.getAddress();
      setWalletAddress(address);
    } catch {
      setWalletAddress(null);
    }

    const loadedTokens = await Promise.all(
      tokenAddresses.map(async (addr) => {
        if (addr === MONAD_NATIVE_TOKEN.address) return MONAD_NATIVE_TOKEN;
        try {
          const contract = new Contract(addr, erc20Abi, signer);
          const symbol = await contract.symbol();
          const decimals = await contract.decimals();
          return { address: addr, symbol, decimals };
        } catch (e) {
          console.error(`Error loading token ${addr}:`, e);
          return null;
        }
      })
    );

    console.log("Fetched tokens:", loadedTokens);

    const filteredTokens = loadedTokens.filter(Boolean);
    setTokens(filteredTokens);

    const balanceData = {};
    for (const token of filteredTokens) {
      balanceData[token.address] = await getTokenBalance(token);
    }

    console.log("Balance Data:", balanceData);
    setBalances(balanceData);

    setFromToken(filteredTokens[0] || null);
    setToToken(filteredTokens[1] || null);
  }

  async function getTokenBalance(token) {
    if (!wallet || !walletAddress || !token) return "0";

    const provider = new BrowserProvider(window.ethereum);

    if (token.address === MONAD_NATIVE_TOKEN.address) {
      const balance = await provider.getBalance(walletAddress);
      return formatUnits(balance, 18);
    }

    const contract = new Contract(token.address, erc20Abi, wallet);
    const balance = await contract.balanceOf(walletAddress);
    console.log(`Balance of ${token.symbol}:`, formatUnits(balance, token.decimals));
    return formatUnits(balance, token.decimals);
  }

  async function performSwap() {
    if (!wallet || !fromToken || !toToken || !fromAmount) return;
    try {
      setLoading(true);

      const amountInRaw = parseUnits(fromAmount, fromToken.decimals);
      const router = new Contract(routerAddress, routerAbi, wallet);
      console.log("Attempting swap with:", { fromToken, toToken, amountInRaw, poolIdx, limitPrice, minOut, isBuy });

      if (fromToken.address !== MONAD_NATIVE_TOKEN.address) {
        const tokenContract = new Contract(fromToken.address, erc20Abi, wallet);
        const allowance = await tokenContract.allowance(walletAddress, routerAddress);
        console.log("Allowance:", allowance.toString());

        if (allowance.lt(amountInRaw)) {
          console.log("Approving tokens...");
          const txApprove = await tokenContract.approve(routerAddress, amountInRaw);
          await txApprove.wait();
        }
      }

      const txSwap = await router.swap(
        fromToken.address,
        toToken.address,
        poolIdx,
        isBuy,
        true,
        amountInRaw,
        0,
        limitPrice,
        minOut,
        0
      );

      await txSwap.wait();
      console.log("Swap transaction success:", txSwap);

      setFromAmount("");
      setToAmount("");
    } catch (err) {
      console.error("Swap error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="swap-tab">
      <h2>Swap Tokens</h2>
      <div className="swap-field">
        <TokenSelector
          label="From"
          tokens={tokens}
          selected={fromToken}
          onChange={setFromToken}
          amount={fromAmount}
          onAmountChange={setFromAmount}
          wallet={wallet}
          balances={balances}
        />
      </div>
      <div className="swap-switch">
        <button onClick={() => { setFromToken(toToken); setToToken(fromToken); }}>⇅</button>
      </div>
      <div className="swap-field">
        <TokenSelector
          label="To"
          tokens={tokens}
          selected={toToken}
          onChange={setToToken}
          amount={toAmount}
          disabled
          wallet={wallet}
          balances={balances}
        />
      </div>
      <button className="swap-button" onClick={performSwap} disabled={loading}>
        {loading ? "Swapping..." : "Swap"}
      </button>
    </div>
  );
}
