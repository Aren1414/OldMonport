import { BrowserProvider } from "ethers";

const MONAD_CHAIN_ID = "0x279f"; // 10143 in hex

const isOnMonad = async () => {
  const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
  return currentChainId === MONAD_CHAIN_ID;
};

export const switchToMonadNetwork = async () => {
  if (!window.ethereum) return;

  if (await isOnMonad()) return;

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
          params: [
            {
              chainId: MONAD_CHAIN_ID,
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
        });
      } catch (addError) {
        console.error("Add network error:", addError);
      }
    } else {
      console.error("Switch network error:", switchError);
    }
  }
};

export const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install a wallet like MetaMask");
    return null;
  }

  try {
    await switchToMonadNetwork();

    const provider = new BrowserProvider(window.ethereum); //
    const signer = await provider.getSigner(); //

    return signer;  // Return signer instead of address
  } catch (err) {
    console.error("Wallet connection error:", err);
    alert("Wallet connection failed");
    return null;
  }
};

export const getWalletAddress = async () => {
  if (!window.ethereum) return null;

  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  return accounts[0] || null;
};
