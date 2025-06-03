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
import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, formatEther } from "ethers";
import { getFarcasterProfile } from "../utils/farcaster";
import "../styles/App.css";
const ProfileTab = () => {
    const [walletAddress, setWalletAddress] = useState("");
    const [balance, setBalance] = useState("0");
    const [referrals, setReferrals] = useState(0);
    const [points, setPoints] = useState(0);
    const [userData, setUserData] = useState(null);
    const connectWallet = useCallback(() => __awaiter(void 0, void 0, void 0, function* () {
        if (window.ethereum) {
            try {
                const provider = new BrowserProvider(window.ethereum); //
                const accounts = yield window.ethereum.request({ method: "eth_requestAccounts" });
                setWalletAddress(accounts[0] || "");
            }
            catch (err) {
                console.error("Failed to connect wallet:", err);
            }
        }
    }), []);
    const fetchBalance = useCallback(() => __awaiter(void 0, void 0, void 0, function* () {
        if (!walletAddress)
            return;
        try {
            const provider = new BrowserProvider(window.ethereum);
            const balanceRaw = yield provider.getBalance(walletAddress);
            setBalance(formatEther(balanceRaw)); //
        }
        catch (e) {
            console.error("Balance fetch error:", e);
        }
    }), [walletAddress]);
    const fetchUserData = useCallback(() => __awaiter(void 0, void 0, void 0, function* () {
        if (!walletAddress)
            return;
        try {
            const profile = yield getFarcasterProfile(walletAddress);
            setUserData(profile || null);
            setReferrals((profile === null || profile === void 0 ? void 0 : profile.referrals) || 0);
            setPoints((profile === null || profile === void 0 ? void 0 : profile.points) || 0);
        }
        catch (e) {
            console.error("Error fetching Farcaster profile:", e);
        }
    }), [walletAddress]);
    useEffect(() => {
        connectWallet();
    }, [connectWallet]);
    useEffect(() => {
        if (walletAddress) {
            fetchBalance();
            fetchUserData();
        }
    }, [walletAddress, fetchBalance, fetchUserData]);
    return (_jsxs("div", { className: "tab profile-tab", children: [_jsx("h2", { children: "Your Profile" }), userData ? (_jsxs("div", { className: "farcaster-info", children: [_jsx("img", { src: userData.avatar || "/default-avatar.png", alt: "avatar", className: "avatar" }), _jsxs("h3", { children: ["@", userData.username] })] })) : (_jsx("p", { children: "No profile data available." })), _jsxs("p", { children: [_jsx("strong", { children: "Wallet:" }), " ", walletAddress] }), _jsxs("p", { children: [_jsx("strong", { children: "Balance:" }), " ", balance, " MON"] }), _jsxs("p", { children: [_jsx("strong", { children: "Referrals:" }), " ", referrals] }), _jsxs("p", { children: [_jsx("strong", { children: "Total Points:" }), " ", points] })] }));
};
export default ProfileTab;
