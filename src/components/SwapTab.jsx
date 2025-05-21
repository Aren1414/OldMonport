import React, { useState, useEffect } from 'react'; import { ethers } from 'ethers'; import erc20ABI from './erc20ABI.json'; import { getWalletAddress, getProvider, switchToMonadTestnet } from './wallet';

const TOKEN_ADDRESSES = [ '0xb2f82D0f38dc453D596Ad40A37799446Cc89274A', '0xE0590015A873bF326bd645c3E1266d4db41C4E6B', '0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50', '0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714', '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701', '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea', '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37', '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d' ];

const NATIVE_TOKEN = { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'MONAD', decimals: 18 };

export default function SwapTab() { const [walletAddress, setWalletAddress] = useState(''); const [tokenList, setTokenList] = useState([]); const [fromToken, setFromToken] = useState(NATIVE_TOKEN.address); const [toToken, setToToken] = useState(''); const [fromAmount, setFromAmount] = useState(''); const [toAmount, setToAmount] = useState(''); const [balances, setBalances] = useState({});

useEffect(() => { async function init() { await switchToMonadTestnet(); const addr = await getWalletAddress(); setWalletAddress(addr); await loadTokenList(addr); } init(); }, []);

async function loadTokenList(user) { const provider = getProvider(); const list = [NATIVE_TOKEN]; for (let address of TOKEN_ADDRESSES) { const contract = new ethers.Contract(address, erc20ABI, provider); try { const symbol = await contract.symbol(); const decimals = await contract.decimals(); const balance = await contract.balanceOf(user); list.push({ address, symbol, decimals }); setBalances(prev => ({ ...prev, [address]: ethers.utils.formatUnits(balance, decimals) })); } catch (e) { console.error('Error loading token', address, e); } } const nativeBalance = await provider.getBalance(user); setBalances(prev => ({ ...prev, [NATIVE_TOKEN.address]: ethers.utils.formatEther(nativeBalance) })); setTokenList(list); }

function handleSwitchTokens() { const temp = fromToken; setFromToken(toToken); setToToken(temp); const tempAmount = fromAmount; setFromAmount(toAmount); setToAmount(tempAmount); }

return ( <div className="swap-tab"> <h2>Token Swap</h2>

<div className="swap-field">
    <select
      className="token-select"
      value={fromToken}
      onChange={e => setFromToken(e.target.value)}>
      {tokenList.map(token => (
        <option key={token.address} value={token.address}>
          {token.symbol} - {balances[token.address] || '0'}
        </option>
      ))}
    </select>
    <input
      type="number"
      placeholder="Enter amount"
      value={fromAmount}
      onChange={e => setFromAmount(e.target.value)}
    />
  </div>

  <div className="swap-switch">
    <button onClick={handleSwitchTokens}>⇅</button>
  </div>

  <div className="swap-field">
    <select
      className="token-select"
      value={toToken}
      onChange={e => setToToken(e.target.value)}>
      {tokenList.map(token => (
        <option key={token.address} value={token.address}>
          {token.symbol} - {balances[token.address] || '0'}
        </option>
      ))}
    </select>
    <input
      type="text"
      value={toAmount}
      placeholder="Estimated amount"
      disabled
    />
  </div>

  <button className="swap-button">Swap</button>
</div>

); }

