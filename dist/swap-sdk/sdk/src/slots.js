"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrocSlotReader = void 0;
class CrocSlotReader {
    constructor(context) {
        this.provider = context.then(p => p.provider);
        this.dex = context.then(c => c.dex.getAddress());
    }
    async isHotPathOpen() {
        const STATE_SLOT = 0;
        const HOT_OPEN_OFFSET = 22;
        const hotShiftBits = BigInt(8 * (32 - HOT_OPEN_OFFSET));
        const slot = await this.readSlot(STATE_SLOT);
        const slotVal = BigInt(slot);
        return (slotVal << hotShiftBits) >> BigInt(255) > BigInt(0);
    }
    async readSlot(slot) {
        return (await this.provider).getStorage(await this.dex, slot);
    }
    async proxyContract(proxyIdx) {
        const PROXY_SLOT_OFFSET = 1;
        const slotVal = await this.readSlot(PROXY_SLOT_OFFSET + proxyIdx);
        return "0x" + slotVal.slice(26);
    }
}
exports.CrocSlotReader = CrocSlotReader;
