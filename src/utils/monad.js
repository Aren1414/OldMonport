import { JsonRpcProvider } from "ethers";

export const MONAD_RPC = "https://rpc.testnet.monad.xyz";

export const getProvider = () => {
  return new JsonRpcProvider(MONAD_RPC); //
};
