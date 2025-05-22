import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

const tokenAddresses = [
  'ETH', // Native token
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

const API_BASE = 'https://swap-api-snowy.vercel.app/api';

const SwapTab = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [fromToken, setFromToken] = useState('ETH');
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
            params: [{ chainId: '0x80' }]
          });
        } catch (e) {}
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = web3Provider.getSigner();
        const addr = await signer.getAddress();
        setProvider(web3Provider);
        setSigner(signer);
        setAccount(addr);
      }
    };
    connect();
  }, []);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!provider || !account) return;
      const data = {};
      const calls = tokenAddresses.map(async (addr) => {
        if (addr === 'ETH') {
          const balance = await provider.getBalance(account);
          data[addr] = {
            symbol: 'ETH',
            decimals: 18,
            balance: ethers.utils.formatUnits(balance, 18)
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
      });
      await Promise.all(calls);
      setTokenData(data);
    };
    fetchTokens();
  }, [provider, account]);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount || !fromToken || !toToken) return;
      setEstimatedAmount('Loading...');
      try {
        const res = await fetch(`${API_BASE}/quote?fromToken=${fromToken}&toToken=${toToken}&amount=${amount}`);
        const data = await res.json();
        if (data?.estimatedAmountOut) {
          setEstimatedAmount(data.estimatedAmountOut);
        } else {
          setEstimatedAmount('Unavailable');
        }
      } catch (err) {
        setEstimatedAmount('Error');
      }
    };
    fetchQuote();
  }, [amount, fromToken, toToken]);

  const handleSwap = async () => {
    if (!signer || !amount || !fromToken || !toToken) return;
    setLoading(true);
    try {
      const body = {
        fromToken,
        toToken,
        amount,
        address: account
      };

      // If ERC20, approve first
      if (fromToken !== 'ETH') {
        const contract = new ethers.Contract(fromToken, erc20Abi, signer);
        const decimals = tokenData[fromToken].decimals || 18;
        const amt = ethers.utils.parseUnits(amount, decimals);
        const tx = await contract.approve("0x88B96aF200c8a9c35442C8AC6cd3D22695AaE4F0", amt);
        await tx.wait();
      }

      const res = await fetch(`${API_BASE}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!data || !data.tx) throw new Error('Invalid tx');

      const tx = await signer.sendTransaction(data.tx);
      await tx.wait();
      alert('Swap successful!');
    } catch (err) {
      console.error(err);
      alert('Swap failed');
    }
    setLoading(false);
  };

  const switchTokens = () => {
    const tmp = fromToken;
    setFromToken(toToken);
    setToToken(tmp);
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
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
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
