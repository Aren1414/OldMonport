import { useEffect, useState } from "react";
import { Contract, formatUnits, parseUnits, BrowserProvider } from "ethers";
import erc20Abi from "../abis/ERC20.json";
import routerAbi from "../abis/Router.json";
import TokenSelector from "./TokenSelector";
import { connectWallet, switchToMonadTestnet } from "../utils/wallet"; 
import "../styles/App.css";  
import { getSpotPrice, swapTokens } from "../../../sdk";

const MONAD_TESTNET_TOKEN = {
  address: "0x0000000000000000000000000000000000000000",
  symbol: "MON",  
  decimals: 18,
};

const testnetTokenAddresses = [
  MONAD_TESTNET_TOKEN.address,
  "0xb2f82D0f38dc453D596Ad40A37799446Cc89274A", 
  "0xE0590015A873bF326bd645c3E1266d4db41C4E6B",
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

  useEffect(() => {
    init();
  }, []);

  async function init() {
    await switchToMonadTestnet(); // 
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
      testnetTokenAddresses.map(async (addr) => {
        if (addr === MONAD_TESTNET_TOKEN.address) return MONAD_TESTNET_TOKEN;
        try {
          const contract = new Contract(addr, erc20Abi, signer);
          const symbol = await contract.symbol();
          const decimals = await contract.decimals();
          return { address: addr, symbol, decimals };
        } catch (e) {
          console.error(`Error loading token ${addr}:`, e);
          return { address: addr, symbol: "UNKNOWN", decimals: 18 };
        }
      })
    );

    setTokens(loadedTokens.filter(Boolean));

    const balanceData = {};
    for (const token of loadedTokens.filter(Boolean)) {
      balanceData[token.address] = await getTokenBalance(token);
    }

    setBalances(balanceData);
    setFromToken(loadedTokens[0] || null);
    setToToken(loadedTokens[1] || null);
  }

  async function getTokenBalance(token) {
    if (!wallet || !walletAddress || !token) return "0";

    const provider = new BrowserProvider(window.ethereum);

    if (token.address === MONAD_TESTNET_TOKEN.address) {
      const balance = await provider.getBalance(walletAddress);
      return formatUnits(balance, 18);
    }

    const contract = new Contract(token.address, erc20Abi, wallet);
    const balance = await contract.balanceOf(walletAddress);
    return formatUnits(balance, token.decimals);
  }

  // 
  async function fetchSpotPrice() {
    if (!fromToken || !toToken) return;
    const price = await getSpotPrice(fromToken.symbol, toToken.symbol);
    console.log("Spot Price:", price);
    setToAmount(price * parseFloat(fromAmount));
  }

  // 
  async function handleSwap() {
    if (!wallet || !fromToken || !toToken || !fromAmount) return;
    
    setLoading(true);
    try {
      const result = await swapTokens(wallet, fromToken.address, toToken.address, parseUnits(fromAmount, fromToken.decimals));
      console.log("Swap Result:", result);
    } catch (error) {
      console.error("Swap failed:", error);
    }
    setLoading(false);
  }

  return (
    <div className="swap-tab">
      <h2>Swap Tokens on Monad Testnet</h2>

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
        <input 
          type="number" 
          placeholder="Enter amount" 
          value={fromAmount} 
          onChange={(e) => setFromAmount(e.target.value)} 
          className="amount-input"
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
          wallet={wallet}
          balances={balances}
        />
        <input 
          type="text" 
          placeholder="Estimated output" 
          value={toAmount} 
          disabled 
          className="amount-display"
        />
      </div>

      <button className="swap-button" onClick={fetchSpotPrice}>
        Get Spot Price
      </button>

      <button className="swap-button" onClick={handleSwap} disabled={loading}>
        {loading ? "Swapping..." : "Swap"}
      </button>
    </div>
  );
}
