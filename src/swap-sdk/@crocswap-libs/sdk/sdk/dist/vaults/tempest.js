"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TempestVault = void 0;
const tslib_1 = require("tslib");
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
    depositZap(qty) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let owner = (yield this.context).actor.getAddress();
            let weiQty = this.token1.normQty(qty);
            let txArgs = {};
            if (this.token1.isNativeEth) {
                txArgs = { value: yield weiQty };
            }
            yield (0, context_1.ensureChain)(yield this.context);
            switch (this.strategy) {
                case 'symetricAmbient':
                    return (yield this.vaultWrite).deposit(yield weiQty, owner, ethers_1.Typed.bool(true), txArgs);
                case 'rswEth':
                    return (yield this.vaultWrite).deposit(yield weiQty, owner, ethers_1.Typed.bytes('0x'), txArgs);
            }
        });
    }
    /* @notice Sends a transaction to redeem shares in vault position back into token1
     * @param vaultTokenQty The quantity of vault tokens to withdraw
     * @param minToken1Qty The minimum quantity of token1 to receive */
    redeemZap(vaultQty, minToken1Qty) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let owner = (yield this.context).actor.getAddress();
            let weiQty = this.vaultToken.normQty(vaultQty);
            let minWeiQty = this.token1.normQty(minToken1Qty);
            yield (0, context_1.ensureChain)(yield this.context);
            switch (this.strategy) {
                case 'symetricAmbient':
                    return (yield this.vaultWrite).redeem(yield weiQty, owner, owner, ethers_1.Typed.uint256(yield minWeiQty), ethers_1.Typed.bool(true));
                case 'rswEth':
                    return (yield this.vaultWrite).redeem(yield weiQty, owner, owner, ethers_1.Typed.bytes('0x'));
            }
        });
    }
    /* @notice Retrieves the min deposit quantity in token1 for the Tempest vault */
    minDeposit() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.minDepositCache) {
                this.minDepositCache = (yield this.vaultRead).minimumDeposit();
            }
            return this.minDepositCache;
        });
    }
    /* @notice Queries the vault token balance of a wallet */
    balanceVault(wallet) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return this.vaultToken.wallet(wallet);
        });
    }
    /* @notice Queries the implied token1 balance based on the share to asset conversion. */
    balanceToken1(wallet) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let balance = yield this.balanceVault(wallet);
            if (balance === BigInt(0))
                return BigInt(0);
            return (yield this.vaultRead).convertToAssets(balance);
        });
    }
    /* @notice Returns the conversion rate between vault tokens and token1 collateral. */
    queryConversionRate() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let denom = 1000000;
            let numer = yield (yield this.vaultRead).convertToShares(denom);
            return denom / Number(numer);
        });
    }
    /* @notice Checks a wallet's token approval for the vault's token1. */
    allowance(wallet) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return this.token1.allowance(wallet, this.vaultAddr);
        });
    }
    /* @notice Sends transaction to approve token1 on the vault contract */
    approve(approveQty) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return this.token1.approveAddr(this.vaultAddr, approveQty);
        });
    }
}
exports.TempestVault = TempestVault;
//# sourceMappingURL=tempest.js.map