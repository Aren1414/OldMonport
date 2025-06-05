"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureChain = exports.lookupChain = exports.connectCroc = void 0;
const ethers_1 = require("ethers");
const abis_1 = require("./abis");
const erc20_read_1 = require("./abis/erc20.read");
const impact_1 = require("./abis/impact");
const constants_1 = require("./constants");
async function connectCroc(providerOrChainId, signer) {
    const [provider, maybeSigner] = await buildProvider(providerOrChainId, signer);
    return setupProvider(provider, maybeSigner);
}
exports.connectCroc = connectCroc;
async function buildProvider(arg, signer) {
    if (typeof arg === "number" || typeof arg == "string") {
        const context = lookupChain(arg);
        return buildProvider(new ethers_1.JsonRpcProvider(context.nodeUrl), signer);
    }
    else if ("getNetwork" in arg) {
        return [arg, signer];
    }
    else {
        const chainId = Number((await arg.provider?.getNetwork())?.chainId);
        return buildProvider(chainId, signer);
    }
}
async function setupProvider(provider, signer) {
    const actor = await determineActor(provider, signer);
    const chainId = await getChain(provider);
    let cntx = inflateContracts(chainId, provider, actor);
    return await attachSenderAddr(cntx, actor);
}
async function attachSenderAddr(cntx, actor) {
    if ('getAddress' in actor) {
        try {
            cntx.senderAddr = await actor.getAddress();
        }
        catch (e) {
            console.warn("Failed to get signer address:", e);
        }
    }
    return cntx;
}
async function determineActor(provider, signer) {
    if (signer) {
        try {
            return signer.connect(provider);
        }
        catch {
            return signer;
        }
    }
    else if ("getSigner" in provider) {
        try {
            let signer = await (provider.getSigner());
            return signer;
        }
        catch {
            return provider;
        }
    }
    else {
        return provider;
    }
}
async function getChain(provider) {
    if ("chainId" in provider) {
        return provider.chainId;
    }
    else if ("getNetwork" in provider) {
        return provider.getNetwork().then((n) => Number(n.chainId));
    }
    else {
        throw new Error("Invalid provider");
    }
}
function inflateContracts(chainId, provider, actor, addr) {
    const context = lookupChain(chainId);
    return {
        provider: provider,
        actor: actor,
        dex: new ethers_1.Contract(context.addrs.dex, abis_1.CROC_ABI, actor),
        router: context.addrs.router ? new ethers_1.Contract(context.addrs.router || ethers_1.ZeroAddress, abis_1.CROC_ABI, actor) : undefined,
        routerBypass: context.addrs.routerBypass ? new ethers_1.Contract(context.addrs.routerBypass || ethers_1.ZeroAddress, abis_1.CROC_ABI, actor) : undefined,
        query: new ethers_1.Contract(context.addrs.query, abis_1.QUERY_ABI, provider),
        slipQuery: new ethers_1.Contract(context.addrs.impact, impact_1.IMPACT_ABI, provider),
        erc20Write: new ethers_1.Contract(ethers_1.ZeroAddress, abis_1.ERC20_ABI, actor),
        erc20Read: new ethers_1.Contract(ethers_1.ZeroAddress, erc20_read_1.ERC20_READ_ABI, provider),
        chain: context,
        senderAddr: addr
    };
}
function lookupChain(chainId) {
    if (typeof chainId === "number") {
        return lookupChain("0x" + chainId.toString(16));
    }
    else {
        const context = constants_1.CHAIN_SPECS[chainId.toLowerCase()];
        if (!context) {
            throw new Error("Unsupported chain ID: " + chainId);
        }
        return context;
    }
}
exports.lookupChain = lookupChain;
async function ensureChain(cntx) {
    const walletNetwork = await cntx.actor.provider?.getNetwork();
    if (!walletNetwork) {
        throw new Error('No network selected in the wallet');
    }
    const contextNetwork = cntx.chain;
    if (walletNetwork.chainId !== BigInt(contextNetwork.chainId)) {
        throw new Error(`Wrong chain selected in the wallet: expected ${contextNetwork.displayName} (${contextNetwork.chainId}) but got ${walletNetwork.name} (0x${Number(walletNetwork.chainId).toString(16)})`);
    }
}
exports.ensureChain = ensureChain;
