import { useState } from "react";
import "./styles.css";

export default function App() {
  const [offline, setOffline] = useState(false);

  return (
    <main className="app">
      {/* STATUS BAR */}
      <div className="status-bar">
        <span className="time">9:41</span>

        <div className="phone-status">
          <span>▮▮▮</span>
          <span>⌁</span>
          <span>100%</span>
          <span className="battery"></span>
        </div>
      </div>

      {/* ONLINE / OFFLINE */}
      <div className="connection-row">
        <div
          className={`online-status ${
            offline ? "offline-status" : ""
          }`}
        >
          <span className="status-dot"></span>
          {offline ? "Offline" : "Online"}
        </div>

        <label className="offline-toggle">
          <input
            type="checkbox"
            checked={offline}
            onChange={(e) => setOffline(e.target.checked)}
          />
          <span>Offline</span>
        </label>
      </div>

      {/* LOGO */}
      <section className="logo-section">
        <img
          src={`${import.meta.env.BASE_URL}medauth-logo.png`}
          alt="MedAuth"
          className="main-logo"
        />
      </section>

      {/* SCANNER */}
      <section className="scanner-area">
        <div className="scan-corner top-left"></div>
        <div className="scan-corner top-right"></div>
        <div className="scan-corner bottom-left"></div>
        <div className="scan-corner bottom-right"></div>

        <div className="scan-line"></div>
      </section>

      {/* FLASHLIGHT */}
      <button
        type="button"
        className="flash-button"
        aria-label="Flashlight"
      >
        <span className="flash-icon">♢</span>
      </button>

      {/* LOGIN */}
      <div className="bottom-login">
        <button type="button" className="login-button">
          Log In
        </button>
      </div>
    </main>
  );
}
