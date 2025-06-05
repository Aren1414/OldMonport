"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const vitest_1 = require("vitest");
const token_1 = require("../utils/token");
(0, vitest_1.describe)("Token Address Utility Functions", () => {
    (0, vitest_1.it)("getQuoteTokenAddress returns correct address when ETH compared with Dai on Kovan", () => {
        const daiKovanAddress = "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa";
        const quoteAddress = (0, token_1.getQuoteTokenAddress)(ethers_1.ZeroAddress, daiKovanAddress);
        (0, vitest_1.expect)(quoteAddress).toBe(daiKovanAddress);
    });
    (0, vitest_1.it)("getBaseTokenAddress returns correct address when ETH compared with Dai on Kovan", () => {
        const daiKovanAddress = "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa";
        const baseAddress = (0, token_1.getBaseTokenAddress)(ethers_1.ZeroAddress, daiKovanAddress);
        (0, vitest_1.expect)(baseAddress).toBe(ethers_1.ZeroAddress);
    });
    (0, vitest_1.it)("sortBaseQuoteTokens returns correct address array when ETH compared with Dai on Kovan when already correctly sorted", () => {
        const daiKovanAddress = "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa";
        const addressArray = (0, token_1.sortBaseQuoteTokens)(ethers_1.ZeroAddress, daiKovanAddress);
        (0, vitest_1.expect)(addressArray).toStrictEqual([ethers_1.ZeroAddress, daiKovanAddress]);
    });
    (0, vitest_1.it)("sortBaseQuoteTokens returns correct address array when ETH compared with Dai on Kovan when NOT already correctly sorted", () => {
        const daiKovanAddress = "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa";
        const addressArray = (0, token_1.sortBaseQuoteTokens)(daiKovanAddress, ethers_1.ZeroAddress);
        (0, vitest_1.expect)(addressArray).toStrictEqual([ethers_1.ZeroAddress, daiKovanAddress]);
    });
});
