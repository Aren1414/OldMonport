"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrocKnockoutHandle = void 0;
const ethers_1 = require("ethers");
const context_1 = require("./context");
const flags_1 = require("./encoding/flags");
const knockout_1 = require("./encoding/knockout");
const tokens_1 = require("./tokens");
const utils_1 = require("./utils");
class CrocKnockoutHandle {
    constructor(sellToken, buyToken, qty, inSellQty, knockoutTick, context) {
        [this.baseToken, this.quoteToken] = (0, tokens_1.sortBaseQuoteViews)(sellToken, buyToken);
        this.sellBase = (this.baseToken === sellToken);
        this.qtyInBase = inSellQty ? this.sellBase : !this.sellBase;
        const tokenView = this.qtyInBase ? this.baseToken : this.quoteToken;
        const specQty = tokenView.normQty(qty);
        this.qty = inSellQty ? specQty :
            calcSellQty(specQty, !this.sellBase, knockoutTick, context);
        this.knockoutTick = knockoutTick;
        this.context = context;
    }
    async mint(opts) {
        const chain = (await this.context).chain;
        const encoder = new knockout_1.KnockoutEncoder(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, chain.poolIndex);
        const [lowerTick, upperTick] = this.tickRange(chain);
        const surplus = this.maskSurplusFlags(opts);
        const cmd = encoder.encodeKnockoutMint(await this.qty, lowerTick, upperTick, this.sellBase, surplus);
        return this.sendCmd(cmd, { value: await this.msgVal(surplus) });
    }
    async burn(opts) {
        const chain = (await this.context).chain;
        const encoder = new knockout_1.KnockoutEncoder(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, chain.poolIndex);
        const [lowerTick, upperTick] = this.tickRange(chain);
        const surplus = this.maskSurplusFlags(opts);
        const cmd = encoder.encodeKnockoutBurnQty(await this.qty, lowerTick, upperTick, this.sellBase, surplus);
        return this.sendCmd(cmd);
    }
    async burnLiq(liq, opts) {
        const chain = (await this.context).chain;
        const encoder = new knockout_1.KnockoutEncoder(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, chain.poolIndex);
        const [lowerTick, upperTick] = this.tickRange(chain);
        const surplus = this.maskSurplusFlags(opts);
        const cmd = encoder.encodeKnockoutBurnLiq((0, utils_1.roundForConcLiq)(liq), lowerTick, upperTick, this.sellBase, surplus);
        return this.sendCmd(cmd);
    }
    async recoverPost(pivotTime, opts) {
        const chain = (await this.context).chain;
        const encoder = new knockout_1.KnockoutEncoder(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, chain.poolIndex);
        const [lowerTick, upperTick] = this.tickRange(chain);
        const surplus = this.maskSurplusFlags(opts);
        const cmd = encoder.encodeKnockoutRecover(pivotTime, lowerTick, upperTick, this.sellBase, surplus);
        return this.sendCmd(cmd);
    }
    async willMintFail() {
        const gridSize = this.context.then(c => c.chain.gridSize);
        const marketTick = this.context.then(c => c.query.queryCurveTick(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, c.chain.poolIndex));
        return this.sellBase ?
            (this.knockoutTick + await gridSize >= await marketTick) :
            (this.knockoutTick - await gridSize <= await marketTick);
    }
    async sendCmd(calldata, txArgs) {
        let cntx = await this.context;
        if (txArgs === undefined) {
            txArgs = {};
        }
        await (0, context_1.ensureChain)(cntx);
        const gasEst = await cntx.dex.userCmd.estimateGas(KNOCKOUT_PATH, calldata, txArgs);
        Object.assign(txArgs, { gasLimit: gasEst + utils_1.GAS_PADDING, chainId: cntx.chain.chainId });
        return cntx.dex.userCmd(KNOCKOUT_PATH, calldata, txArgs);
    }
    maskSurplusFlags(opts) {
        if (!opts || !opts.surplus) {
            return (0, flags_1.encodeSurplusArg)(false);
        }
        else {
            return (0, flags_1.encodeSurplusArg)(opts.surplus);
        }
    }
    async msgVal(surplusFlags) {
        if (this.baseToken.tokenAddr !== ethers_1.ZeroAddress || !this.sellBase) {
            return BigInt(0);
        }
        const useSurp = (0, flags_1.decodeSurplusFlag)(surplusFlags)[0];
        if (useSurp) {
            return new tokens_1.CrocEthView(this.context).msgValOverSurplus(await this.qty);
        }
        else {
            return this.qty;
        }
    }
    tickRange(chain) {
        return tickRange(chain, this.knockoutTick, this.sellBase);
    }
}
exports.CrocKnockoutHandle = CrocKnockoutHandle;
const KNOCKOUT_PATH = 7;
async function calcSellQty(buyQty, isQtyInBase, knockoutTick, context) {
    const sellQty = calcSellFloat((0, utils_1.bigIntToFloat)(await buyQty), isQtyInBase, knockoutTick, context);
    return sellQty.then(utils_1.floatToBigInt);
}
async function calcSellFloat(buyQty, isQtyInBase, knockoutTick, context) {
    const [lowerTick, upperTick] = tickRange((await context).chain, knockoutTick, !isQtyInBase);
    const lowerPrice = Math.pow(1.0001, lowerTick);
    const upperPrice = Math.pow(1.0001, upperTick);
    return isQtyInBase ?
        (0, utils_1.baseTokenForQuoteConc)(buyQty, lowerPrice, upperPrice) :
        (0, utils_1.quoteTokenForBaseConc)(buyQty, lowerPrice, upperPrice);
}
function tickRange(chain, knockoutTick, sellBase) {
    return sellBase ?
        [knockoutTick, knockoutTick + chain.gridSize] :
        [knockoutTick - chain.gridSize, knockoutTick];
}
