"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TempestVault = void 0;
const ethers_1 = require("ethers");
const TempestVaultAbi_1 = require("../abis/external/TempestVaultAbi");
const context_1 = require("../context");
/* @notice Class for interacting with a specific Tempest pair vault. */
class TempestVault {
    constructor(vaultToken, token1, strategy, context) {
        this.vaultAddr = vaultToken.tokenAddr;
        this.token1 = token1;
        this.vaultToken = vaultToken;
        this.strategy = strategy;
        this.vaultWrite = context.then(c => new ethers_1.Contract(this.vaultAddr, TempestVaultAbi_1.TEMPEST_VAULT_ABI, c.actor));
        this.vaultRead = context.then(c => new ethers_1.Contract(this.vaultAddr, TempestVaultAbi_1.TEMPEST_VAULT_ABI, c.provider));
        this.context = context;
    }
    /* @notice Sends a transaction to zap and deposit token1 into the vault
     * @param qty The quantity of token1 to deposit */
    async depositZap(qty) {
        let owner = (await this.context).actor.getAddress();
        let weiQty = this.token1.normQty(qty);
        let txArgs = {};
        if (this.token1.isNativeEth) {
            txArgs = { value: await weiQty };
        }
        await (0, context_1.ensureChain)(await this.context);
        switch (this.strategy) {
            case 'symetricAmbient':
                return (await this.vaultWrite).deposit(await weiQty, owner, ethers_1.Typed.bool(true), txArgs);
            case 'rswEth':
                return (await this.vaultWrite).deposit(await weiQty, owner, ethers_1.Typed.bytes('0x'), txArgs);
        }
    }
    /* @notice Sends a transaction to redeem shares in vault position back into token1
     * @param vaultTokenQty The quantity of vault tokens to withdraw
     * @param minToken1Qty The minimum quantity of token1 to receive */
    async redeemZap(vaultQty, minToken1Qty) {
        let owner = (await this.context).actor.getAddress();
        let weiQty = this.vaultToken.normQty(vaultQty);
        let minWeiQty = this.token1.normQty(minToken1Qty);
        await (0, context_1.ensureChain)(await this.context);
        switch (this.strategy) {
            case 'symetricAmbient':
                return (await this.vaultWrite).redeem(await weiQty, owner, owner, ethers_1.Typed.uint256(await minWeiQty), ethers_1.Typed.bool(true));
            case 'rswEth':
                return (await this.vaultWrite).redeem(await weiQty, owner, owner, ethers_1.Typed.bytes('0x'));
        }
    }
    /* @notice Retrieves the min deposit quantity in token1 for the Tempest vault */
    async minDeposit() {
        if (!this.minDepositCache) {
            this.minDepositCache = (await this.vaultRead).minimumDeposit();
        }
        return this.minDepositCache;
    }
    /* @notice Queries the vault token balance of a wallet */
    async balanceVault(wallet) {
        return this.vaultToken.wallet(wallet);
    }
    /* @notice Queries the implied token1 balance based on the share to asset conversion. */
    async balanceToken1(wallet) {
        let balance = await this.balanceVault(wallet);
        if (balance === BigInt(0))
            return BigInt(0);
        return (await this.vaultRead).convertToAssets(balance);
    }
    /* @notice Returns the conversion rate between vault tokens and token1 collateral. */
    async queryConversionRate() {
        let denom = 1000000;
        let numer = await (await this.vaultRead).convertToShares(denom);
        return denom / Number(numer);
    }
    /* @notice Checks a wallet's token approval for the vault's token1. */
    async allowance(wallet) {
        return this.token1.allowance(wallet, this.vaultAddr);
    }
    /* @notice Sends transaction to approve token1 on the vault contract */
    async approve(approveQty) {
        return this.token1.approveAddr(this.vaultAddr, approveQty);
    }
}
exports.TempestVault = TempestVault;
