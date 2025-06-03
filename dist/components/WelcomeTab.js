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
import { useState, useEffect } from "react";
import { Contract, BrowserProvider, parseUnits } from "ethers";
import welcomeAbi from "../abis/WelcomeNFT.json";
import "../styles/App.css";
const WELCOME_CONTRACT_ADDRESS = "0x40649af9dEE8bDB94Dc21BA2175AE8f5181f14AE";
const NFT_PRICE = 0.3; // in MON
const VIDEO_URL = "https://zxmqva22v53mlvaeypxc7nyw7ucxf5dat53l2ngf2umq6kiftn3a.arweave.net/zdkKg1qvdsXUBMPuL7cW_QVy9GCfdr00xdUZDykFm3Y";
const WelcomeTab = () => {
    const [selectedAmount, setSelectedAmount] = useState(1);
    const [walletAddress, setWalletAddress] = useState("");
    const connectWallet = () => __awaiter(void 0, void 0, void 0, function* () {
        if (window.ethereum) {
            const accounts = yield window.ethereum.request({ method: "eth_requestAccounts" });
            setWalletAddress(accounts[0]);
        }
    });
    const mintNFT = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!walletAddress)
            return alert("Connect wallet first.");
        try {
            const provider = new BrowserProvider(window.ethereum); //
            const signer = yield provider.getSigner();
            const contract = new Contract(WELCOME_CONTRACT_ADDRESS, welcomeAbi, signer); //
            const value = parseUnits((NFT_PRICE * selectedAmount).toString(), 18); //
            const tx = yield contract.mint(selectedAmount, { value });
            yield tx.wait();
            alert("Mint successful!");
        }
        catch (error) {
            console.error(error);
            alert("Mint failed.");
        }
    });
    useEffect(() => {
        connectWallet();
    }, []);
    return (_jsxs("div", { className: "tab welcome-tab", children: [_jsx("h2", { children: "Welcome to MonPort" }), _jsx("p", { children: "Mint your commemorative NFT celebrating Monad & Farcaster" }), _jsxs("video", { width: "100%", controls: true, autoPlay: true, loop: true, muted: true, style: { borderRadius: "12px" }, children: [_jsx("source", { src: VIDEO_URL, type: "video/mp4" }), "Your browser does not support the video tag."] }), _jsx("div", { className: "mint-options", children: [1, 5, 10].map((amt) => (_jsx("button", { onClick: () => setSelectedAmount(amt), className: selectedAmount === amt ? "active" : "", children: amt }, amt))) }), _jsxs("button", { className: "mint-btn", onClick: mintNFT, children: ["Mint (", selectedAmount, " NFT)"] }), _jsx("button", { className: "share-btn", children: "Share to Warpcast" }), _jsx("button", { className: "follow-btn", children: "Follow @overo.eth +200 points" }), _jsxs("div", { className: "points-info", children: [_jsx("h4", { children: "Earn Points:" }), _jsxs("ul", { children: [_jsx("li", { children: "+50 points for each Welcome NFT mint" }), _jsx("li", { children: "+200 points for following @overo.eth" }), _jsx("li", { children: "+30 points per successful referral (first-time mint only)" })] })] })] }));
};
export default WelcomeTab;
