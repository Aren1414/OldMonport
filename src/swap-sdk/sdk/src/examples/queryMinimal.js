"use strict";
/* Example script to make a query call to CrocQuery contract with
 * minimal syntactic sugar from the SDK, to make clear what's going on. */
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
const ethers_1 = require("ethers");
const abis_1 = require("../abis");
const constants_1 = require("../constants");
// Goerli network addresses
const ETH = ethers_1.ethers.ZeroAddress;
const USDC = "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C";
// CrocQuery adddress
const QUERY_CONTRACT_ADDR = "0x93a4baFDd49dB0e06f3F3f9FddC1A67792F47518";
// Standard pool type index on Goerli
const POOL_IDX = 36000;
// Goerli RPC endpoint
const rpc = constants_1.CHAIN_SPECS["0x5"].nodeUrl;
function queryContract() {
    return __awaiter(this, void 0, void 0, function* () {
        const provider = new ethers_1.ethers.JsonRpcProvider(rpc);
        const query = new ethers_1.Contract(QUERY_CONTRACT_ADDR, abis_1.QUERY_ABI, provider);
        // Note this is the on-chain representation, not the display price
        const chainPrice = yield query.queryPrice(ETH, USDC, POOL_IDX);
        console.log("On chain pool price is ", chainPrice.toString());
    });
}
queryContract();
