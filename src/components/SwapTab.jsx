import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

const tokenAddresses = [
  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native token (Monad)
  '0xb2f82D0f38dc453D596Ad40A37799446Cc89274A',
  '0xE0590015A873bF326bd645c3E1266d4db41C4E6B',
  '0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50',
  '0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714',
  '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
  '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
  '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37',
  '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d'
];

const erc20ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const SwapTab = ({ provider, signer, account }) => {
  const [tokenList, setTokenList] = useState([]);
  const [fromToken, setFromToken] = useState('');
  const [toToken, setToToken] = useState('');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [balances, setBalances] = useState({});
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!provider || !account) return;

      const tokens = await Promise.all(
        tokenAddresses.map(async (address) => {
          if (address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
            const balance = await provider.getBalance(account);
            return {
              address,
              symbol: 'MONAD',
              decimals: 18,
              balance
            };
          } else {
            const contract = new ethers.Contract(address, erc20ABI, provider);
            try {
              const [symbol, decimals, balance] = await Promise.all([
                contract.symbol(),
                contract.decimals(),
                contract.balanceOf(account)
              ]);
              return {
                address,
                symbol,
                decimals,
                balance
              };
            } catch {
              return null;
            }
          }
        })
      );

      setTokenList(tokens.filter(Boolean));
      const balancesObj = {};
      tokens.forEach(token => {
        if(token) balancesObj[token.address] = token.balance;
      });
      setBalances(balancesObj);

      // Set defaults
      if(tokens.length > 1){
        setFromToken(tokens[0].address);
        setToToken(tokens[1].address);
      }
    };

    fetchTokens();
  }, [provider, account]);

  const handleGetQuote = async (amount, fromAddr, toAddr) => {
    if (!amount || !fromAddr || !toAddr) {
      setToAmount('');
      return;
    }
    setLoadingQuote(true);
    try {
      const formattedAmount = ethers.utils.parseUnits(amount, tokenList.find(t => t.address === fromAddr).decimals).toString();

      const url = `https://api.0x.org/swap/v1/quote?buyToken=${toAddr}&sellToken=${fromAddr}&sellAmount=${formattedAmount}`;

      const response = await fetch(url);
      if(!response.ok) {
        setToAmount('');
        setLoadingQuote(false);
        return;
      }
      const data = await response.json();

      // convert buyAmount to human readable
      const buyToken = tokenList.find(t => t.address.toLowerCase() === toAddr.toLowerCase());
      if(buyToken){
        const buyAmountReadable = ethers.utils.formatUnits(data.buyAmount, buyToken.decimals);
        setToAmount(buyAmountReadable);
      } else {
        setToAmount('');
      }
    } catch {
      setToAmount('');
    }
    setLoadingQuote(false);
  };

  const handleSwap = async () => {
    if(!signer) return;

    setSwapLoading(true);
    try {
      const fromTokenData = tokenList.find(t => t.address === fromToken);
      const toTokenData = tokenList.find(t => t.address === toToken);

      if(!fromTokenData || !toTokenData) {
        setSwapLoading(false);
        return;
      }

      const sellAmount = ethers.utils.parseUnits(fromAmount, fromTokenData.decimals);

      // 0x API Quote to get data for swap transaction
      const url = `https://api.0x.org/swap/v1/quote?buyToken=${toToken}&sellToken=${fromToken}&sellAmount=${sellAmount.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      // Approve token if not native MONAD
      if(fromToken.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'){
        const tokenContract = new ethers.Contract(fromToken, erc20ABI, signer);
        const allowance = await tokenContract.allowance(account, data.allowanceTarget);
        if(allowance.lt(sellAmount)) {
          const approveTx = await tokenContract.approve(data.allowanceTarget, sellAmount);
          await approveTx.wait();
        }
      }

      // Send swap transaction
      const tx = await signer.sendTransaction({
        to: data.to,
        data: data.data,
        value: data.value ? ethers.BigNumber.from(data.value) : ethers.BigNumber.from(0),
        gasPrice: data.gasPrice ? ethers.BigNumber.from(data.gasPrice) : undefined,
        gasLimit: ethers.BigNumber.from(500000)
      });

      await tx.wait();
      alert('Swap successful');
      setFromAmount('');
      setToAmount('');
      setSwapLoading(false);
    } catch (error) {
      console.error(error);
      alert('Swap failed: ' + (error.message || error));
      setSwapLoading(false);
    }
  };

  const handleFromAmountChange = (e) => {
    const val = e.target.value;
    setFromAmount(val);
    handleGetQuote(val, fromToken, toToken);
  };

  const handleFromTokenChange = (e) => {
    setFromToken(e.target.value);
    setFromAmount('');
    setToAmount('');
  };

  const handleToTokenChange = (e) => {
    setToToken(e.target.value);
    setFromAmount('');
    setToAmount('');
  };

  const handleSwitchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount('');
    setToAmount('');
  };

  return (
    <div className="swap-tab">
      <h2>Swap Tokens</h2>

      <div className="swap-field">
        <label>From Token</label>
        <select className="token-select" value={fromToken} onChange={handleFromTokenChange}>
          {tokenList.map(token => (
            <option key={token.address} value={token.address}>
              {token.symbol} (Balance: {ethers.utils.formatUnits(balances[token.address] || 0, token.decimals)})
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Amount to swap"
          value={fromAmount}
          onChange={handleFromAmountChange}
          min="0"
        />
      </div>

      <div className="swap-switch">
        <button onClick={handleSwitchTokens} title="Switch tokens">⇄</button>
      </div>

      <div className="swap-field">
        <label>To Token</label>
        <select className="token-select" value={toToken} onChange={handleToTokenChange}>
          {tokenList.map(token => (
            <option key={token.address} value={token.address}>
              {token.symbol} (Balance: {ethers.utils.formatUnits(balances[token.address] || 0, token.decimals)})
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Estimated amount"
          value={loadingQuote ? 'Loading...' : toAmount}
          readOnly
        />
      </div>

      <button
        className="swap-button"
        onClick={handleSwap}
        disabled={swapLoading || !fromAmount || fromToken === toToken}
      >
        {swapLoading ? 'Swapping...' : 'Swap'}
      </button>
    </div>
  );
};

export default SwapTab;
