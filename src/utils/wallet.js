export const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install a wallet like MetaMask or use a compatible wallet.");
    return null;
  }

  const monadChainId = "0x279F"; // 10143 in hex

  try {
    // Try switching to Monad Testnet
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: monadChainId }],
    });
  } catch (switchError) {
    // If Monad Testnet is not added, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: monadChainId,
            chainName: "Monad Testnet",
            nativeCurrency: {
              name: "MON",
              symbol: "MON",
              decimals: 18,
            },
            rpcUrls: ["https://testnet-rpc.monad.xyz/"],
            blockExplorerUrls: ["https://testnet.monadexplorer.com/"]
          }]
        });
      } catch (addError) {
        console.error("Failed to add Monad Testnet:", addError);
        return null;
      }
    } else {
      console.error("Network switch failed:", switchError);
      return null;
    }
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
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
