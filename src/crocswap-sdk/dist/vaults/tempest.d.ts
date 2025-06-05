import { TransactionResponse } from "ethers";
import { CrocContext } from "../context";
import { CrocTokenView, TokenQty } from "../tokens";
export type TempestStrategy = 'rswEth' | 'symetricAmbient';
export declare class TempestVault {
    constructor(vaultToken: CrocTokenView, token1: CrocTokenView, strategy: TempestStrategy, context: Promise<CrocContext>);
    depositZap(qty: TokenQty): Promise<TransactionResponse>;
    redeemZap(vaultQty: TokenQty, minToken1Qty: TokenQty): Promise<TransactionResponse>;
    minDeposit(): Promise<bigint>;
    balanceVault(wallet: string): Promise<bigint>;
    balanceToken1(wallet: string): Promise<bigint>;
    queryConversionRate(): Promise<number>;
    allowance(wallet: string): Promise<bigint>;
    approve(approveQty?: TokenQty): Promise<TransactionResponse | undefined>;
    private vaultAddr;
    private token1;
    private vaultToken;
    private strategy;
    private vaultWrite;
    private vaultRead;
    private minDepositCache;
    private context;
}
