import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { connectWallet, getWalletAddress, switchToMonadNetwork } from "../utils/wallet";
import TokenSelector from "../components/TokenSelector";

const tokenAddresses = [
  'native', // MON token
  '0xb2f82D0f38dc453D596Ad40A37799446Cc89274A',
  '0xE0590015A873bF326bd645c3E1266d4db41C4E6B',
  '0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50',
  '0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714',
  '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
  '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
  '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37',
  '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d'
];

const SwapTab = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [fromToken, setFromToken] = useState(tokenAddresses[0]);
  const [toToken, setToToken] = useState(tokenAddresses[1]);
  const [amount, setAmount] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [tokenData, setTokenData] = useState({});
  const [loading, setLoading] = useState(false);
  const apiKey = 'ca1b360f-cde6-4073-9589-53438e781c22';

  useEffect(() => {
    const initWallet = async () => {
      await switchToMonadNetwork();
      const address = await connectWallet();
      if (address) setAccount(address);

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      setProvider(web3Provider);
      setSigner(web3Provider.getSigner());
    };

    initWallet();
  }, []);

  useEffect(() => {
    const fetchTokenData = async () => {
      if (!provider || !account) return;
      const data = {};

      await Promise.all(tokenAddresses.map(async (addr) => {
        try {
          if (addr === 'native') {
            const balance = await provider.getBalance(account);
            data[addr] = {
              symbol: 'MON',
              decimals: 18,
              balance: ethers.utils.formatEther(balance)
            };
          } else {
            const contract = new ethers.Contract(addr, ["function symbol() view returns (string)", "function decimals() view returns (uint8)", "function balanceOf(address) view returns (uint256)"], provider);
            const [symbol, decimals, balance] = await Promise.all([
              contract.symbol(),
              contract.decimals(),
              contract.balanceOf(account)
            ]);
            data[addr] = {
              symbol,
              decimals,
              balance: ethers.utils.formatUnits(balance, decimals)
            };
          }
        } catch (e) {
          console.error('Error loading token:', addr, e);
          data[addr] = { symbol: 'UNKNOWN', decimals: 18, balance: '0.0' };
        }
      }));
      setTokenData(data);
    };

    fetchTokenData();
  }, [provider, account]);

  const getSwapQuote = async () => {
    if (!amount || !fromToken || !toToken || !tokenData[fromToken]) return;
    setEstimatedAmount('Loading...');
    try {
      const decimals = tokenData[fromToken].decimals;
      const amountIn = ethers.utils.parseUnits(amount, decimals).toString();
      const url = `https://api.0x.org/swap/v1/quote?chainId=10143&sellToken=${fromToken}&buyToken=${toToken}&sellAmount=${amountIn}&takerAddress=${account}`;

      const response = await fetch(url, {
        headers: {
          '0x-api-key': apiKey,
          '0x-version': 'v2'
        }
      });

      const json = await response.json();
      if (json?.estimatedAmountOut) {
        const outDecimals = tokenData[toToken]?.decimals || 18;
        setEstimatedAmount(ethers.utils.formatUnits(json.estimatedAmountOut, outDecimals));
      } else {
        setEstimatedAmount('Error');
      }
    } catch (e) {
      console.error('Quote error:', e);
      setEstimatedAmount('Error');
    }
  };

  const handleSwap = async () => {
    if (!signer || !fromToken || !toToken || !amount || !tokenData[fromToken]) return;
    setLoading(true);
    try {
      const quote = await getSwapQuote();
      if (!quote || !quote.tx) throw new Error('Invalid TX data');

      console.log("Transaction Quote:", quote.tx); // Debugging transaction data

      const tx = await signer.sendTransaction(quote.tx);
      await tx.wait();
      alert('Swap successful');
    } catch (err) {
      console.error('Swap error:', err);
      alert('Swap failed');
    }
    setLoading(false);
  };

  return (
    <div className="swap-tab">
      <h2>Token Swap</h2>

      <TokenSelector selectedToken={fromToken} onSelectToken={setFromToken} tokenAddresses={tokenAddresses} balances={tokenData} />
      <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />

      <TokenSelector selectedToken={toToken} onSelectToken={setToToken} tokenAddresses={tokenAddresses} balances={tokenData} />
      <input type="text" readOnly value={estimatedAmount ? `≈ ${estimatedAmount}` : ''} />

      <button className="swap-button" onClick={handleSwap} disabled={loading}>
        {loading ? 'Swapping...' : 'Swap'}
      </button>
    </div>
  );
};

export default SwapTab;
