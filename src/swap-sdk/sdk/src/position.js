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
exports.CrocPositionView = void 0;
const tokens_1 = require("./tokens");
class CrocPositionView {
    constructor(base, quote, owner, context) {
        [this.baseToken, this.quoteToken] =
            (0, tokens_1.sortBaseQuoteViews)(base, quote);
        this.owner = owner;
        this.context = context;
    }
    queryRangePos(lowerTick, upperTick, block) {
        return __awaiter(this, void 0, void 0, function* () {
            let blockArg = toCallArg(block);
            let context = yield this.context;
            return context.query.queryRangePosition(this.owner, this.baseToken.tokenAddr, this.quoteToken.tokenAddr, context.chain.poolIndex, lowerTick, upperTick, blockArg);
        });
    }
    queryAmbient(block) {
        return __awaiter(this, void 0, void 0, function* () {
            let blockArg = toCallArg(block);
            let context = yield this.context;
            return context.query.queryAmbientPosition(this.owner, this.baseToken.tokenAddr, this.quoteToken.tokenAddr, context.chain.poolIndex, blockArg);
        });
    }
    queryAmbientPos(block) {
        return __awaiter(this, void 0, void 0, function* () {
            let blockArg = toCallArg(block);
            let context = yield this.context;
            return context.query.queryAmbientTokens(this.owner, this.baseToken.tokenAddr, this.quoteToken.tokenAddr, context.chain.poolIndex, blockArg);
        });
    }
    queryKnockoutLivePos(isBid, lowerTick, upperTick, block) {
        return __awaiter(this, void 0, void 0, function* () {
            let blockArg = toCallArg(block);
            let context = yield this.context;
            let pivotTick = isBid ? lowerTick : upperTick;
            const pivotTime = (yield context.query.queryKnockoutPivot(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, context.chain.poolIndex, isBid, pivotTick, blockArg)).pivot;
            return context.query.queryKnockoutTokens(this.owner, this.baseToken.tokenAddr, this.quoteToken.tokenAddr, context.chain.poolIndex, pivotTime, isBid, lowerTick, upperTick, blockArg);
        });
    }
    queryRewards(lowerTick, upperTick, block) {
        return __awaiter(this, void 0, void 0, function* () {
            let blockArg = toCallArg(block);
            let context = yield this.context;
            return (yield context.query.queryConcRewards(this.owner, this.baseToken.tokenAddr, this.quoteToken.tokenAddr, context.chain.poolIndex, lowerTick, upperTick, blockArg));
        });
    }
}
exports.CrocPositionView = CrocPositionView;
function toCallArg(block) {
    return block ? { blockTag: block } : {};
}
