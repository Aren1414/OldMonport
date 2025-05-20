const MONAD_CHAIN_ID = "0x279f"; // 10143
const MONAD_PARAMS = {
  chainId: MONAD_CHAIN_ID,
  chainName: "Monad Testnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: ["https://testnet-rpc.monad.xyz/"],
  blockExplorerUrls: ["https://testnet.monadexplorer.com/"],
};

export const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install a wallet like MetaMask");
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const currentChainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    if (currentChainId !== MONAD_CHAIN_ID) {
      await switchToMonadNetwork();
    }

    return accounts[0];
  } catch (err) {
    console.error("Wallet connection error:", err);
    return null;
  }
};

export const switchToMonadNetwork = async () => {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: MONAD_CHAIN_ID }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [MONAD_PARAMS],
        });
      } catch (addError) {
        console.error("Failed to add Monad network:", addError);
      }
    } else {
      console.error("Switch network error:", switchError);
    }
  }
};

export const getWalletAddress = async () => {
  if (!window.ethereum) return null;
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  return accounts[0] || null;
};
