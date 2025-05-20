export const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install a wallet like MetaMask");
    return null;
  }

  const MONAD_PARAMS = {
    chainId: "0x278f", // 10143 in hex
    chainName: "Monad Testnet",
    nativeCurrency: {
      name: "Monad",
      symbol: "MON",
      decimals: 18,
    },
    rpcUrls: ["https://testnet-rpc.monad.xyz/"],
    blockExplorerUrls: ["https://testnet.monadexplorer.com/"],
  };

  try {
    // Check current chain
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });

    // If not Monad, try to switch
    if (currentChainId !== MONAD_PARAMS.chainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: MONAD_PARAMS.chainId }],
        });
      } catch (switchError) {
        // If the chain hasn't been added to MetaMask, add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [MONAD_PARAMS],
            });
          } catch (addError) {
            console.error("Failed to add Monad network:", addError);
            return null;
          }
        } else {
          console.error("Failed to switch network:", switchError);
          return null;
        }
      }
    }

    // Request accounts
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    return accounts[0];
  } catch (err) {
    console.error("Wallet connection error:", err);
    return null;
  }
};

export const getWalletAddress = async () => {
  if (!window.ethereum) return null;
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  return accounts[0] || null;
};
