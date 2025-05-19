export const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install a wallet like MetaMask");
    return null;
  }

  try {
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
