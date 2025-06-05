"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mainnetTokens_1 = require("../constants/mainnetTokens");
const croc_1 = require("../croc");
function demo() {
    return __awaiter(this, void 0, void 0, function* () {
        const croc = new croc_1.CrocEnv("mainnet");
        const spotPrice = yield croc.pool(mainnetTokens_1.ETH, mainnetTokens_1.USDC).spotPrice();
        console.log(`ETH/USDC Spot Price: ${spotPrice.toString()}`);
        const displayPrice = yield croc.poolEthQuote(mainnetTokens_1.USDC).displayPrice();
        console.log(`ETH/USDC Price: ${displayPrice}`);
        const invDispPrice = yield croc.poolEth(mainnetTokens_1.USDC).displayPrice();
        console.log(`USDC/ETH Price: ${invDispPrice}`);
    });
}
demo();
