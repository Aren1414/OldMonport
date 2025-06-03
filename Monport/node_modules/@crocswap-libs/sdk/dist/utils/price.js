"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeCrocPrice = encodeCrocPrice;
exports.decodeCrocPrice = decodeCrocPrice;
exports.toDisplayPrice = toDisplayPrice;
exports.fromDisplayPrice = fromDisplayPrice;
exports.pinTickLower = pinTickLower;
exports.priceHalfBelowTick = priceHalfBelowTick;
exports.pinTickUpper = pinTickUpper;
exports.pinTickOutside = pinTickOutside;
exports.neighborTicks = neighborTicks;
exports.priceToTick = priceToTick;
exports.tickToPrice = tickToPrice;
exports.priceHalfAboveTick = priceHalfAboveTick;
exports.calcRangeTilt = calcRangeTilt;
const constants_1 = require("../constants");
function encodeCrocPrice(price) {
    let floatPrice = Math.sqrt(price) * 2 ** 64;
    let scale = BigInt(0);
    const PRECISION_BITS = 16;
    while (floatPrice > Number.MAX_SAFE_INTEGER) {
        floatPrice = floatPrice / 2 ** PRECISION_BITS;
        scale = scale + BigInt(PRECISION_BITS);
    }
    const pinPrice = Math.round(floatPrice);
    const bnSeed = BigInt(pinPrice);
    return bnSeed * (BigInt(2) ** scale);
}
function decodeCrocPrice(val) {
    const x = val < (Number.MAX_SAFE_INTEGER - 1)
        ? Number(val)
        : parseFloat(val.toString());
    const sq = x / 2 ** 64;
    return sq * sq;
}
function toDisplayPrice(price, baseDecimals, quoteDecimals, isInverted = false) {
    const scaled = Number(price) * Math.pow(10, Number(quoteDecimals) - Number(baseDecimals));
    return isInverted ? 1 / scaled : scaled;
}
function fromDisplayPrice(price, baseDecimals, quoteDecimals, isInverted = false) {
    const scaled = isInverted ? 1 / price : price;
    return scaled * Math.pow(10, baseDecimals - quoteDecimals);
}
function pinTickLower(price, nTicksGrid) {
    const priceInTicks = Math.log(price) / Math.log(1.0001);
    const tickGrid = Math.floor(priceInTicks / nTicksGrid) * nTicksGrid;
    const horizon = Math.floor(constants_1.MIN_TICK / nTicksGrid) * nTicksGrid;
    return Math.max(tickGrid, horizon);
}
function priceHalfBelowTick(tick, nTicksGrid) {
    const halfTickBelow = (tick - (.5 * nTicksGrid));
    return Math.pow(1.0001, halfTickBelow);
}
function pinTickUpper(price, nTicksGrid) {
    const priceInTicks = priceToTick(price);
    const tickGrid = Math.ceil(priceInTicks / nTicksGrid) * nTicksGrid;
    const horizon = Math.ceil(constants_1.MAX_TICK / nTicksGrid) * nTicksGrid;
    return Math.min(tickGrid, horizon);
}
/* Returns the closest on-grid tick tick that's to the outside of a given price
 * relative to a pool price. */
function pinTickOutside(price, poolPrice, nTicksGrid) {
    const priceInTicks = priceToTick(price);
    const poolInTicks = priceToTick(poolPrice);
    const [poolLower, poolUpper] = [pinTickLower(poolPrice, nTicksGrid), pinTickUpper(poolPrice, nTicksGrid)];
    if (priceInTicks < poolInTicks) {
        if (priceInTicks >= poolLower) {
            return { tick: poolLower - nTicksGrid, isTickBelow: true };
        }
        else {
            return { tick: pinTickLower(price, nTicksGrid), isTickBelow: true };
        }
    }
    else {
        if (priceInTicks <= poolUpper) {
            return { tick: poolUpper + nTicksGrid, isTickBelow: false };
        }
        else {
            return { tick: pinTickUpper(price, nTicksGrid), isTickBelow: false };
        }
    }
}
/* Returns the neighboring N on-grid ticks to a given price. Ticks will be
 * sorted from closest to furthers */
function neighborTicks(price, nTicksGrid, nNeighbors = 1) {
    const priceInTicks = pinTickLower(price, nTicksGrid);
    return {
        below: Array.from({ length: nNeighbors }).
            map((_, idx) => priceInTicks - idx * nTicksGrid),
        above: Array.from({ length: nNeighbors }).
            map((_, idx) => priceInTicks + (idx + 1) * nTicksGrid)
    };
}
function priceToTick(price) {
    return Math.floor(Math.log(price) / Math.log(1.0001));
}
function tickToPrice(tick) {
    return Math.pow(1.0001, tick);
}
function priceHalfAboveTick(tick, nTicksGrid) {
    const halfTickAbove = (tick + (.5 * nTicksGrid));
    return Math.pow(1.0001, halfTickAbove);
}
/* Returns the ratio of quote to base tokens necessary to support the collateral for a given
 * range order over the specified ticks. If no quote token collateral is required returns 0
 * if no base token collateral is required returns Infinity */
function calcRangeTilt(mktPrice, lowerTick, upperTick) {
    const lowerPrice = tickToPrice(lowerTick);
    const upperPrice = tickToPrice(upperTick);
    if (mktPrice > upperPrice) {
        return Infinity;
    }
    else if (mktPrice < lowerPrice) {
        return 0;
    }
    else {
        const basePartial = Math.sqrt(lowerPrice / mktPrice);
        const quotePartial = Math.sqrt(mktPrice / upperPrice);
        return quotePartial / basePartial;
    }
}
//# sourceMappingURL=price.js.map