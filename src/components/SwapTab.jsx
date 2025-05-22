import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

const tokenAddresses = [
  'native', // for MON
  '0xb2f82D0f38dc453D596Ad40A37799446Cc89274A',
  '0xE0590015A873bF326bd645c3E1266d4db41C4E6B',
  '0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50',
  '0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714',
  '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
  '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
  '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37',
  '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d'
];

const erc20Abi = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
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

  useEffect(() => {
    const connect = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x278F' }]
          });
        } catch (e) {
          console.error('Chain switch failed:', e);
        }

        const web3Provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
        const signer = web3Provider.getSigner();
        const address = await signer.getAddress();

        setProvider(web3Provider);
        setSigner(signer);
        setAccount(address);
      }
    };

    connect();
  }, []);

  useEffect(() => {
    const fetchTokenData = async () => {
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
            const contract = new ethers.Contract(addr, erc20Abi, provider);
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
          data[addr] = { symbol: '???', decimals: 18, balance: '0.0' };
        }
      }));
      setTokenData(data);
    };

    if (provider && account) fetchTokenData();
  }, [provider, account]);

  useEffect(() => {
    const getQuote = async () => {
      if (!amount || !fromToken || !toToken || !tokenData[fromToken]) return;
      setEstimatedAmount('Loading...');
      try {
        const decimals = tokenData[fromToken].decimals;
        const amountIn = ethers.utils.parseUnits(amount, decimals).toString();
        const res = await fetch(`https://swap-api-snowy.vercel.app/api/quote?fromToken=${fromToken}&toToken=${toToken}&amount=${amountIn}`);
        const json = await res.json();
        if (json?.estimatedAmountOut) {
          const outDecimals = tokenData[toToken]?.decimals || 18;
          const formatted = ethers.utils.formatUnits(json.estimatedAmountOut, outDecimals);
          setEstimatedAmount(formatted);
        } else {
          setEstimatedAmount('Error');
        }
      } catch (e) {
        console.error('Quote error:', e);
        setEstimatedAmount('Error');
      }
    };

    getQuote();
  }, [amount, fromToken, toToken, tokenData]);

  const handleSwap = async () => {
    if (!signer || !fromToken || !toToken || !amount || !tokenData[fromToken]) return;
    setLoading(true);
    try {
      const decimals = tokenData[fromToken].decimals;
      const amountIn = ethers.utils.parseUnits(amount, decimals).toString();
      const res = await fetch('https://swap-api-snowy.vercel.app/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken,
          toToken,
          amount: amountIn,
          address: account
        })
      });

      const data = await res.json();
      if (!data || !data.tx) throw new Error('Invalid TX data');

      const tx = await signer.sendTransaction(data.tx);
      await tx.wait();
      alert('Swap successful');
    } catch (err) {
      console.error('Swap error:', err);
      alert('Swap failed');
    }
    setLoading(false);
  };

  const switchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setEstimatedAmount('');
  };

  return (
    <div className="swap-tab">
      <h2>Token Swap</h2>

      <div className="swap-field">
        <select value={fromToken} onChange={e => setFromToken(e.target.value)}>
          {tokenAddresses.map(addr => (
            <option key={addr} value={addr}>
              {tokenData[addr]?.symbol || '...'} - {parseFloat(tokenData[addr]?.balance || 0).toFixed(4)}
            </option>
          ))}
        </select>
        <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>

      <div className="swap-switch">
        <button onClick={switchTokens}>⇅</button>
      </div>

      <div className="swap-field">
        <select value={toToken} onChange={e => setToToken(e.target.value)}>
          {tokenAddresses.map(addr => (
            <option key={addr} value={addr}>
              {tokenData[addr]?.symbol || '...'} - {parseFloat(tokenData[addr]?.balance || 0).toFixed(4)}
            </option>
          ))}
        </select>
        <input type="text" readOnly value={estimatedAmount ? `≈ ${estimatedAmount}` : ''} />
      </div>

      <button className="swap-button" onClick={handleSwap} disabled={loading}>
        {loading ? 'Swapping...' : 'Swap'}
      </button>
    </div>
  );
};

export default SwapTab;
