"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    isInit() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.spotPrice()
                .then(p => p > 0);
        });
    }
    spotPrice(block) {
        return __awaiter(this, void 0, void 0, function* () {
            let txArgs = block ? { blockTag: block } : {};
            let sqrtPrice = (yield this.context).query.queryPrice.staticCall(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, (yield this.context).chain.poolIndex, txArgs);
            return (0, utils_1.decodeCrocPrice)(yield sqrtPrice);
        });
    }
    displayPrice(block) {
        return __awaiter(this, void 0, void 0, function* () {
            let spotPrice = this.spotPrice(block);
            return this.toDisplayPrice(yield spotPrice);
        });
    }
    spotTick(block) {
        return __awaiter(this, void 0, void 0, function* () {
            let txArgs = block ? { blockTag: block } : {};
            return (yield this.context).query.queryCurveTick.staticCall(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, (yield this.context).chain.poolIndex, txArgs).then(Number);
        });
    }
    xykLiquidity(block) {
        return __awaiter(this, void 0, void 0, function* () {
            let txArgs = block ? { blockTag: block } : {};
            return (yield this.context).query.queryLiquidity.staticCall(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, (yield this.context).chain.poolIndex, txArgs);
        });
    }
    curveState(block) {
        return __awaiter(this, void 0, void 0, function* () {
            let txArgs = block ? { blockTag: block } : {};
            return (yield this.context).query.queryCurve.staticCall(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, (yield this.context).chain.poolIndex, txArgs);
        });
    }
    cumAmbientGrowth(block) {
        return __awaiter(this, void 0, void 0, function* () {
            const seedDeflator = (yield this.curveState(block)).seedDeflator_;
            return (0, utils_1.bigIntToFloat)(seedDeflator) / Math.pow(2, 48);
        });
    }
    toDisplayPrice(spotPrice) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, utils_1.toDisplayPrice)(spotPrice, yield this.baseDecimals, yield this.quoteDecimals, !this.useTrueBase);
        });
    }
    fromDisplayPrice(dispPrice) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, utils_1.fromDisplayPrice)(dispPrice, yield this.baseDecimals, yield this.quoteDecimals, !this.useTrueBase);
        });
    }
    displayToPinTick(dispPrice) {
        return __awaiter(this, void 0, void 0, function* () {
            const spotPrice = yield this.fromDisplayPrice(dispPrice);
            const gridSize = (yield this.context).chain.gridSize;
            return [(0, utils_1.pinTickLower)(spotPrice, gridSize), (0, utils_1.pinTickUpper)(spotPrice, gridSize)];
        });
    }
    displayToNeighborTicks(dispPrice, nNeighbors = 3) {
        return __awaiter(this, void 0, void 0, function* () {
            const spotPrice = yield this.fromDisplayPrice(dispPrice);
            const gridSize = (yield this.context).chain.gridSize;
            return (0, utils_1.neighborTicks)(spotPrice, gridSize, nNeighbors);
        });
    }
    displayToNeighborTickPrices(dispPrice, nNeighbors = 3) {
        return __awaiter(this, void 0, void 0, function* () {
            const ticks = yield this.displayToNeighborTicks(dispPrice, nNeighbors);
            const toPriceFn = (tick) => this.toDisplayPrice((0, utils_1.tickToPrice)(tick));
            const belowPrices = Promise.all(ticks.below.map(toPriceFn));
            const abovePrices = Promise.all(ticks.above.map(toPriceFn));
            return this.useTrueBase ?
                { below: yield belowPrices, above: yield abovePrices } :
                { below: yield abovePrices, above: yield belowPrices };
        });
    }
    displayToOutsidePin(dispPrice) {
        return __awaiter(this, void 0, void 0, function* () {
            const spotPrice = this.fromDisplayPrice(dispPrice);
            const gridSize = (yield this.context).chain.gridSize;
            const pinTick = (0, utils_1.pinTickOutside)(yield spotPrice, yield this.spotPrice(), gridSize);
            const pinPrice = this.toDisplayPrice((0, utils_1.tickToPrice)(pinTick.tick));
            return Object.assign(pinTick, { price: yield pinPrice,
                isPriceBelow: (yield pinPrice) < dispPrice });
        });
    }
    initPool(initPrice) {
        return __awaiter(this, void 0, void 0, function* () {
            // Very small amount of ETH in economic terms but more than sufficient for min init burn
            const ETH_INIT_BURN = Math.pow(BigInt(10), BigInt(12));
            let txArgs = this.baseToken.tokenAddr === ethers_1.ZeroAddress ? { value: ETH_INIT_BURN } : {};
            let encoder = new init_1.PoolInitEncoder(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, (yield this.context).chain.poolIndex);
            let spotPrice = this.fromDisplayPrice(initPrice);
            let calldata = encoder.encodeInitialize(yield spotPrice);
            let cntx = yield this.context;
            yield (0, context_1.ensureChain)(cntx);
            const gasEst = yield cntx.dex.userCmd.estimateGas(cntx.chain.proxyPaths.cold, calldata, txArgs);
            Object.assign(txArgs, { gasLimit: gasEst + utils_1.GAS_PADDING, chainId: cntx.chain.chainId });
            return cntx.dex.userCmd(cntx.chain.proxyPaths.cold, calldata, txArgs);
        });
    }
    mintAmbientBase(qty, limits, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.mintAmbient(qty, this.useTrueBase, limits, opts);
        });
    }
    mintAmbientQuote(qty, limits, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.mintAmbient(qty, !this.useTrueBase, limits, opts);
        });
    }
    mintRangeBase(qty, range, limits, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.mintRange(qty, this.useTrueBase, range, yield limits, opts);
        });
    }
    mintRangeQuote(qty, range, limits, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.mintRange(qty, !this.useTrueBase, range, yield limits, opts);
        });
    }
    burnAmbientLiq(liq, limits, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let [lowerBound, upperBound] = yield this.transformLimits(limits);
            const calldata = (yield this.makeEncoder()).encodeBurnAmbient(liq, lowerBound, upperBound, this.maskSurplusFlag(opts));
            return this.sendCmd(calldata);
        });
    }
    burnAmbientAll(limits, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let [lowerBound, upperBound] = yield this.transformLimits(limits);
            const calldata = (yield this.makeEncoder()).encodeBurnAmbientAll(lowerBound, upperBound, this.maskSurplusFlag(opts));
            return this.sendCmd(calldata);
        });
    }
    burnRangeLiq(liq, range, limits, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let [lowerBound, upperBound] = yield this.transformLimits(limits);
            let roundLotLiq = (0, utils_1.roundForConcLiq)(liq);
            const calldata = (yield this.makeEncoder()).encodeBurnConc(range[0], range[1], roundLotLiq, lowerBound, upperBound, this.maskSurplusFlag(opts));
            return this.sendCmd(calldata);
        });
    }
    harvestRange(range, limits, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let [lowerBound, upperBound] = yield this.transformLimits(limits);
            const calldata = (yield this.makeEncoder()).encodeHarvestConc(range[0], range[1], lowerBound, upperBound, this.maskSurplusFlag(opts));
            return this.sendCmd(calldata);
        });
    }
    sendCmd(calldata, txArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            let cntx = yield this.context;
            if (txArgs === undefined) {
                txArgs = {};
            }
            yield (0, context_1.ensureChain)(cntx);
            const gasEst = yield cntx.dex.userCmd.estimateGas(cntx.chain.proxyPaths.liq, calldata, txArgs);
            Object.assign(txArgs, { gasLimit: gasEst + utils_1.GAS_PADDING, chainId: cntx.chain.chainId });
            return cntx.dex.userCmd(cntx.chain.proxyPaths.liq, calldata, txArgs);
        });
    }
    mintAmbient(qty, isQtyBase, limits, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let msgVal = this.msgValAmbient(qty, isQtyBase, limits, opts);
            let weiQty = this.normQty(qty, isQtyBase);
            let [lowerBound, upperBound] = yield this.transformLimits(limits);
            const calldata = (yield this.makeEncoder()).encodeMintAmbient(yield weiQty, isQtyBase, lowerBound, upperBound, this.maskSurplusFlag(opts));
            return this.sendCmd(calldata, { value: yield msgVal });
        });
    }
    boundLimits(range, limits, isQtyBase, floatingSlippage = 0.1) {
        return __awaiter(this, void 0, void 0, function* () {
            let spotPrice = this.spotPrice();
            const [lowerPrice, upperPrice] = this.rangeToPrice(range);
            const [boundLower, boundUpper] = yield this.transformLimits(limits);
            const BOUND_PREC = 1.0001;
            let [amplifyLower, amplifyUpper] = [boundLower, boundUpper];
            if (upperPrice < (yield spotPrice)) {
                amplifyLower = upperPrice * BOUND_PREC;
            }
            else if (lowerPrice > (yield spotPrice)) {
                amplifyUpper = lowerPrice / BOUND_PREC;
            }
            else {
                if (isQtyBase) {
                    amplifyLower = (0, utils_1.concBaseSlippagePrice)(yield spotPrice, upperPrice, floatingSlippage);
                }
                else {
                    amplifyUpper = (0, utils_1.concQuoteSlippagePrice)(yield spotPrice, lowerPrice, floatingSlippage);
                }
            }
            return this.untransformLimits([Math.max(amplifyLower, boundLower), Math.min(amplifyUpper, boundUpper)]);
        });
    }
    rangeToPrice(range) {
        const lowerPrice = Math.pow(1.0001, range[0]);
        const upperPrice = Math.pow(1.0001, range[1]);
        return [lowerPrice, upperPrice];
    }
    transformLimits(limits) {
        return __awaiter(this, void 0, void 0, function* () {
            let left = this.fromDisplayPrice(limits[0]);
            let right = this.fromDisplayPrice(limits[1]);
            return ((yield left) < (yield right)) ?
                [yield left, yield right] :
                [yield right, yield left];
        });
    }
    untransformLimits(limits) {
        return __awaiter(this, void 0, void 0, function* () {
            let left = this.toDisplayPrice(limits[0]);
            let right = this.toDisplayPrice(limits[1]);
            return ((yield left) < (yield right)) ?
                [yield left, yield right] :
                [yield right, yield left];
        });
    }
    mintRange(qty, isQtyBase, range, limits, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const saneLimits = yield this.boundLimits(range, limits, isQtyBase, opts === null || opts === void 0 ? void 0 : opts.floatingSlippage);
            let msgVal = this.msgValRange(qty, isQtyBase, range, yield saneLimits, opts);
            let weiQty = this.normQty(qty, isQtyBase);
            let [lowerBound, upperBound] = yield this.transformLimits(yield saneLimits);
            const calldata = (yield this.makeEncoder()).encodeMintConc(range[0], range[1], yield weiQty, isQtyBase, lowerBound, upperBound, this.maskSurplusFlag(opts));
            return this.sendCmd(calldata, { value: yield msgVal });
        });
    }
    maskSurplusFlag(opts) {
        if (!opts || opts.surplus === undefined) {
            return this.maskSurplusFlag({ surplus: false });
        }
        return (0, flags_1.encodeSurplusArg)(opts.surplus, this.useTrueBase);
    }
    msgValAmbient(qty, isQtyBase, limits, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let ethQty = isQtyBase ? qty :
                this.ethForAmbientQuote(qty, limits);
            return this.ethToAttach(yield ethQty, opts);
        });
    }
    msgValRange(qty, isQtyBase, range, limits, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let ethQty = isQtyBase ? qty :
                this.ethForRangeQuote(qty, range, limits);
            return this.ethToAttach(yield ethQty, opts);
        });
    }
    ethToAttach(neededQty, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.baseToken.tokenAddr !== ethers_1.ZeroAddress) {
                return BigInt(0);
            }
            const ethQty = yield this.normEth(neededQty);
            let useSurplus = (0, flags_1.decodeSurplusFlag)(this.maskSurplusFlag(opts))[0];
            if (useSurplus) {
                return new tokens_1.CrocEthView(this.context).msgValOverSurplus(ethQty);
            }
            else {
                return ethQty;
            }
        });
    }
    ethForAmbientQuote(quoteQty, limits) {
        return __awaiter(this, void 0, void 0, function* () {
            const weiEth = this.calcEthInQuote(quoteQty, limits);
            return (0, utils_1.toDisplayQty)(yield weiEth, yield this.baseDecimals);
        });
    }
    calcEthInQuote(quoteQty, limits, precAdj = 1.001) {
        return __awaiter(this, void 0, void 0, function* () {
            const weiQty = yield this.normQty(quoteQty, false);
            const [, boundPrice] = yield this.transformLimits(limits);
            return Math.round((0, utils_1.bigIntToFloat)(weiQty) * boundPrice * precAdj);
        });
    }
    ethForRangeQuote(quoteQty, range, limits) {
        return __awaiter(this, void 0, void 0, function* () {
            const spotPrice = yield this.spotPrice();
            const [lowerPrice, upperPrice] = this.rangeToPrice(range);
            let skew = (0, utils_1.concDepositSkew)(spotPrice, lowerPrice, upperPrice);
            let ambiQty = this.calcEthInQuote(quoteQty, limits);
            let concQty = ambiQty.then(aq => Math.ceil(aq * skew));
            return (0, utils_1.toDisplayQty)(yield concQty, yield this.baseDecimals);
        });
    }
    normEth(ethQty) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.normQty(ethQty, true); // ETH is always on base side
        });
    }
    normQty(qty, isBase) {
        return __awaiter(this, void 0, void 0, function* () {
            let token = isBase ? this.baseToken : this.quoteToken;
            return token.normQty(qty);
        });
    }
    makeEncoder() {
        return __awaiter(this, void 0, void 0, function* () {
            return new liquidity_1.WarmPathEncoder(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, (yield this.context).chain.poolIndex);
        });
    }
}
exports.CrocPoolView = CrocPoolView;
