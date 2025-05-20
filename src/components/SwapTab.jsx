import React, { useEffect, useState } from "react";
import { ethers, Contract } from "ethers";
import TokenSelector from "./TokenSelector";
import ERC20_ABI from "../abis/ERC20.json";

const MONAD_RPC = "https://rpc.testnet.monad.xyz";
const ZERO_ADDRESS = ethers.ZeroAddress;

const tokenAddresses = [
  "0xb2f82D0f38dc453D596Ad40A37799446Cc89274A",
  "0xE0590015A873bF326bd645c3E1266d4db41C4E6B",
  "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50",
  "0x0F0BDEbF0F83cD1EE3974779bcb7315f9808c714",
  "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
  "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
  "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",
  "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d"
];

const SwapTab = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [balances, setBalances] = useState({});
  const [fromToken, setFromToken] = useState("");
  const [toToken, setToToken] = useState("");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);

  useEffect(() => {
    if (!window.ethereum) return;
    const ethProvider = new ethers.BrowserProvider(window.ethereum);
    setProvider(ethProvider);
    ethProvider.getSigner().then(setSigner);
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install a wallet");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethProvider);
      setSigner(await ethProvider.getSigner());
      await switchToMonadNetwork();
      fetchBalances(accounts[0]);
    } catch (e) {
      alert("Wallet connection failed");
    }
  };

  const switchToMonadNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x506" }]
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x506",
              chainName: "Monad Testnet",
              nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
              rpcUrls: [MONAD_RPC],
              blockExplorerUrls: ["https://testnet.monadscan.io"]
            }]
          });
        } catch (addError) {
          console.error("Add network error:", addError);
        }
      }
    }
  };

  const fetchBalances = async (userAddress) => {
    if (!provider) return;
    const newBalances = {};
    for (const address of tokenAddresses) {
      if (address === ZERO_ADDRESS) {
        const bal = await provider.getBalance(userAddress);
        newBalances[ZERO_ADDRESS] = Number(ethers.formatEther(bal));
      } else {
        try {
          const contract = new Contract(address, ERC20_ABI, provider);
          const bal = await contract.balanceOf(userAddress);
          newBalances[address] = Number(ethers.formatUnits(bal, 18));
        } catch {
          newBalances[address] = 0;
        }
      }
    }
    setBalances(newBalances);
  };

  useEffect(() => {
    const calculateSwap = async () => {
      if (!fromToken || !toToken || !fromAmount || isNaN(fromAmount) || Number(fromAmount) <= 0) {
        setToAmount("");
        return;
      }
      if (!account) return;

      try {
        const fromTokenAddress = fromToken === ZERO_ADDRESS ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : fromToken;
        const toTokenAddress = toToken === ZERO_ADDRESS ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : toToken;

        const url = `https://api.0x.org/swap/v1/price?sellToken=${fromTokenAddress}&buyToken=${toTokenAddress}&sellAmount=${ethers.parseUnits(fromAmount, 18).toString()}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data && data.buyAmount) {
          setToAmount(ethers.formatUnits(data.buyAmount, 18));
        } else {
          setToAmount("");
        }
      } catch {
        setToAmount("");
      }
    };

    calculateSwap();
  }, [fromToken, toToken, fromAmount, account]);

  const executeSwap = async () => {
    if (!signer) return alert("Connect wallet first");
    if (!fromToken || !toToken || !fromAmount) return alert("Fill all fields");

    setIsSwapping(true);

    try {
      const fromTokenAddress = fromToken === ZERO_ADDRESS ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : fromToken;
      const toTokenAddress = toToken === ZERO_ADDRESS ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : toToken;

      const url = `https://api.0x.org/swap/v1/quote?sellToken=${fromTokenAddress}&buyToken=${toTokenAddress}&sellAmount=${ethers.parseUnits(fromAmount, 18).toString()}&takerAddress=${account}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data || !data.to || !data.data) {
        alert("Swap quote error");
        setIsSwapping(false);
        return;
      }

      const tx = {
        to: data.to,
        data: data.data,
        value: data.value ? ethers.parseEther(data.value) : undefined,
        gasPrice: data.gasPrice ? ethers.parseUnits(data.gasPrice, "gwei") : undefined
      };

      const txResponse = await signer.sendTransaction(tx);
      await txResponse.wait();

      alert("Swap successful");
      fetchBalances(account);
      setFromAmount("");
      setToAmount("");
    } catch (error) {
      alert("Swap failed: " + error.message);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="swap-tab">
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <>
          <div>
            <label>From:</label>
            <TokenSelector
              selectedToken={fromToken}
              onSelectToken={setFromToken}
              tokenAddresses={tokenAddresses}
              balances={balances}
            />
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="Amount"
            />
          </div>

          <div>
            <label>To:</label>
            <TokenSelector
              selectedToken={toToken}
              onSelectToken={setToToken}
              tokenAddresses={tokenAddresses}
              balances={balances}
            />
            <input type="text" value={toAmount} readOnly placeholder="Estimated amount" />
          </div>

          <button onClick={executeSwap} disabled={isSwapping || !fromAmount || !toAmount}>
            {isSwapping ? "Swapping..." : "Swap"}
          </button>
        </>
      )}
    </div>
  );
};

export default SwapTab;
