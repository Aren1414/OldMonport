import React, { useState } from "react";
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
        return <WelcomeTab />;
      case "swap":
        return <SwapTab />;
      case "deploy":
        return <DeployTab />;
      case "profile":
        return <ProfileTab />;
      case "leaderboard":
        return <LeaderboardTab />;
      default:
        return <WelcomeTab />;
    }
  };

  return (
    <div className="app-container">
      <nav className="tab-navigation">
        <button onClick={() => setActiveTab("profile")}>Profile</button>
        <button onClick={() => setActiveTab("swap")}>Swap</button>
        <button onClick={() => setActiveTab("welcome")}>Welcome</button>
        <button onClick={() => setActiveTab("deploy")}>Deploy</button>
        <button onClick={() => setActiveTab("leaderboard")}>Leaderboard</button>
      </nav>

      <main className="tab-content">
        {renderTab()}
      </main>
    </div>
  );
};

export default App;
