import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import WelcomeTab from "./components/WelcomeTab";
import SwapTab from "./components/SwapTab";
import DeployTab from "./components/DeployTab";
import ProfileTab from "./components/ProfileTab";
import LeaderboardTab from "./components/LeaderboardTab";
import "./styles/App.css";
const App = () => {
    const [activeTab, setActiveTab] = useState("welcome");
    const renderTab = () => {
        switch (activeTab) {
            case "welcome":
                return _jsx(WelcomeTab, {});
            case "swap":
                return _jsx(SwapTab, {});
            case "deploy":
                return _jsx(DeployTab, {});
            case "profile":
                return _jsx(ProfileTab, {});
            case "leaderboard":
                return _jsx(LeaderboardTab, {});
            default:
                return _jsx(WelcomeTab, {});
        }
    };
    return (_jsxs("div", { className: "app-container", children: [_jsx("main", { className: "tab-content", children: renderTab() }), _jsxs("nav", { className: "tab-navigation", children: [_jsx("button", { onClick: () => setActiveTab("profile"), children: "Profile" }), _jsx("button", { onClick: () => setActiveTab("swap"), children: "Swap" }), _jsx("button", { onClick: () => setActiveTab("welcome"), children: "Welcome" }), _jsx("button", { onClick: () => setActiveTab("deploy"), children: "Deploy" }), _jsx("button", { onClick: () => setActiveTab("leaderboard"), children: "Leaderboard" })] })] }));
};
export default App;
