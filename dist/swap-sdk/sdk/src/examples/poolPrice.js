"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mainnetTokens_1 = require("../constants/mainnetTokens");
const croc_1 = require("../croc");
async function demo() {
    const croc = new croc_1.CrocEnv("mainnet");
    const spotPrice = await croc.pool(mainnetTokens_1.ETH, mainnetTokens_1.USDC).spotPrice();
    console.log(`ETH/USDC Spot Price: ${spotPrice.toString()}`);
    const displayPrice = await croc.poolEthQuote(mainnetTokens_1.USDC).displayPrice();
    console.log(`ETH/USDC Price: ${displayPrice}`);
    const invDispPrice = await croc.poolEth(mainnetTokens_1.USDC).displayPrice();
    console.log(`USDC/ETH Price: ${invDispPrice}`);
}
demo();
