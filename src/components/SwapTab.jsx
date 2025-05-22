import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { connectWallet } from "../utils/wallet";

const tokenList = [
  {
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native token (MON)
    isNative: true
  },
  {
    address: "0x64AbC6A7A2f3A8a79F2443cB50dB33d0f4624034",
    isNative: false
  },
  {
    address: "0x5bF94d60710c3f8dF124F2aE2E3dA82E41d6fB5b",
    isNative: false
  },
  {
    address: "0xE08988547e1FdeCd1C3bdf8f0aC73Ebf0Bd3c36A",
    isNative: false
  }
];

const erc20Abi = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint)",
  "function approve(address, uint256) returns (bool)",
  "function allowance(address, address) view returns (uint256)"
];

const SwapTab = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const [fromToken, setFromToken] = useState(tokenList[0].address);
  const [toToken, setToToken] = useState(tokenList[1].address);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");

  const [tokenData, setTokenData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (fromAmount && tokenData[fromToken] && tokenData[toToken]) {
      fetchQuote();
    }
  }, [fromAmount, fromToken, toToken]);

  const init = async () => {
    const addr = await connectWallet();
    if (!addr) return;

    const prov = new ethers.providers.Web3Provider(window.ethereum);
    const sign = prov.getSigner();
    setProvider(prov);
    setSigner(sign);
    setAccount(addr);

    const data = {};
    for (const t of tokenList) {
      if (t.isNative) {
        const balance = await prov.getBalance(addr);
        data[t.address] = {
          symbol: "MON",
          decimals: 18,
          balance: ethers.utils.formatEther(balance)
        };
      } else {
        const contract = new ethers.Contract(t.address, erc20Abi, prov);
        const [symbol, decimals, rawBalance] = await Promise.all([
          contract.symbol(),
          contract.decimals(),
          contract.balanceOf(addr)
        ]);
        data[t.address] = {
          symbol,
          decimals,
          balance: ethers.utils.formatUnits(rawBalance, decimals)
        };
      }
    }

    setTokenData(data);
  };

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const sellToken = fromToken;
      const buyToken = toToken;
      const decimals = tokenData[sellToken].decimals;
      const sellAmount = ethers.utils.parseUnits(fromAmount, decimals).toString();

      const url = `https://api.0x.org/swap/v2/quote?sellToken=${sellToken}&buyToken=${buyToken}&sellAmount=${sellAmount}`;
      const res = await fetch(url);
      const result = await res.json();

      if (result?.buyAmount) {
        const buyDecimals = tokenData[buyToken].decimals;
        setToAmount(ethers.utils.formatUnits(result.buyAmount, buyDecimals));
      } else {
        setToAmount("");
      }
    } catch (e) {
      console.error(e);
      setToAmount("");
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!signer || !fromAmount || !fromToken || !toToken) return;

    const decimals = tokenData[fromToken].decimals;
    const sellAmount = ethers.utils.parseUnits(fromAmount, decimals).toString();

    const url = `https://api.0x.org/swap/v2/quote?sellToken=${fromToken}&buyToken=${toToken}&sellAmount=${sellAmount}&takerAddress=${account}`;
    const res = await fetch(url);
    const quote = await res.json();

    if (quote?.to && quote?.data && quote?.value) {
      if (fromToken !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        const contract = new ethers.Contract(fromToken, erc20Abi, signer);
        const allowance = await contract.allowance(account, quote.to);
        if (allowance.lt(sellAmount)) {
          const tx = await contract.approve(quote.to, sellAmount);
          await tx.wait();
        }
      }

      const txParams = {
        to: quote.to,
        data: quote.data,
        value: ethers.BigNumber.from(quote.value || "0")
      };

      const tx = await signer.sendTransaction(txParams);
      await tx.wait();
      await init();
      setFromAmount("");
      setToAmount("");
    }
  };

  const handleSwapDirection = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setToAmount("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Swap</h2>

      <div>
        <label>From</label>
        <select value={fromToken} onChange={(e) => setFromToken(e.target.value)}>
          {tokenList.map((t) => (
            <option key={t.address} value={t.address}>
              {tokenData[t.address]?.symbol || "Loading..."} - Balance: {tokenData[t.address]?.balance || "0"}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Amount"
          value={fromAmount}
          onChange={(e) => setFromAmount(e.target.value)}
        />
      </div>

      <button onClick={handleSwapDirection}>⇅</button>

      <div>
        <label>To</label>
        <select value={toToken} onChange={(e) => setToToken(e.target.value)}>
          {tokenList.map((t) => (
            <option key={t.address} value={t.address}>
              {tokenData[t.address]?.symbol || "Loading..."} - Balance: {tokenData[t.address]?.balance || "0"}
            </option>
          ))}
        </select>
        <input type="text" readOnly value={loading ? "Loading..." : toAmount} />
      </div>

      <button onClick={executeSwap} disabled={!fromAmount || loading}>
        Swap
      </button>
    </div>
  );
};

export default SwapTab;
