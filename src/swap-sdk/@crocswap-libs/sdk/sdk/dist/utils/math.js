"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFixedNumber = toFixedNumber;
exports.bigIntToFloat = bigIntToFloat;
exports.floatToBigInt = floatToBigInt;
exports.truncateRightBits = truncateRightBits;
exports.fromFixedGrowth = fromFixedGrowth;
function toFixedNumber(num, digits, base) {
    const pow = Math.pow(base || 10, digits);
    return Math.round(num * pow) / pow;
}
function bigIntToFloat(val) {
    return val < BigInt(Number.MAX_SAFE_INTEGER - 1)
        ? Number(val)
        : parseFloat(val.toString());
}
function floatToBigInt(x) {
    let floatPrice = x;
    let scale = 0;
    const PRECISION_BITS = 16;
    while (floatPrice > Number.MAX_SAFE_INTEGER) {
        floatPrice = floatPrice / (2 ** PRECISION_BITS);
        scale = scale + PRECISION_BITS;
    }
    const pinPrice = Math.round(floatPrice);
    const mult = BigInt(2) ** BigInt(scale);
    return BigInt(pinPrice) * mult;
}
function truncateRightBits(x, bits) {
    const mult = BigInt(2) ** BigInt(bits);
    return x / mult * mult;
}
function fromFixedGrowth(x) {
    return 1 + bigIntToFloat(x) / (2 ** 48);
}
//# sourceMappingURL=math.js.map