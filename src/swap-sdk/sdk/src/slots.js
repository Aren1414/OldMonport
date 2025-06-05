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
exports.CrocSlotReader = void 0;
class CrocSlotReader {
    constructor(context) {
        this.provider = context.then(p => p.provider);
        this.dex = context.then(c => c.dex.getAddress());
    }
    isHotPathOpen() {
        return __awaiter(this, void 0, void 0, function* () {
            const STATE_SLOT = 0;
            const HOT_OPEN_OFFSET = 22;
            const hotShiftBits = BigInt(8 * (32 - HOT_OPEN_OFFSET));
            const slot = yield this.readSlot(STATE_SLOT);
            const slotVal = BigInt(slot);
            return (slotVal << hotShiftBits) >> BigInt(255) > BigInt(0);
        });
    }
    readSlot(slot) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.provider).getStorage(yield this.dex, slot);
        });
    }
    proxyContract(proxyIdx) {
        return __awaiter(this, void 0, void 0, function* () {
            const PROXY_SLOT_OFFSET = 1;
            const slotVal = yield this.readSlot(PROXY_SLOT_OFFSET + proxyIdx);
            return "0x" + slotVal.slice(26);
        });
    }
}
exports.CrocSlotReader = CrocSlotReader;
