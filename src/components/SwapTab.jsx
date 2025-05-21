import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const TOKEN_ADDRESSES = [
  '0xYourMonadTokenAddressHere',   // Replace with actual Monad token address
  '0xb2f82D0f38dc453D596Ad40A37799446Cc89274A',
  '0xE0590015A873bF326bd645c3E1266d4db41C4E6B',
  '0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50',
  '0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714',
  '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
  '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
  '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37',
  '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d'
];

// ERC20 ABI minimal for symbol, decimals, balanceOf
const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)'
];

export default function SwapTab() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);

  const [tokensData, setTokensData] = useState({}); // { address: {symbol, decimals, balance} }

  const [tokenFrom, setTokenFrom] = useState('');
  const [tokenTo, setTokenTo] = useState('');
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');

  const [loadingQuote, setLoadingQuote] = useState(false);
  const [swapInProgress, setSwapInProgress] = useState(false);
  const [error, setError] = useState('');

  // Initialize provider, signer and account on mount
  useEffect(() => {
    if (!window.ethereum) {
      setError('No Ethereum wallet found');
      return;
    }
    const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(ethProvider);

    ethProvider.send('eth_requestAccounts', [])
      .then(accounts => {
        setAccount(accounts[0]);
        setSigner(ethProvider.getSigner());
      })
      .catch(() => setError('Wallet connection rejected'));
  }, []);

  // Fetch symbols, decimals, balances for all tokens
  useEffect(() => {
    if (!provider || !account) return;

    async function fetchAllTokenData() {
      const data = {};
      for (const addr of TOKEN_ADDRESSES) {
        try {
          const tokenContract = new ethers.Contract(addr, ERC20_ABI, provider);
          const [symbol, decimals, balanceRaw] = await Promise.all([
            tokenContract.symbol(),
            tokenContract.decimals(),
            tokenContract.balanceOf(account)
          ]);
          const balance = Number(ethers.utils.formatUnits(balanceRaw, decimals));
          data[addr] = { symbol, decimals, balance };
        } catch {
          // On failure, fallback to defaults
          data[addr] = { symbol: 'UNKNOWN', decimals: 18, balance: 0 };
        }
      }
      setTokensData(data);

      // Initialize tokens selection if empty
      if (!tokenFrom) setTokenFrom(TOKEN_ADDRESSES[0]);
      if (!tokenTo) setTokenTo(TOKEN_ADDRESSES[1] || TOKEN_ADDRESSES[0]);
    }

    fetchAllTokenData();
  }, [provider, account]);

  // Filter token lists to prevent same token in both fields
  const tokensForFrom = TOKEN_ADDRESSES.filter(addr => addr !== tokenTo);
  const tokensForTo = TOKEN_ADDRESSES.filter(addr => addr !== tokenFrom);

  // When tokenFrom, tokenTo or amountFrom changes, fetch swap quote
  useEffect(() => {
    if (!amountFrom || Number(amountFrom) <= 0) {
      setAmountTo('');
      setError('');
      return;
    }
    if (!tokenFrom || !tokenTo) {
      setAmountTo('');
      setError('');
      return;
    }
    if (tokenFrom === tokenTo) {
      setAmountTo('');
      setError('From and To tokens cannot be the same');
      return;
    }
    if (!tokensData[tokenFrom] || !tokensData[tokenTo]) {
      setAmountTo('');
      setError('Token data not loaded');
      return;
    }

    async function fetchQuote() {
      setLoadingQuote(true);
      setError('');
      try {
        const sellDecimals = tokensData[tokenFrom].decimals;
        const sellAmount = ethers.utils.parseUnits(amountFrom, sellDecimals).toString();

        const url = `https://api.0x.org/swap/v1/quote?buyToken=${tokenTo}&sellToken=${tokenFrom}&sellAmount=${sellAmount}`;
        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setError(errData.reason || 'Failed to fetch swap quote');
          setAmountTo('');
          setLoadingQuote(false);
          return;
        }

        const data = await res.json();
        const buyDecimals = tokensData[tokenTo].decimals;
        const buyAmountFormatted = ethers.utils.formatUnits(data.buyAmount, buyDecimals);
        setAmountTo(buyAmountFormatted);
      } catch {
        setAmountTo('');
        setError('Failed to fetch swap quote');
      } finally {
        setLoadingQuote(false);
      }
    }

    fetchQuote();
  }, [amountFrom, tokenFrom, tokenTo, tokensData]);

  // Swap From and To tokens
  function swapTokenSelection() {
    setTokenFrom(tokenTo);
    setTokenTo(tokenFrom);
    setAmountFrom('');
    setAmountTo('');
    setError('');
  }

  // Perform the swap transaction
  async function handleSwap() {
    setError('');
    if (!signer) {
      setError('Wallet not connected');
      return;
    }
    if (!amountFrom || Number(amountFrom) <= 0) {
      setError('Invalid amount');
      return;
    }
    if (tokenFrom === tokenTo) {
      setError('From and To tokens cannot be the same');
      return;
    }
    if (!tokensData[tokenFrom] || !tokensData[tokenTo]) {
      setError('Token data not loaded');
      return;
    }

    setSwapInProgress(true);

    try {
      const sellDecimals = tokensData[tokenFrom].decimals;
      const sellAmount = ethers.utils.parseUnits(amountFrom, sellDecimals).toString();

      const url = `https://api.0x.org/swap/v1/quote?buyToken=${tokenTo}&sellToken=${tokenFrom}&sellAmount=${sellAmount}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.reason || 'Failed to fetch swap quote');
        setSwapInProgress(false);
        return;
      }

      const quote = await res.json();

      const tx = await signer.sendTransaction({
        to: quote.to,
        data: quote.data,
        value: ethers.BigNumber.from(quote.value || '0'),
        gasPrice: ethers.BigNumber.from(quote.gasPrice || '0'),
        gasLimit: ethers.BigNumber.from(quote.gas || '0')
      });

      await tx.wait();

      alert('Swap completed successfully');

      // Refresh balances after swap
      const updatedBalances = { ...tokensData };

      const tokenFromContract = new ethers.Contract(tokenFrom, ERC20_ABI, provider);
      const tokenToContract = new ethers.Contract(tokenTo, ERC20_ABI, provider);

      const [balanceFromRaw, balanceToRaw] = await Promise.all([
        tokenFromContract.balanceOf(account),
        tokenToContract.balanceOf(account)
      ]);

      updatedBalances[tokenFrom].balance = Number(ethers.utils.formatUnits(balanceFromRaw, tokensData[tokenFrom].decimals));
      updatedBalances[tokenTo].balance = Number(ethers.utils.formatUnits(balanceToRaw, tokensData[tokenTo].decimals));

      setTokensData(updatedBalances);

      setAmountFrom('');
      setAmountTo('');
      setError('');
    } catch (e) {
      setError('Swap failed: ' + (e.message || 'Unknown error'));
    } finally {
      setSwapInProgress(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 20 }}>
      <h2 style={{ textAlign: 'center' }}>Swap Tokens</h2>

      <div style={{ marginBottom: 20 }}>
        <label>From Token:</label>
        <select value={tokenFrom} onChange={e => setTokenFrom(e.target.value)}>
          {tokensForFrom.map(addr => (
            <option key={addr} value={addr}>
              {tokensData[addr]?.symbol || '...'} ({tokensData[addr]?.balance?.toFixed(4) || '0'})
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Amount"
          value={amountFrom}
          onChange={e => setAmountFrom(e.target.value)}
          style={{ width: '100%', marginTop: 5 }}
        />
      </div>

      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <button onClick={swapTokenSelection}>⇅</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>To Token:</label>
        <select value={tokenTo} onChange={e => setTokenTo(e.target.value)}>
          {tokensForTo.map(addr => (
            <option key={addr} value={addr}>
              {tokensData[addr]?.symbol || '...'} ({tokensData[addr]?.balance?.toFixed(4) || '0'})
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Estimated Amount"
          value={amountTo}
          disabled
          style={{ width: '100%', marginTop: 5, backgroundColor: '#f2f2f2' }}
        />
      </div>

      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

      <button
        onClick={handleSwap}
        disabled={swapInProgress || loadingQuote || !amountFrom}
        style={{ width: '100%', padding: 10, backgroundColor: '#4CAF50', color: 'white' }}
      >
        {swapInProgress ? 'Swapping...' : 'Swap'}
      </button>
    </div>
  );
}
