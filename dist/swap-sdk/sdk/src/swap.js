"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrocSwapPlan = void 0;
const ethers_1 = require("ethers");
const constants_1 = require("./constants");
const context_1 = require("./context");
const flags_1 = require("./encoding/flags");
const pool_1 = require("./pool");
const slots_1 = require("./slots");
const tokens_1 = require("./tokens");
const utils_1 = require("./utils");
class CrocSwapPlan {
    constructor(sellToken, buyToken, qty, qtyIsBuy, context, opts = DFLT_SWAP_ARGS) {
        [this.baseToken, this.quoteToken] = (0, tokens_1.sortBaseQuoteViews)(sellToken, buyToken);
        this.sellBase = (this.baseToken === sellToken);
        this.qtyInBase = (this.sellBase !== qtyIsBuy);
        this.poolView = new pool_1.CrocPoolView(this.baseToken, this.quoteToken, context);
        const tokenView = this.qtyInBase ? this.baseToken : this.quoteToken;
        this.qty = tokenView.normQty(qty);
        this.slippage = opts.slippage || DFLT_SWAP_ARGS.slippage;
        this.priceSlippage = this.slippage * PRICE_SLIP_MULT;
        this.context = context;
        this.impact = this.calcImpact();
        this.callType = "";
    }
    async swap(args = {}) {
        await (0, context_1.ensureChain)(await this.context);
        const gasEst = await this.estimateGas(args);
        const callArgs = Object.assign({ gasEst: gasEst, chainId: (await this.context).chain.chainId }, args);
        return this.sendTx(Object.assign({}, args, callArgs));
    }
    async simulate(args = {}) {
        const gasEst = await this.estimateGas(args);
        const callArgs = Object.assign({ gasEst: gasEst }, args);
        return this.callStatic(Object.assign({}, args, callArgs));
    }
    async sendTx(args) {
        return this.hotPathCall(await this.txBase(), 'send', args);
    }
    async callStatic(args) {
        return this.hotPathCall(await this.txBase(), 'staticCall', args);
    }
    async estimateGas(args = {}) {
        return this.hotPathCall(await this.txBase(), 'estimateGas', args);
    }
    async txBase() {
        if (this.callType === "router") {
            let router = (await this.context).router;
            if (!router) {
                throw new Error("Router not available on network");
            }
            return router;
        }
        else if (this.callType === "bypass" && (await this.context).routerBypass) {
            let router = (await this.context).routerBypass;
            if (!router) {
                throw new Error("Router not available on network");
            }
            return router || (await this.context).dex;
        }
        else {
            return (await this.context).dex;
        }
    }
    async hotPathCall(contract, callType, args) {
        const reader = new slots_1.CrocSlotReader(this.context);
        if (this.callType === "router") {
            return this.swapCall(contract, callType, args);
        }
        else if (this.callType === "bypass") {
            return this.swapCall(contract, callType, args);
        }
        else if (this.callType === "proxy" || (await this.context).chain.proxyPaths.dfltColdSwap) {
            return this.userCmdCall(contract, callType, args);
        }
        else {
            return await reader.isHotPathOpen() ?
                this.swapCall(contract, callType, args) : this.userCmdCall(contract, callType, args);
        }
    }
    async swapCall(contract, callType, args) {
        const TIP = 0;
        const surplusFlags = this.maskSurplusArgs(args);
        return contract.swap[callType](this.baseToken.tokenAddr, this.quoteToken.tokenAddr, (await this.context).chain.poolIndex, this.sellBase, this.qtyInBase, await this.qty, TIP, await this.calcLimitPrice(), await this.calcSlipQty(), surplusFlags, await this.buildTxArgs(surplusFlags, args.gasEst));
    }
    async userCmdCall(contract, callType, args) {
        const TIP = 0;
        const surplusFlags = this.maskSurplusArgs(args);
        const HOT_PROXY_IDX = 1;
        let abi = new ethers_1.ethers.AbiCoder();
        let cmd = abi.encode(["address", "address", "uint256", "bool", "bool", "uint128", "uint16", "uint128", "uint128", "uint8"], [this.baseToken.tokenAddr, this.quoteToken.tokenAddr, (await this.context).chain.poolIndex,
            this.sellBase, this.qtyInBase, await this.qty, TIP,
            await this.calcLimitPrice(), await this.calcSlipQty(), surplusFlags]);
        return contract.userCmd[callType](HOT_PROXY_IDX, cmd, await this.buildTxArgs(surplusFlags, args.gasEst));
    }
    /**
     * Utility function to generate a "signed" raw transaction for a swap, used for L1 gas estimation on L2's like Scroll.
     * Extra 0xFF...F is appended to the unsigned raw transaction to simulate the signature and other missing fields.
     *
     * Note: This function is only intended for L1 gas estimation, and does not generate valid signed transactions.
     */
    async getFauxRawTx(args = {}) {
        const TIP = 0;
        const surplusFlags = this.maskSurplusArgs(args);
        const unsignedTx = await (await this.context).dex.swap.populateTransaction(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, (await this.context).chain.poolIndex, this.sellBase, this.qtyInBase, await this.qty, TIP, await this.calcLimitPrice(), await this.calcSlipQty(), surplusFlags, await this.buildTxArgs(surplusFlags));
        // append 160 'f's to the end of the raw transaction to simulate the signature and other missing fields
        return (0, utils_1.getUnsignedRawTransaction)(unsignedTx) + "f".repeat(160);
    }
    async calcImpact() {
        const TIP = 0;
        const limitPrice = this.sellBase ? constants_1.MAX_SQRT_PRICE : constants_1.MIN_SQRT_PRICE;
        const impact = await (await this.context).slipQuery.calcImpact.staticCall(this.baseToken.tokenAddr, this.quoteToken.tokenAddr, (await this.context).chain.poolIndex, this.sellBase, this.qtyInBase, await this.qty, TIP, limitPrice);
        if ((impact[0] > 0 && impact[1] > 0) || (impact[0] < 0 && impact[1] < 0))
            throw new Error("Invalid impact: base and quote flows have matching signs");
        const baseQty = this.baseToken.toDisplay(impact[0] < 0 ? -impact[0] : impact[0]);
        const quoteQty = this.quoteToken.toDisplay(impact[1] < 0 ? -impact[1] : impact[1]);
        const spotPrice = (0, utils_1.decodeCrocPrice)(impact[2]);
        const startPrice = this.poolView.displayPrice();
        const finalPrice = this.poolView.toDisplayPrice(spotPrice);
        const ret = {
            sellQty: this.sellBase ? await baseQty : await quoteQty,
            buyQty: this.sellBase ? await quoteQty : await baseQty,
            finalPrice: await finalPrice,
            percentChange: (await finalPrice - await startPrice) / await startPrice
        };
        return ret;
    }
    maskSurplusArgs(args) {
        return (0, flags_1.encodeSurplusArg)(this.maskSurplusFlags(args));
    }
    maskSurplusFlags(args) {
        if (!args || !args.settlement) {
            return [false, false];
        }
        else if (typeof args.settlement === "boolean") {
            return [args.settlement, args.settlement];
        }
        else {
            return this.sellBase ?
                [args.settlement.sellDexSurplus, args.settlement.buyDexSurplus] :
                [args.settlement.buyDexSurplus, args.settlement.sellDexSurplus];
        }
    }
    async buildTxArgs(surplusArg, gasEst) {
        const txArgs = await this.attachEthMsg(surplusArg);
        if (gasEst) {
            Object.assign(txArgs, { gasLimit: gasEst + utils_1.GAS_PADDING });
        }
        return txArgs;
    }
    async attachEthMsg(surplusEncoded) {
        // Only need msg.val if one token is native ETH (will always be base side)
        if (!this.sellBase || this.baseToken.tokenAddr !== ethers_1.ZeroAddress) {
            return {};
        }
        // Calculate the maximum amount of ETH we'll need. If on the floating side
        // account for potential slippage. (Contract will refund unused ETH)
        const val = this.qtyInBase ? this.qty : this.calcSlipQty();
        if ((0, flags_1.decodeSurplusFlag)(surplusEncoded)[0]) {
            // If using surplus calculate the amount of ETH not covered by the surplus
            // collateral.
            const needed = new tokens_1.CrocEthView(this.context).msgValOverSurplus(await val);
            return { value: await needed };
        }
        else {
            // Othwerise we need to send the entire balance in msg.val
            return { value: await val };
        }
    }
    async calcSlipQty() {
        const qtyIsBuy = (this.sellBase === this.qtyInBase);
        const slipQty = !qtyIsBuy ?
            parseFloat((await this.impact).sellQty) * (1 + this.slippage) :
            parseFloat((await this.impact).buyQty) * (1 - this.slippage);
        return !this.qtyInBase ?
            this.baseToken.roundQty(slipQty) :
            this.quoteToken.roundQty(slipQty);
    }
    async calcLimitPrice() {
        return this.sellBase ? constants_1.MAX_SQRT_PRICE : constants_1.MIN_SQRT_PRICE;
    }
    forceProxy() {
        this.callType = "proxy";
        return this;
    }
    useRouter() {
        this.callType = "router";
        return this;
    }
    useBypass() {
        this.callType = "bypass";
        return this;
    }
}
exports.CrocSwapPlan = CrocSwapPlan;
// Price slippage limit multiplies normal slippage tolerance by amount that should
// be reasonable (300%)
const PRICE_SLIP_MULT = 3.0;
// Default slippage is set to 1%. User should evaluate this carefully for low liquidity
// pools of when swapping large amounts.
const DFLT_SWAP_ARGS = {
    slippage: 0.01
};
