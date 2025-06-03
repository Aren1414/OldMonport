var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Contract, formatUnits, parseUnits, BrowserProvider } from "ethers";
import erc20Abi from "../abis/ERC20.json";
import TokenSelector from "./TokenSelector";
import { connectWallet, switchToMonadTestnet } from "../utils/wallet";
import "../styles/App.css";
import { getSpotPrice, swapTokens } from "../sdk";
const MONAD_TESTNET_TOKEN = {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "MON",
    decimals: 18,
};
const testnetTokenAddresses = [
    MONAD_TESTNET_TOKEN.address,
    "0xb2f82D0f38dc453D596Ad40A37799446Cc89274A",
    "0xE0590015A873bF326bd645c3E1266d4db41C4E6B",
];
const routerAddress = "0x3108E20b0Da8b267DaA13f538964940C6eBaCCB2";
export default function SwapTab() {
    const [wallet, setWallet] = useState(null);
    const [walletAddress, setWalletAddress] = useState(null);
    const [tokens, setTokens] = useState([]);
    const [balances, setBalances] = useState({});
    const [fromToken, setFromToken] = useState(null);
    const [toToken, setToToken] = useState(null);
    const [fromAmount, setFromAmount] = useState("");
    const [toAmount, setToAmount] = useState("");
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        init();
    }, []);
    function init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield switchToMonadTestnet(); // 
            const signer = yield connectWallet();
            if (!signer)
                return;
            setWallet(signer);
            try {
                const address = yield signer.getAddress();
                setWalletAddress(address);
            }
            catch (_a) {
                setWalletAddress(null);
            }
            const loadedTokens = yield Promise.all(testnetTokenAddresses.map((addr) => __awaiter(this, void 0, void 0, function* () {
                if (addr === MONAD_TESTNET_TOKEN.address)
                    return MONAD_TESTNET_TOKEN;
                try {
                    const contract = new Contract(addr, erc20Abi, signer);
                    const symbol = yield contract.symbol();
                    const decimals = yield contract.decimals();
                    return { address: addr, symbol, decimals };
                }
                catch (e) {
                    console.error(`Error loading token ${addr}:`, e);
                    return { address: addr, symbol: "UNKNOWN", decimals: 18 };
                }
            })));
            setTokens(loadedTokens.filter(Boolean));
            const balanceData = {};
            for (const token of loadedTokens.filter(Boolean)) {
                balanceData[token.address] = yield getTokenBalance(token);
            }
            setBalances(balanceData);
            setFromToken(loadedTokens[0] || null);
            setToToken(loadedTokens[1] || null);
        });
    }
    function getTokenBalance(token) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!wallet || !walletAddress || !token)
                return "0";
            const provider = new BrowserProvider(window.ethereum);
            if (token.address === MONAD_TESTNET_TOKEN.address) {
                const balance = yield provider.getBalance(walletAddress);
                return formatUnits(balance, 18);
            }
            const contract = new Contract(token.address, erc20Abi, wallet);
            const balance = yield contract.balanceOf(walletAddress);
            return formatUnits(balance, token.decimals);
        });
    }
    // 
    function fetchSpotPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!fromToken || !toToken)
                return;
            const price = yield getSpotPrice(fromToken.symbol, toToken.symbol);
            console.log("Spot Price:", price);
            setToAmount(price * parseFloat(fromAmount));
        });
    }
    // 
    function handleSwap() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!wallet || !fromToken || !toToken || !fromAmount)
                return;
            setLoading(true);
            try {
                const result = yield swapTokens(wallet, fromToken.address, toToken.address, parseUnits(fromAmount, fromToken.decimals));
                console.log("Swap Result:", result);
            }
            catch (error) {
                console.error("Swap failed:", error);
            }
            setLoading(false);
        });
    }
    return (_jsxs("div", { className: "swap-tab", children: [_jsx("h2", { children: "Swap Tokens on Monad Testnet" }), _jsxs("div", { className: "swap-field", children: [_jsx(TokenSelector, { label: "From", tokens: tokens, selected: fromToken, onChange: setFromToken, amount: fromAmount, onAmountChange: setFromAmount, wallet: wallet, balances: balances }), _jsx("input", { type: "number", placeholder: "Enter amount", value: fromAmount, onChange: (e) => setFromAmount(e.target.value), className: "amount-input" })] }), _jsx("div", { className: "swap-switch", children: _jsx("button", { onClick: () => { setFromToken(toToken); setToToken(fromToken); }, children: "\u21C5" }) }), _jsxs("div", { className: "swap-field", children: [_jsx(TokenSelector, { label: "To", tokens: tokens, selected: toToken, onChange: setToToken, amount: toAmount, wallet: wallet, balances: balances }), _jsx("input", { type: "text", placeholder: "Estimated output", value: toAmount, disabled: true, className: "amount-display" })] }), _jsx("button", { className: "swap-button", onClick: fetchSpotPrice, children: "Get Spot Price" }), _jsx("button", { className: "swap-button", onClick: handleSwap, disabled: loading, children: loading ? "Swapping..." : "Swap" })] }));
}
