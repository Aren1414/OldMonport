"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrocReposition = void 0;
const context_1 = require("../context");
const longform_1 = require("../encoding/longform");
const swap_1 = require("../swap");
const utils_1 = require("../utils");
const liquidity_1 = require("../utils/liquidity");
class CrocReposition {
    constructor(pool, target, opts = {}) {
        this.pool = pool;
        this.burnRange = target.burn;
        this.mintRange = target.mint;
        this.liquidity = target.liquidity;
        this.spotPrice = this.pool.spotPrice();
        this.spotTick = this.pool.spotTick();
        this.impact = opts?.impact || DEFAULT_REBAL_SLIPPAGE;
    }
    async rebal() {
        const directive = await this.formatDirective();
        const cntx = await this.pool.context;
        const path = cntx.chain.proxyPaths.long;
        await (0, context_1.ensureChain)(cntx);
        const gasEst = await cntx.dex.userCmd.estimateGas(path, directive.encodeBytes());
        return cntx.dex.userCmd(path, directive.encodeBytes(), { gasLimit: gasEst + utils_1.GAS_PADDING, chainId: cntx.chain.chainId });
    }
    async simStatic() {
        const directive = await this.formatDirective();
        const path = (await this.pool.context).chain.proxyPaths.long;
        return (await this.pool.context).dex.userCmd.staticCall(path, directive.encodeBytes());
    }
    async balancePercent() {
        if (this.mintRange === "ambient") {
            return 0.5; // Ambient positions are 50/50 balance
        }
        else {
            const baseQuoteBal = (0, liquidity_1.concDepositBalance)(await this.spotPrice, (0, utils_1.tickToPrice)(this.mintRange[0]), (0, utils_1.tickToPrice)(this.mintRange[1]));
            return await this.isBaseOutOfRange() ?
                (1.0 - baseQuoteBal) : baseQuoteBal;
        }
    }
    async currentCollateral() {
        const tokenFn = await this.isBaseOutOfRange() ? liquidity_1.baseTokenForConcLiq : liquidity_1.quoteTokenForConcLiq;
        return tokenFn(await this.spotPrice, this.liquidity, (0, utils_1.tickToPrice)(this.burnRange[0]), (0, utils_1.tickToPrice)(this.burnRange[1]));
    }
    async convertCollateral() {
        const balance = await this.swapFraction();
        const collat = await this.currentCollateral();
        return collat * balance / BigInt(10000);
    }
    async postBalance() {
        const outside = this.mintInput().then(parseFloat);
        const inside = this.swapOutput().then(parseFloat);
        return await this.isBaseOutOfRange() ?
            [await outside, await inside] :
            [await inside, await outside];
    }
    async mintInput() {
        const collat = (await this.currentCollateral()) - (await this.convertCollateral());
        const pool = this.pool;
        return await this.isBaseOutOfRange() ?
            pool.baseToken.toDisplay(collat) :
            pool.quoteToken.toDisplay(collat);
    }
    async swapOutput() {
        const [sellToken, buyToken] = await this.pivotTokens();
        const swap = new swap_1.CrocSwapPlan(sellToken, buyToken, await this.convertCollateral(), false, this.pool.context, { slippage: this.impact });
        const impact = await swap.calcImpact();
        return impact.buyQty;
    }
    async isBaseOutOfRange() {
        const spot = await this.spotTick;
        if (spot >= this.burnRange[1]) {
            return true;
        }
        else if (spot < this.burnRange[0]) {
            return false;
        }
        else {
            throw new Error("Rebalance position not out of range");
        }
    }
    async pivotTokens() {
        return await this.isBaseOutOfRange() ?
            [this.pool.baseToken, this.pool.quoteToken] :
            [this.pool.quoteToken, this.pool.baseToken];
    }
    async formatDirective() {
        const [openToken, closeToken] = await this.pivotTokens();
        const directive = new longform_1.OrderDirective(openToken.tokenAddr);
        directive.appendHop(closeToken.tokenAddr);
        const pool = directive.appendPool((await this.pool.context).chain.poolIndex);
        directive.appendRangeBurn(this.burnRange[0], this.burnRange[1], this.liquidity);
        await this.setupSwap(pool);
        directive.appendPool((await this.pool.context).chain.poolIndex);
        if (this.mintRange === "ambient") {
            const mint = directive.appendAmbientMint(BigInt(0));
            mint.rollType = 5;
        }
        else {
            const mint = directive.appendRangeMint(this.mintRange[0], this.mintRange[1], BigInt(0));
            mint.rollType = 5;
        }
        directive.open.limitQty = BigInt(0);
        directive.hops[0].settlement.limitQty = BigInt(0);
        return directive;
    }
    async setupSwap(pool) {
        pool.chain.swapDefer = true;
        pool.swap.rollType = 4;
        pool.swap.qty = await this.swapFraction();
        const sellBase = await this.isBaseOutOfRange();
        pool.swap.isBuy = sellBase;
        pool.swap.inBaseQty = sellBase;
        const priceMult = sellBase ? (1 + this.impact) : (1 - this.impact);
        pool.swap.limitPrice = (0, utils_1.encodeCrocPrice)((await this.spotPrice) * priceMult);
    }
    async swapFraction() {
        const swapProp = await this.balancePercent() + this.impact;
        return BigInt(Math.floor(Math.min(swapProp, 1.0) * 10000));
    }
}
exports.CrocReposition = CrocReposition;
const DEFAULT_REBAL_SLIPPAGE = .02;
