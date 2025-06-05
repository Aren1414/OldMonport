"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const utils_1 = require("../utils");
const token_1 = require("../utils/token");
(0, vitest_1.describe)("Utility Functions Tests", () => {
    (0, vitest_1.it)("1 is 1?", () => {
        (0, vitest_1.expect)(1).toBe(1);
    });
    (0, vitest_1.it)("scaleQty integer as string", () => {
        const scaledQty = (0, token_1.fromDisplayQty)("1", 18).toString();
        (0, vitest_1.expect)(scaledQty).toBe("1000000000000000000");
    });
    (0, vitest_1.it)("scaledQty float as string", () => {
        const scaledQty = (0, token_1.fromDisplayQty)(".1", 18).toString();
        (0, vitest_1.expect)(scaledQty).toBe("100000000000000000");
    });
    // it("throws error on scaledQty longer than decimals", () => {
    //   expect(() => {
    //     fromDisplayQty("1.1234567", 6);
    //   }).toThrowError();
    // });
    (0, vitest_1.it)("unscaleQty integer as string", () => {
        const unscaledQty = (0, token_1.toDisplayQty)("100", 2).toString();
        (0, vitest_1.expect)(unscaledQty).toBe("1.0");
    });
    (0, vitest_1.it)("throws error on unscaleQty float as string", () => {
        (0, vitest_1.expect)(() => {
            (0, token_1.toDisplayQty)("100.1", 2).toString();
        }).toThrowError();
    });
    (0, vitest_1.it)("to display price", () => {
        (0, vitest_1.expect)((0, utils_1.toDisplayPrice)(1500, 18, 18, false)).toBeCloseTo(1500, 0.0001);
        (0, vitest_1.expect)((0, utils_1.toDisplayPrice)(2000, 18, 18, true)).toBeCloseTo(0.0005, 0.0001);
        (0, vitest_1.expect)((0, utils_1.toDisplayPrice)(20, 6, 10, false)).toBeCloseTo(200000, 0.0001);
        (0, vitest_1.expect)((0, utils_1.toDisplayPrice)(20, 6, 10, true)).toBeCloseTo(0.000005, 0.0001);
    });
    (0, vitest_1.it)("from display price", () => {
        (0, vitest_1.expect)((0, utils_1.fromDisplayPrice)((0, utils_1.toDisplayPrice)(1500, 18, 18, false), 18, 18, false)).toBeCloseTo(1500, 0.0001);
        (0, vitest_1.expect)((0, utils_1.fromDisplayPrice)((0, utils_1.toDisplayPrice)(2000, 18, 18, true), 18, 18, true)).toBeCloseTo(2000, 0.0001);
        (0, vitest_1.expect)((0, utils_1.fromDisplayPrice)((0, utils_1.toDisplayPrice)(20, 10, 6, false), 10, 6, false)).toBeCloseTo(20, 0.0001);
        (0, vitest_1.expect)((0, utils_1.fromDisplayPrice)((0, utils_1.toDisplayPrice)(20, 10, 6, true), 10, 6, true)).toBeCloseTo(20, 0.0001);
    });
    (0, vitest_1.it)("pin tick upper", () => {
        (0, vitest_1.expect)((0, utils_1.pinTickUpper)(5943, 50)).toBe(86950);
        (0, vitest_1.expect)((0, utils_1.pinTickUpper)(0.042, 50)).toBe(-31700);
    });
    (0, vitest_1.it)("pin tick lower", () => {
        (0, vitest_1.expect)((0, utils_1.pinTickLower)(5943, 50)).toBe(86900);
        (0, vitest_1.expect)((0, utils_1.pinTickLower)(0.042, 50)).toBe(-31750);
    });
    (0, vitest_1.it)("range collateral tilt", () => {
        (0, vitest_1.expect)((0, utils_1.calcRangeTilt)(0.9, -5000, -3000)).toBe(Infinity);
        (0, vitest_1.expect)((0, utils_1.calcRangeTilt)(0.9, 3000, 5000)).toBe(0);
        (0, vitest_1.expect)((0, utils_1.calcRangeTilt)(0.9, -5000, 5000)).toBe(0.9);
    });
    (0, vitest_1.it)("base conc factor", () => {
        (0, vitest_1.expect)((0, utils_1.baseConcFactor)(25.0, 9.0, 100.0)).toBe(2.5);
        (0, vitest_1.expect)((0, utils_1.baseConcFactor)(1.0, 9.0, 100.0)).toBe(Infinity);
        (0, vitest_1.expect)((0, utils_1.baseConcFactor)(400.0, 9.0, 100.0)).toBe(1 / 0.35);
    });
    (0, vitest_1.it)("quote conc factor", () => {
        (0, vitest_1.expect)((0, utils_1.quoteConcFactor)(25.0, 9.0, 64.0)).toBe(1 / 0.375);
        (0, vitest_1.expect)((0, utils_1.quoteConcFactor)(1.0, 16.0, 100.0)).toBe(1 / 0.15);
        (0, vitest_1.expect)((0, utils_1.quoteConcFactor)(400.0, 9.0, 100.0)).toBe(Infinity);
    });
    (0, vitest_1.it)("conc deposit skew", () => {
        (0, vitest_1.expect)((0, utils_1.concDepositSkew)(25.0, 9.0, 100.0)).toBe(0.8);
        (0, vitest_1.expect)((0, utils_1.concDepositSkew)(1.0, 16.0, 100.0)).toBe(0);
        (0, vitest_1.expect)((0, utils_1.concDepositSkew)(400.0, 9.0, 100.0)).toBe(Infinity);
    });
    // it("liquidity quote tokens", () => {
    //   expect(liquidityForQuoteQty(0.01 ** 2, BigInt(10000))).toBe(100);
    //   expect(liquidityForQuoteQty(0.01075 ** 2, BigInt(9998))).toBe(107);
    // });
    // it("liquidity base tokens", () => {
    //   expect(liquidityForBaseQty(0.01 ** 2, BigInt(50))).toBe(5000);
    //   expect(liquidityForBaseQty(109 ** 2, BigInt(9999))).toBe(91);
    // });
    // it("truncate right bits", () => {
    //   expect(truncateRightBits(BigInt(48024845023), 10)).toBe(48024844288);
    // });
});
