import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const TOKEN_LIST = [
  '0xb2f82D0f38dc453D596Ad40A37799446Cc89274A',
  '0xE0590015A873bF326bd645c3E1266d4db41C4E6B',
  '0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50',
  '0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714',
  '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
  '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
  '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37',
  '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d'
];

const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)'
];

function SwapTab() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);

  const [tokenFrom, setTokenFrom] = useState(TOKEN_LIST[0]);
  const [tokenTo, setTokenTo] = useState(TOKEN_LIST[1]);

  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');

  const [balances, setBalances] = useState({});
  const [symbols, setSymbols] = useState({});
  const [decimalsMap, setDecimalsMap] = useState({});

  const [loadingQuote, setLoadingQuote] = useState(false);
  const [swapInProgress, setSwapInProgress] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(ethProvider);

      ethProvider.send('eth_requestAccounts', [])
        .then(accounts => {
          setAccount(accounts[0]);
          setSigner(ethProvider.getSigner());
        })
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (!provider || !account) return;

    async function fetchTokensData() {
      const newBalances = {};
      const newSymbols = {};
      const newDecimals = {};

      for (const tokenAddress of TOKEN_LIST) {
        try {
          const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

          const symbol = await tokenContract.symbol();
          const decimals = await tokenContract.decimals();
          const rawBalance = await tokenContract.balanceOf(account);

          const formattedBalance = Number(ethers.utils.formatUnits(rawBalance, decimals));
          newBalances[tokenAddress] = formattedBalance;
          newSymbols[tokenAddress] = symbol;
          newDecimals[tokenAddress] = decimals;
        } catch {
          newBalances[tokenAddress] = 0;
          newSymbols[tokenAddress] = 'N/A';
          newDecimals[tokenAddress] = 18;
        }
      }

      setBalances(newBalances);
      setSymbols(newSymbols);
      setDecimalsMap(newDecimals);
    }

    fetchTokensData();
  }, [provider, account]);

  useEffect(() => {
    if (!amountFrom || isNaN(amountFrom) || Number(amountFrom) <= 0) {
      setAmountTo('');
      return;
    }

    async function getQuote() {
      if (!tokenFrom || !tokenTo) {
        setAmountTo('');
        return;
      }

      setLoadingQuote(true);

      try {
        const sellDecimals = decimalsMap[tokenFrom] ?? 18;
        const sellAmount = ethers.utils.parseUnits(amountFrom, sellDecimals).toString();

        const apiKey = process.env.NEXT_PUBLIC_ZEROX_API_KEY || '';

        const url = `https://api.0x.org/swap/v1/quote?buyToken=${tokenTo}&sellToken=${tokenFrom}&sellAmount=${sellAmount}`;

        const res = await fetch(url, {
          headers: {
            '0x-api-key': apiKey
          }
        });

        if (!res.ok) {
          setAmountTo('');
          setLoadingQuote(false);
          return;
        }

        const data = await res.json();
        const buyDecimals = decimalsMap[tokenTo] ?? 18;

        const buyAmount = ethers.utils.formatUnits(data.buyAmount, buyDecimals);
        setAmountTo(buyAmount);
      } catch {
        setAmountTo('');
      } finally {
        setLoadingQuote(false);
      }
    }

    getQuote();
  }, [amountFrom, tokenFrom, tokenTo, decimalsMap]);

  function switchTokens() {
    setTokenFrom(tokenTo);
    setTokenTo(tokenFrom);
    setAmountFrom('');
    setAmountTo('');
  }

  async function executeSwap() {
    if (!signer) return;
    if (!amountFrom || Number(amountFrom) <= 0) return;

    setSwapInProgress(true);

    try {
      const sellDecimals = decimalsMap[tokenFrom] ?? 18;
      const sellAmount = ethers.utils.parseUnits(amountFrom, sellDecimals).toString();

      const apiKey = process.env.NEXT_PUBLIC_ZEROX_API_KEY || '';

      const url = `https://api.0x.org/swap/v1/quote?buyToken=${tokenTo}&sellToken=${tokenFrom}&sellAmount=${sellAmount}`;

      const res = await fetch(url, {
        headers: {
          '0x-api-key': apiKey
        }
      });

      if (!res.ok) {
        alert('Failed to fetch swap quote');
        setSwapInProgress(false);
        return;
      }

      const quote = await res.json();

      const tx = await signer.sendTransaction({
        to: quote.to,
        data: quote.data,
        value: ethers.BigNumber.from(quote.value || '0'),
        gasPrice: ethers.BigNumber.from(quote.gasPrice || '0'),
        gasLimit: ethers.BigNumber.from(quote.gas || '0'),
      });

      await tx.wait();
      alert('Swap completed successfully');
    } catch (error) {
      alert(`Swap failed: ${error.message}`);
    } finally {
      setSwapInProgress(false);
    }
  }

  return (
    <div className="swap-tab-container">
      <h2>Token Swap</h2>

      <div className="swap-row">
        <label htmlFor="tokenFrom">From</label>
        <select
          id="tokenFrom"
          value={tokenFrom}
          onChange={(e) => setTokenFrom(e.target.value)}
        >
          {TOKEN_LIST.map((addr) => (
            <option key={addr} value={addr}>
              {symbols[addr] || addr} - Balance: {balances[addr] !== undefined ? balances[addr].toFixed(4) : '0'}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Amount"
          value={amountFrom}
          min="0"
          onChange={(e) => setAmountFrom(e.target.value)}
        />
      </div>

      <button
        className="switch-button"
        onClick={switchTokens}
        aria-label="Switch tokens"
      >
        &#8646;
      </button>

      <div className="swap-row">
        <label htmlFor="tokenTo">To</label>
        <select
          id="tokenTo"
          value={tokenTo}
          onChange={(e) => setTokenTo(e.target.value)}
        >
          {TOKEN_LIST.map((addr) => (
            <option key={addr} value={addr}>
              {symbols[addr] || addr} - Balance: {balances[addr] !== undefined ? balances[addr].toFixed(4) : '0'}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder={loadingQuote ? 'Loading...' : 'Estimated Amount'}
          value={amountTo}
          readOnly
          disabled
        />
      </div>

      <button
        className="swap-submit-button"
        onClick={executeSwap}
        disabled={swapInProgress || loadingQuote || !account}
      >
        {swapInProgress ? 'Swapping...' : 'Swap'}
      </button>
    </div>
  );
}

export default SwapTab;
