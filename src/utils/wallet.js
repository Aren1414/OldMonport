export const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install a wallet like MetaMask");
    return null;
  }

  try {
    await switchToMonadNetwork();
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

export const switchToMonadNetwork = async () => {
  if (!window.ethereum) return;

  const monadChainId = "0x279f"; // 10143 in hex

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: monadChainId }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: monadChainId,
              chainName: "Monad Testnet",
              nativeCurrency: {
                name: "Monad",
                symbol: "MON",
                decimals: 18,
              },
              rpcUrls: ["https://testnet-rpc.monad.xyz/"],
              blockExplorerUrls: ["https://testnet.monadexplorer.com/"],
            },
          ],
        );
      } catch (addError) {
        console.error("Add network error:", addError);
      }
    } else {
      console.error("Switch network error:", switchError);
    }
  }
};
