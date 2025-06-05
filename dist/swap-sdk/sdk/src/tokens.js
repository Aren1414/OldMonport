"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortBaseQuoteViews = exports.CrocEthView = exports.CrocTokenView = void 0;
const ethers_1 = require("ethers");
const constants_1 = require("./constants");
const context_1 = require("./context");
const utils_1 = require("./utils");
const token_1 = require("./utils/token");
/* General top-level class for interacting with specific ERC20 tokens. Handles functionality for
 * approval, getting token balances both in wallet and on dex, and display/decimalization. */
class CrocTokenView {
    /* Creates a new CrocTokenView for specificied token address.
     *
     * @param context The CrocContext environment context. Specific to a given chain.
     * @param tokenAddr The address of the token contract. Use zero address for native ETH token. */
    constructor(context, tokenAddr) {
        this.context = context;
        this.tokenAddr = tokenAddr;
        this.isNativeEth = tokenAddr == ethers_1.ZeroAddress;
        if (this.isNativeEth) {
            this.decimals = Promise.resolve(18);
        }
        else {
            this.decimals = this.resolve().then(async (c) => c.decimals().then(Number));
        }
    }
    /* Sends a signed transaction to approve the CrocSwap contract for the ERC20 token contract.
     *
     * @param approveQty Optional arugment to specify the quantity to approve. Defaults to 2^120
     *                   if unspecified. */
    async approve(approveQty) {
        return this.approveAddr(await (await this.context).dex.getAddress(), approveQty);
    }
    async approveRouter(approveQty) {
        let router = (await this.context).router;
        return router && this.approveAddr(await router.getAddress(), approveQty);
    }
    async approveAddr(addr, approveQty) {
        if (this.isNativeEth) {
            return undefined;
        }
        const weiQty = approveQty !== undefined ? await this.normQty(approveQty) : ethers_1.MaxUint256;
        await (0, context_1.ensureChain)(await this.context);
        // We want to hardcode the gas limit, so we can manually pad it from the estimated
        // transaction. The default value is low gas calldata, but Metamask and other wallets
        // will often ask users to change the approval amount. Without the padding, approval
        // transactions can run out of gas.
        const gasEst = (await this.resolveWrite()).approve.estimateGas(addr, weiQty);
        return (await this.resolveWrite()).approve(addr, weiQty, { gasLimit: (await gasEst) + BigInt(15000), chainId: ((await this.context).chain).chainId });
    }
    async approveBypassRouter() {
        let router = (await this.context).router;
        if (!router) {
            return undefined;
        }
        let abiCoder = new ethers_1.ethers.AbiCoder();
        const MANY_CALLS = 1000000000;
        const HOT_PROXY_IDX = 1;
        const COLD_PROXY_IDX = 3;
        const cmd = abiCoder.encode(["uint8", "address", "uint32", "uint16[]"], [72, router.address, MANY_CALLS, [HOT_PROXY_IDX]]);
        await (0, context_1.ensureChain)(await this.context);
        return (await this.context).dex.userCmd(COLD_PROXY_IDX, cmd, { chainId: ((await this.context).chain).chainId });
    }
    async wallet(address, block = "latest") {
        if (this.isNativeEth) {
            return (await this.context).provider.getBalance(address, block);
        }
        else {
            return (await this.resolve()).balanceOf(address, { blockTag: block });
        }
    }
    async walletDisplay(address, block = "latest") {
        const balance = this.wallet(address, block);
        return (0, token_1.toDisplayQty)(await balance, await this.decimals);
    }
    async balance(address, block = "latest") {
        return (await this.context).query.querySurplus(address, this.tokenAddr, { blockTag: block });
    }
    async balanceDisplay(address, block = "latest") {
        const balance = this.balance(address, block);
        return (0, token_1.toDisplayQty)(await balance, await this.decimals);
    }
    async allowance(address, spender) {
        if (this.isNativeEth) {
            return constants_1.MAX_LIQ;
        }
        return (await this.resolve()).allowance(address, spender ? spender : await (await this.context).dex.getAddress());
    }
    async roundQty(qty) {
        if (typeof qty === "number" || typeof qty === "string") {
            return this.normQty(this.truncFraction(qty, await this.decimals));
        }
        else {
            return qty;
        }
    }
    truncFraction(qty, decimals) {
        if (typeof (qty) === "number") {
            const exp = Math.pow(10, decimals);
            return Math.floor(qty * exp) / exp;
        }
        else {
            return this.truncFraction(parseFloat(qty), decimals);
        }
    }
    async normQty(qty) {
        if (typeof qty === "number" || typeof qty === "string") {
            return (0, token_1.fromDisplayQty)(qty.toString(), await this.decimals);
        }
        else {
            return qty;
        }
    }
    async toDisplay(qty) {
        if (typeof qty === "number" || typeof qty === "string") {
            return qty.toString();
        }
        else {
            return (0, token_1.toDisplayQty)(qty, await this.decimals);
        }
    }
    async resolve() {
        return (await this.context).erc20Read.attach(this.tokenAddr);
    }
    async resolveWrite() {
        return (await this.context).erc20Write.attach(this.tokenAddr);
    }
    async deposit(qty, recv) {
        return this.surplusOp(73, qty, recv, this.isNativeEth);
    }
    async withdraw(qty, recv) {
        return this.surplusOp(74, qty, recv);
    }
    async transfer(qty, recv) {
        return this.surplusOp(75, qty, recv);
    }
    async surplusOp(subCode, qty, recv, useMsgVal = false) {
        const abiCoder = new ethers_1.ethers.AbiCoder();
        const weiQty = this.normQty(qty);
        const cmd = abiCoder.encode(["uint8", "address", "uint128", "address"], [subCode, recv, await weiQty, this.tokenAddr]);
        const txArgs = useMsgVal ? { value: await weiQty } : {};
        let cntx = await this.context;
        await (0, context_1.ensureChain)(cntx);
        const gasEst = await cntx.dex.userCmd.estimateGas(cntx.chain.proxyPaths.cold, cmd, txArgs);
        Object.assign(txArgs, { gasLimit: gasEst + utils_1.GAS_PADDING, chainId: cntx.chain.chainId });
        return cntx.dex.userCmd(cntx.chain.proxyPaths.cold, cmd, txArgs);
    }
}
exports.CrocTokenView = CrocTokenView;
class CrocEthView extends CrocTokenView {
    constructor(context) {
        super(context, ethers_1.ZeroAddress);
    }
    /* Returns the amount needed to attach to msg.value when spending
     * ETH from surplus collateral. (I.e. the difference between the
     * two, or 0 if surplus collateral is sufficient) */
    async msgValOverSurplus(ethNeeded) {
        const sender = (await this.context).senderAddr;
        if (!sender) {
            console.warn("No sender address known, returning 0");
            return BigInt(0);
        }
        const ethView = new CrocTokenView(this.context, ethers_1.ZeroAddress);
        const surpBal = await ethView.balance(sender);
        const hasEnough = surpBal > ethNeeded;
        return hasEnough ? BigInt(0) :
            ethNeeded - surpBal;
    }
}
exports.CrocEthView = CrocEthView;
function sortBaseQuoteViews(tokenA, tokenB) {
    return tokenA.tokenAddr.toLowerCase() < tokenB.tokenAddr.toLowerCase() ?
        [tokenA, tokenB] : [tokenB, tokenA];
}
exports.sortBaseQuoteViews = sortBaseQuoteViews;
