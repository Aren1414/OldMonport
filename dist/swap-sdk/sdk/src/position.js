"use strict";
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
    async queryRangePos(lowerTick, upperTick, block) {
        let blockArg = toCallArg(block);
        let context = await this.context;
        return context.query.queryRangePosition(this.owner, this.baseToken.tokenAddr, this.quoteToken.tokenAddr, context.chain.poolIndex, lowerTick, upperTick, blockArg);
    }
    async queryAmbient(block) {
        let blockArg = toCallArg(block);
        let context = await this.context;
        return context.query.queryAmbientPosition(this.owner, this.baseToken.tokenAddr, this.quoteToken.tokenAddr, context.chain.poolIndex, blockArg);
    }
    async queryAmbientPos(block) {
        let blockArg = toCallArg(block);
        let context = await this.context;
        return context.query.queryAmbientTokens(this.owner, this.baseToken.tokenAddr, this.quoteToken.tokenAddr, context.chain.poolIndex, blockArg);
    }
    async queryKnockoutLivePos(isBid, lowerTick, upperTick, block) {
        let blockArg = toCallArg(block);
        let context = await this.context;
        let pivotTick = isBid ? lowerTick : upperTick;
        const pivotTime = (await context.query.queryKnockoutPivot(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, context.chain.poolIndex, isBid, pivotTick, blockArg)).pivot;
        return context.query.queryKnockoutTokens(this.owner, this.baseToken.tokenAddr, this.quoteToken.tokenAddr, context.chain.poolIndex, pivotTime, isBid, lowerTick, upperTick, blockArg);
    }
    async queryRewards(lowerTick, upperTick, block) {
        let blockArg = toCallArg(block);
        let context = await this.context;
        return (await context.query.queryConcRewards(this.owner, this.baseToken.tokenAddr, this.quoteToken.tokenAddr, context.chain.poolIndex, lowerTick, upperTick, blockArg));
    }
}
exports.CrocPositionView = CrocPositionView;
function toCallArg(block) {
    return block ? { blockTag: block } : {};
}
