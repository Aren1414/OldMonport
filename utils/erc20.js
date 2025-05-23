import { ethers } from "ethers";

// Standard ERC20 ABI (only the parts we need)
const erc20Abi = [
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
];

export const getTokenSymbol = async (tokenAddress) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    const symbol = await contract.symbol();
    return symbol;
  } catch (err) {
    console.error("Error fetching symbol for token:", tokenAddress, err);
    return "UNKNOWN";
  }
};

export const getTokenBalance = async (tokenAddress, walletAddress) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    const balance = await contract.balanceOf(walletAddress);
    return ethers.utils.formatUnits(balance, 18);
  } catch (err) {
    console.error("Error fetching balance for token:", tokenAddress, err);
    return "0";
  }
};
