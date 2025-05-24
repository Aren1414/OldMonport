import { ethers } from "ethers";

export const getTokenSymbol = async (tokenAddress, walletAddress) => {
  if (tokenAddress === "0x0000000000000000000000000000000000000000") return "MON";

  const abi = [
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
  ];

  try {
    if (!window.ethereum) {
      throw new Error("No Ethereum provider found. Please install a wallet like MetaMask.");
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(tokenAddress, abi, provider);
    const symbol = await contract.symbol();
    return symbol;
  } catch (err) {
    console.error(`Error fetching symbol for ${tokenAddress}:`, err);
    return "???";
  }
};

export const getTokenBalance = async (tokenAddress, walletAddress) => {
  if (!walletAddress) return "0";

  if (tokenAddress === "0x0000000000000000000000000000000000000000") {
    try {
      if (!window.ethereum) {
        throw new Error("No Ethereum provider found. Please install a wallet like MetaMask.");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(walletAddress);
      return ethers.utils.formatEther(balance);
    } catch (err) {
      console.error(`Error fetching balance for ${tokenAddress}:`, err);
      return "0";
    }
  }

  const abi = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  try {
    if (!window.ethereum) {
      throw new Error("No Ethereum provider found. Please install a wallet like MetaMask.");
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(tokenAddress, abi, provider);
    const balance = await contract.balanceOf(walletAddress);
    const decimals = await contract.decimals();
    return ethers.utils.formatUnits(balance, decimals);
  } catch (err) {
    console.error(`Error fetching balance for ${tokenAddress}:`, err);
    return "0";
  }
};
