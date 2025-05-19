export const MONAD_RPC = "https://rpc.testnet.monad.xyz";

export const getProvider = () => {
  return new window.ethers.providers.JsonRpcProvider(MONAD_RPC);
};
