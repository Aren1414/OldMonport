import { Contract, formatUnits, formatEther, JsonRpcProvider } from "ethers";
import { ERC20_ABI } from "./constants";

export async function getTokenSymbol(tokenAddress, provider) {
  if (tokenAddress === "0x0000000000000000000000000000000000000000") return "MON";

  try {
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);
    return await contract.symbol();
  } catch {
    return "???";
  }
}

export async function getTokenDecimals(tokenAddress, provider) {
  if (tokenAddress === "0x0000000000000000000000000000000000000000") return 18;

  try {
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);
    return await contract.decimals();
  } catch {
    return 18;
  }
}

export async function getTokenBalance(tokenAddress, walletAddress, rpcUrl) {
  if (!walletAddress) return "0";

  const provider = new JsonRpcProvider(rpcUrl);

  if (tokenAddress === "0x0000000000000000000000000000000000000000") {
    try {
      const balance = await provider.getBalance(walletAddress);
      return formatEther(balance);
    } catch {
      return "0";
    }
  }

  try {
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);
    const balanceRaw = await contract.balanceOf(walletAddress);
    const decimals = await contract.decimals();
    return formatUnits(balanceRaw, decimals);
  } catch {
    return "0";
  }
}
