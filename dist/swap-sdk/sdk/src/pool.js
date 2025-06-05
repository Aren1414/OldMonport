"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrocPoolView = void 0;
const ethers_1 = require("ethers");
const context_1 = require("./context");
const flags_1 = require("./encoding/flags");
const init_1 = require("./encoding/init");
const liquidity_1 = require("./encoding/liquidity");
const tokens_1 = require("./tokens");
const utils_1 = require("./utils");
class CrocPoolView {
    constructor(quoteToken, baseToken, context) {
        [this.baseToken, this.quoteToken] =
            (0, tokens_1.sortBaseQuoteViews)(baseToken, quoteToken);
        this.context = context;
        this.baseDecimals = this.baseToken.decimals;
        this.quoteDecimals = this.quoteToken.decimals;
        this.useTrueBase = this.baseToken.tokenAddr === baseToken.tokenAddr;
    }
    /* Checks to see if a canonical pool has been initialized for this pair. */
    async isInit() {
        return this.spotPrice()
            .then(p => p > 0);
    }
    async spotPrice(block) {
        let txArgs = block ? { blockTag: block } : {};
        let sqrtPrice = (await this.context).query.queryPrice.staticCall(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, (await this.context).chain.poolIndex, txArgs);
        return (0, utils_1.decodeCrocPrice)(await sqrtPrice);
    }
    async displayPrice(block) {
        let spotPrice = this.spotPrice(block);
        return this.toDisplayPrice(await spotPrice);
    }
    async spotTick(block) {
        let txArgs = block ? { blockTag: block } : {};
        return (await this.context).query.queryCurveTick.staticCall(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, (await this.context).chain.poolIndex, txArgs).then(Number);
    }
    async xykLiquidity(block) {
        let txArgs = block ? { blockTag: block } : {};
        return (await this.context).query.queryLiquidity.staticCall(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, (await this.context).chain.poolIndex, txArgs);
    }
    async curveState(block) {
        let txArgs = block ? { blockTag: block } : {};
        return (await this.context).query.queryCurve.staticCall(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, (await this.context).chain.poolIndex, txArgs);
    }
    async cumAmbientGrowth(block) {
        const seedDeflator = (await this.curveState(block)).seedDeflator_;
        return (0, utils_1.bigIntToFloat)(seedDeflator) / Math.pow(2, 48);
    }
    async toDisplayPrice(spotPrice) {
        return (0, utils_1.toDisplayPrice)(spotPrice, await this.baseDecimals, await this.quoteDecimals, !this.useTrueBase);
    }
    async fromDisplayPrice(dispPrice) {
        return (0, utils_1.fromDisplayPrice)(dispPrice, await this.baseDecimals, await this.quoteDecimals, !this.useTrueBase);
    }
    async displayToPinTick(dispPrice) {
        const spotPrice = await this.fromDisplayPrice(dispPrice);
        const gridSize = (await this.context).chain.gridSize;
        return [(0, utils_1.pinTickLower)(spotPrice, gridSize), (0, utils_1.pinTickUpper)(spotPrice, gridSize)];
    }
    async displayToNeighborTicks(dispPrice, nNeighbors = 3) {
        const spotPrice = await this.fromDisplayPrice(dispPrice);
        const gridSize = (await this.context).chain.gridSize;
        return (0, utils_1.neighborTicks)(spotPrice, gridSize, nNeighbors);
    }
    async displayToNeighborTickPrices(dispPrice, nNeighbors = 3) {
        const ticks = await this.displayToNeighborTicks(dispPrice, nNeighbors);
        const toPriceFn = (tick) => this.toDisplayPrice((0, utils_1.tickToPrice)(tick));
        const belowPrices = Promise.all(ticks.below.map(toPriceFn));
        const abovePrices = Promise.all(ticks.above.map(toPriceFn));
        return this.useTrueBase ?
            { below: await belowPrices, above: await abovePrices } :
            { below: await abovePrices, above: await belowPrices };
    }
    async displayToOutsidePin(dispPrice) {
        const spotPrice = this.fromDisplayPrice(dispPrice);
        const gridSize = (await this.context).chain.gridSize;
        const pinTick = (0, utils_1.pinTickOutside)(await spotPrice, await this.spotPrice(), gridSize);
        const pinPrice = this.toDisplayPrice((0, utils_1.tickToPrice)(pinTick.tick));
        return Object.assign(pinTick, { price: await pinPrice,
            isPriceBelow: (await pinPrice) < dispPrice });
    }
    async initPool(initPrice) {
        // Very small amount of ETH in economic terms but more than sufficient for min init burn
        const ETH_INIT_BURN = BigInt(10) ** BigInt(12);
        let txArgs = this.baseToken.tokenAddr === ethers_1.ZeroAddress ? { value: ETH_INIT_BURN } : {};
        let encoder = new init_1.PoolInitEncoder(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, (await this.context).chain.poolIndex);
        let spotPrice = this.fromDisplayPrice(initPrice);
        let calldata = encoder.encodeInitialize(await spotPrice);
        let cntx = await this.context;
        await (0, context_1.ensureChain)(cntx);
        const gasEst = await cntx.dex.userCmd.estimateGas(cntx.chain.proxyPaths.cold, calldata, txArgs);
        Object.assign(txArgs, { gasLimit: gasEst + utils_1.GAS_PADDING, chainId: cntx.chain.chainId });
        return cntx.dex.userCmd(cntx.chain.proxyPaths.cold, calldata, txArgs);
    }
    async mintAmbientBase(qty, limits, opts) {
        return this.mintAmbient(qty, this.useTrueBase, limits, opts);
    }
    async mintAmbientQuote(qty, limits, opts) {
        return this.mintAmbient(qty, !this.useTrueBase, limits, opts);
    }
    async mintRangeBase(qty, range, limits, opts) {
        return this.mintRange(qty, this.useTrueBase, range, await limits, opts);
    }
    async mintRangeQuote(qty, range, limits, opts) {
        return this.mintRange(qty, !this.useTrueBase, range, await limits, opts);
    }
    async burnAmbientLiq(liq, limits, opts) {
        let [lowerBound, upperBound] = await this.transformLimits(limits);
        const calldata = (await this.makeEncoder()).encodeBurnAmbient(liq, lowerBound, upperBound, this.maskSurplusFlag(opts));
        return this.sendCmd(calldata);
    }
    async burnAmbientAll(limits, opts) {
        let [lowerBound, upperBound] = await this.transformLimits(limits);
        const calldata = (await this.makeEncoder()).encodeBurnAmbientAll(lowerBound, upperBound, this.maskSurplusFlag(opts));
        return this.sendCmd(calldata);
    }
    async burnRangeLiq(liq, range, limits, opts) {
        let [lowerBound, upperBound] = await this.transformLimits(limits);
        let roundLotLiq = (0, utils_1.roundForConcLiq)(liq);
        const calldata = (await this.makeEncoder()).encodeBurnConc(range[0], range[1], roundLotLiq, lowerBound, upperBound, this.maskSurplusFlag(opts));
        return this.sendCmd(calldata);
    }
    async harvestRange(range, limits, opts) {
        let [lowerBound, upperBound] = await this.transformLimits(limits);
        const calldata = (await this.makeEncoder()).encodeHarvestConc(range[0], range[1], lowerBound, upperBound, this.maskSurplusFlag(opts));
        return this.sendCmd(calldata);
    }
    async sendCmd(calldata, txArgs) {
        let cntx = await this.context;
        if (txArgs === undefined) {
            txArgs = {};
        }
        await (0, context_1.ensureChain)(cntx);
        const gasEst = await cntx.dex.userCmd.estimateGas(cntx.chain.proxyPaths.liq, calldata, txArgs);
        Object.assign(txArgs, { gasLimit: gasEst + utils_1.GAS_PADDING, chainId: cntx.chain.chainId });
        return cntx.dex.userCmd(cntx.chain.proxyPaths.liq, calldata, txArgs);
    }
    async mintAmbient(qty, isQtyBase, limits, opts) {
        let msgVal = this.msgValAmbient(qty, isQtyBase, limits, opts);
        let weiQty = this.normQty(qty, isQtyBase);
        let [lowerBound, upperBound] = await this.transformLimits(limits);
        const calldata = (await this.makeEncoder()).encodeMintAmbient(await weiQty, isQtyBase, lowerBound, upperBound, this.maskSurplusFlag(opts));
        return this.sendCmd(calldata, { value: await msgVal });
    }
    async boundLimits(range, limits, isQtyBase, floatingSlippage = 0.1) {
        let spotPrice = this.spotPrice();
        const [lowerPrice, upperPrice] = this.rangeToPrice(range);
        const [boundLower, boundUpper] = await this.transformLimits(limits);
        const BOUND_PREC = 1.0001;
        let [amplifyLower, amplifyUpper] = [boundLower, boundUpper];
        if (upperPrice < await spotPrice) {
            amplifyLower = upperPrice * BOUND_PREC;
        }
        else if (lowerPrice > await spotPrice) {
            amplifyUpper = lowerPrice / BOUND_PREC;
        }
        else {
            if (isQtyBase) {
                amplifyLower = (0, utils_1.concBaseSlippagePrice)(await spotPrice, upperPrice, floatingSlippage);
            }
            else {
                amplifyUpper = (0, utils_1.concQuoteSlippagePrice)(await spotPrice, lowerPrice, floatingSlippage);
            }
        }
        return this.untransformLimits([Math.max(amplifyLower, boundLower), Math.min(amplifyUpper, boundUpper)]);
    }
    rangeToPrice(range) {
        const lowerPrice = Math.pow(1.0001, range[0]);
        const upperPrice = Math.pow(1.0001, range[1]);
        return [lowerPrice, upperPrice];
    }
    async transformLimits(limits) {
        let left = this.fromDisplayPrice(limits[0]);
        let right = this.fromDisplayPrice(limits[1]);
        return (await left < await right) ?
            [await left, await right] :
            [await right, await left];
    }
    async untransformLimits(limits) {
        let left = this.toDisplayPrice(limits[0]);
        let right = this.toDisplayPrice(limits[1]);
        return (await left < await right) ?
            [await left, await right] :
            [await right, await left];
    }
    async mintRange(qty, isQtyBase, range, limits, opts) {
        const saneLimits = await this.boundLimits(range, limits, isQtyBase, opts?.floatingSlippage);
        let msgVal = this.msgValRange(qty, isQtyBase, range, await saneLimits, opts);
        let weiQty = this.normQty(qty, isQtyBase);
        let [lowerBound, upperBound] = await this.transformLimits(await saneLimits);
        const calldata = (await this.makeEncoder()).encodeMintConc(range[0], range[1], await weiQty, isQtyBase, lowerBound, upperBound, this.maskSurplusFlag(opts));
        return this.sendCmd(calldata, { value: await msgVal });
    }
    maskSurplusFlag(opts) {
        if (!opts || opts.surplus === undefined) {
            return this.maskSurplusFlag({ surplus: false });
        }
        return (0, flags_1.encodeSurplusArg)(opts.surplus, this.useTrueBase);
    }
    async msgValAmbient(qty, isQtyBase, limits, opts) {
        let ethQty = isQtyBase ? qty :
            this.ethForAmbientQuote(qty, limits);
        return this.ethToAttach(await ethQty, opts);
    }
    async msgValRange(qty, isQtyBase, range, limits, opts) {
        let ethQty = isQtyBase ? qty :
            this.ethForRangeQuote(qty, range, limits);
        return this.ethToAttach(await ethQty, opts);
    }
    async ethToAttach(neededQty, opts) {
        if (this.baseToken.tokenAddr !== ethers_1.ZeroAddress) {
            return BigInt(0);
        }
        const ethQty = await this.normEth(neededQty);
        let useSurplus = (0, flags_1.decodeSurplusFlag)(this.maskSurplusFlag(opts))[0];
        if (useSurplus) {
            return new tokens_1.CrocEthView(this.context).msgValOverSurplus(ethQty);
        }
        else {
            return ethQty;
        }
    }
    async ethForAmbientQuote(quoteQty, limits) {
        const weiEth = this.calcEthInQuote(quoteQty, limits);
        return (0, utils_1.toDisplayQty)(await weiEth, await this.baseDecimals);
    }
    async calcEthInQuote(quoteQty, limits, precAdj = 1.001) {
        const weiQty = await this.normQty(quoteQty, false);
        const [, boundPrice] = await this.transformLimits(limits);
        return Math.round((0, utils_1.bigIntToFloat)(weiQty) * boundPrice * precAdj);
    }
    async ethForRangeQuote(quoteQty, range, limits) {
        const spotPrice = await this.spotPrice();
        const [lowerPrice, upperPrice] = this.rangeToPrice(range);
        let skew = (0, utils_1.concDepositSkew)(spotPrice, lowerPrice, upperPrice);
        let ambiQty = this.calcEthInQuote(quoteQty, limits);
        let concQty = ambiQty.then(aq => Math.ceil(aq * skew));
        return (0, utils_1.toDisplayQty)(await concQty, await this.baseDecimals);
    }
    async normEth(ethQty) {
        return this.normQty(ethQty, true); // ETH is always on base side
    }
    async normQty(qty, isBase) {
        let token = isBase ? this.baseToken : this.quoteToken;
        return token.normQty(qty);
    }
    async makeEncoder() {
        return new liquidity_1.WarmPathEncoder(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, (await this.context).chain.poolIndex);
    }
}
exports.CrocPoolView = CrocPoolView;
