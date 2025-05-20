export const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask.");
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
    const chainId = await window.ethereum.request({ method: "eth_chainId" });

    if (chainId !== MONAD_PARAMS.chainId) {
      try {
        // Try to switch to Monad
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: MONAD_PARAMS.chainId }],
        });
      } catch (switchError) {
        // If Monad not added, try to add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [MONAD_PARAMS],
            });
          } catch (addError) {
            console.error("Failed to add Monad chain:", addError);
            alert("Failed to add Monad network to MetaMask.");
            return null;
          }
        } else {
          console.error("Switch chain error:", switchError);
          alert("Please switch to Monad network in MetaMask manually.");
          return null;
        }
      }
    }

    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    return accounts[0];
  } catch (err) {
    console.error("Wallet connection error:", err);
    alert("Wallet connection failed.");
    return null;
  }
};
