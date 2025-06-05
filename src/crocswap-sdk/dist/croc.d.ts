import { Signer, TransactionResponse } from 'ethers';
import { ConnectArg, CrocContext } from './context';
import { CrocKnockoutHandle } from './knockout';
import { CrocPoolView } from './pool';
import { CrocPositionView } from './position';
import { CrocSlotReader } from './slots';
import { CrocSwapPlan, CrocSwapPlanOpts } from './swap';
import { CrocTokenView, TokenQty } from './tokens';
import { TempestStrategy, TempestVault } from './vaults/tempest';
export declare class CrocEnv {
    constructor(conn: ConnectArg, signer?: Signer);
    buy(token: string, qty: TokenQty): BuyPrefix;
    buyEth(qty: TokenQty): BuyPrefix;
    sell(token: string, qty: TokenQty): SellPrefix;
    sellEth(qty: TokenQty): SellPrefix;
    pool(tokenQuote: string, tokenBase: string): CrocPoolView;
    poolEth(token: string): CrocPoolView;
    poolEthQuote(token: string): CrocPoolView;
    positions(tokenQuote: string, tokenBase: string, owner: string): CrocPositionView;
    token(token: string): CrocTokenView;
    tokenEth(): CrocTokenView;
    approveBypassRouter(): Promise<TransactionResponse | undefined>;
    tempestVault(vaultAddr: string, token1Addr: string, strategy: TempestStrategy): TempestVault;
    slotReader(): CrocSlotReader;
    readonly context: Promise<CrocContext>;
    tokens: TokenRepo;
}
declare class BuyPrefix {
    constructor(token: string, qty: TokenQty, repo: TokenRepo, context: Promise<CrocContext>);
    with(token: string, args?: CrocSwapPlanOpts): CrocSwapPlan;
    withEth(args?: CrocSwapPlanOpts): CrocSwapPlan;
    atLimit(token: string, tick: number): CrocKnockoutHandle;
    readonly token: string;
    readonly qty: TokenQty;
    readonly context: Promise<CrocContext>;
    repo: TokenRepo;
}
declare class SellPrefix {
    constructor(token: string, qty: TokenQty, repo: TokenRepo, context: Promise<CrocContext>);
    for(token: string, args?: CrocSwapPlanOpts): CrocSwapPlan;
    forEth(args?: CrocSwapPlanOpts): CrocSwapPlan;
    atLimit(token: string, tick: number): CrocKnockoutHandle;
    readonly token: string;
    readonly qty: TokenQty;
    readonly context: Promise<CrocContext>;
    repo: TokenRepo;
}
declare class TokenRepo {
    constructor(context: Promise<CrocContext>);
    materialize(tokenAddr: string): CrocTokenView;
    tokenViews: Map<string, CrocTokenView>;
    context: Promise<CrocContext>;
}
export {};
