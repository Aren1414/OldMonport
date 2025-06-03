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
import { getLeaderboardData, getFarcasterProfile } from "../utils/farcaster";
import "../styles/App.css";
const LeaderboardTab = () => {
    const [userAddress, setUserAddress] = useState("");
    const [userProfile, setUserProfile] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const connectWallet = useCallback(() => __awaiter(void 0, void 0, void 0, function* () {
        if (window.ethereum) {
            const accounts = yield window.ethereum.request({ method: "eth_requestAccounts" });
            setUserAddress(accounts[0]);
        }
    }), []);
    const loadLeaderboard = useCallback(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const data = yield getLeaderboardData();
            setLeaderboard(data);
        }
        catch (e) {
            console.error("Failed to load leaderboard", e);
        }
    }), []);
    const loadUserProfile = useCallback(() => __awaiter(void 0, void 0, void 0, function* () {
        if (!userAddress)
            return;
        const profile = yield getFarcasterProfile(userAddress);
        setUserProfile(profile);
    }), [userAddress]);
    useEffect(() => {
        connectWallet();
    }, [connectWallet]);
    useEffect(() => {
        if (userAddress) {
            loadUserProfile();
            loadLeaderboard();
        }
    }, [userAddress, loadUserProfile, loadLeaderboard]);
    return (_jsxs("div", { className: "tab leaderboard-tab", children: [_jsx("h2", { children: "Leaderboard" }), userProfile && (_jsxs("div", { className: "user-rank", children: [_jsx("img", { src: userProfile.avatar, alt: "avatar", className: "avatar" }), _jsxs("h3", { children: ["@", userProfile.username] }), _jsxs("p", { children: ["Points: ", userProfile.points] })] })), _jsx("div", { className: "leaderboard-list", children: leaderboard.slice(0, 200).map((user, index) => (_jsxs("div", { className: "leaderboard-item", children: [_jsxs("span", { className: "rank", children: ["#", index + 1] }), _jsx("img", { src: user.avatar, alt: "avatar", className: "avatar" }), _jsxs("span", { className: "username", children: ["@", user.username] }), _jsxs("span", { className: "points", children: [user.points, " pts"] })] }, user.address))) })] }));
};
export default LeaderboardTab;
