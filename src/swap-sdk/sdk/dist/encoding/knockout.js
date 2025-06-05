"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnockoutEncoder = void 0;
exports.packKnockoutLinks = packKnockoutLinks;
const ethers_1 = require("ethers");
class KnockoutEncoder {
    constructor(base, quote, poolIdx) {
        this.base = base;
        this.quote = quote;
        this.poolIdx = poolIdx;
        this.abiCoder = new ethers_1.ethers.AbiCoder();
    }
    encodeKnockoutMint(qty, lowerTick, upperTick, isBid, useSurplusFlags) {
        const MINT_SUBCMD = 91;
        const suppArgs = this.abiCoder.encode(["uint128", "bool"], [qty, false]);
        return this.encodeCommonArgs(MINT_SUBCMD, lowerTick, upperTick, isBid, useSurplusFlags, suppArgs);
    }
    encodeKnockoutBurnQty(qty, lowerTick, upperTick, isBid, useSurplusFlags) {
        const BURN_SUBCMD = 92;
        const suppArgs = this.abiCoder.encode(["uint128", "bool", "bool"], [qty, false, false]);
        return this.encodeCommonArgs(BURN_SUBCMD, lowerTick, upperTick, isBid, useSurplusFlags, suppArgs);
    }
    encodeKnockoutBurnLiq(liq, lowerTick, upperTick, isBid, useSurplusFlags) {
        const BURN_SUBCMD = 92;
        const suppArgs = this.abiCoder.encode(["uint128", "bool", "bool"], [liq, true, true]);
        return this.encodeCommonArgs(BURN_SUBCMD, lowerTick, upperTick, isBid, useSurplusFlags, suppArgs);
    }
    encodeKnockoutRecover(pivotTime, lowerTick, upperTick, isBid, useSurplusFlags) {
        const BURN_SUBCMD = 94;
        const suppArgs = this.abiCoder.encode(["uint32"], [pivotTime]);
        return this.encodeCommonArgs(BURN_SUBCMD, lowerTick, upperTick, isBid, useSurplusFlags, suppArgs);
    }
    encodeCommonArgs(subcmd, lowerTick, upperTick, isBid, useSurplusFlags, suppArgs) {
        return this.abiCoder.encode(KNOCKOUT_ARG_TYPES, [subcmd, this.base, this.quote, this.poolIdx,
            lowerTick, upperTick, isBid,
            useSurplusFlags, suppArgs]);
    }
}
exports.KnockoutEncoder = KnockoutEncoder;
/* Packs a list of knockout cross events into a 256-bit array that can be passed directly
 * as a Merkle proof to the Croc knockout claim function.
 *
 *
 *
 * @remarks These values should be taken directly from the CrocKnockoutCross
 *          event log. For an example see
 *   https://etherscan.io/tx/0x022b1f3792b98a54c761c0a79268dbcb6e5f1a2a9f7494bab743f722957e7219#eventlog
 *
 * @param crosses The list of knockout cross events *only* at the given tick since the knockout
 *                order was minted. Input can be in any order.
 * @returns The 256-bit array for the knockout proof.
 */
function packKnockoutLinks(crosses, merkleRoot) {
    let steps = [];
    for (let i = 0; i < crosses.length - 1; i++) {
        const link = packKnockoutLink(crosses[i].pivotTime, crosses[i].feeMileage, crosses[i + 1].commitEntropy);
        steps.push(link);
    }
    return { root: merkleRoot, steps: steps };
}
/* Creates a single entry for an entry in a knockout proof.
 *
 * @param pivotTime The time of the pivot (from the event log).
 * @param mileage The mileage at the knockout cross (from the event log).
 * @param commitEntropy The random commit entropy (from the event log).
 * @returns The 256-bit array entry for the knockout proof.
 */
function packKnockoutLink(pivotTime, mileage, commitEntropy) {
    // Converted BigInt code
    const packed = (BigInt(pivotTime) << BigInt(64)) + BigInt(mileage);
    return (commitEntropy << BigInt(96)) + BigInt(packed);
}
const KNOCKOUT_ARG_TYPES = [
    "uint8", // Type call
    "address", // Base
    "address", // Quote
    "uint24", // Pool Index
    "int24", // Lower Tick
    "int24", // Upper Tick
    "bool", // isBid
    "uint8", // reserve flags
    "bytes", // subcmd args
];
//# sourceMappingURL=knockout.js.map