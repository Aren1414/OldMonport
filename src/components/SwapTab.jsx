import { useEffect, useState } from "react";
import { Contract, formatUnits, parseUnits, BrowserProvider } from "ethers";
import erc20Abi from "../abis/ERC20.json";
import { abi as routerAbi } from "../abis/Router.json";
import TokenSelector from "./TokenSelector";
import { connectWallet, switchToMonadNetwork } from "../utils/wallet";

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
const queryAddress = "0x1C74Dd2DF010657510715244DA10ba19D1F3D2B7";

export default function SwapTab() {
  const [wallet, setWallet] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = "";
  const [loading, setLoading] = useState(false);

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
          return null;
        }
      })
    );

    const filteredTokens = loadedTokens.filter(Boolean);
    setTokens(filteredTokens);

    setFromToken(filteredTokens[0] || null);
    setToToken(filteredTokens[1] || null);
  }

  async function getTokenBalance(token) {
    if (!wallet || !walletAddress || !token) return "0";

    const provider = new BrowserProvider(wallet);

    if (token.address === MONAD_NATIVE_TOKEN.address) {
      const balance = await provider.getBalance(walletAddress);
      return formatUnits(balance, 18);
    }

    const contract = new Contract(token.address, erc20Abi, wallet);
    const balance = await contract.balanceOf(walletAddress);
    return formatUnits(balance, token.decimals);
  }

  async function estimateSwapOutAmount() {
    if (!fromToken || !toToken || !fromAmount || !wallet) {
      setToAmount("");
      return;
    }
    try {
      const queryContract = new Contract(
        queryAddress,
        ["function findOptimalSwap(uint256 amountIn, address tokenIn, address tokenOut) view returns (uint256 amountOut)"],
        wallet
      );
      const amountInRaw = parseUnits(fromAmount, fromToken.decimals);
      const out = await queryContract.findOptimalSwap(amountInRaw, fromToken.address, toToken.address);
      setToAmount(formatUnits(out, toToken.decimals));
    } catch (err) {
      setToAmount("0");
    }
  }

  async function performSwap() {
    if (!wallet || !fromToken || !toToken || !fromAmount) return;
    try {
      setLoading(true);

      const amountInRaw = parseUnits(fromAmount, fromToken.decimals);
      const router = new Contract(routerAddress, routerAbi, wallet);

      if (fromToken.address !== MONAD_NATIVE_TOKEN.address) {
        const tokenContract = new Contract(fromToken.address, erc20Abi, wallet);
        const allowance = await tokenContract.allowance(walletAddress, routerAddress);
        if (allowance.lt(amountInRaw)) {
          const txApprove = await tokenContract.approve(routerAddress, amountInRaw);
          await txApprove.wait();
        }
      }

      const txSwap = await router.swap(fromToken.address, toToken.address, amountInRaw, walletAddress);
      await txSwap.wait();

      setFromAmount("");
      setToAmount("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    estimateSwapOutAmount();
  }, [fromAmount, fromToken, toToken]);

  return (
    <div className="p-4">
      <TokenSelector
        label="From"
        tokens={tokens}
        selected={fromToken}
        onChange={setFromToken}
        amount={fromAmount}
        onAmountChange={setFromAmount}
        wallet={wallet}
      />

      <div className="text-center my-2">⇅</div>

      <TokenSelector
        label="To"
        tokens={tokens}
        selected={toToken}
        onChange={setToToken}
        amount={toAmount}
        disabled
        wallet={wallet}
      />

      <button
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded"
        onClick={performSwap}
        disabled={loading}
      >
        {loading ? "Swapping..." : "Swap"}
      </button>
    </div>
  );
}
