import { useState } from "react";
import { medicines } from "./data/medicines";
import "./styles.css";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [offline, setOffline] = useState(false);
  const [code, setCode] = useState("MED-001");
  const [batch, setBatch] = useState("B1001");
  const [result, setResult] = useState(null);

  const goHome = () => {
    setScreen("home");
    setResult(null);
  };

  const verifyMedicine = (nextCode = code, nextBatch = batch) => {
    const cleanCode = nextCode.trim().toUpperCase();
    const cleanBatch = nextBatch.trim().toUpperCase();

    setScreen("checking");

    setTimeout(() => {
      const product = medicines[cleanCode];

      if (offline && cleanCode !== "MED-001") {
        setResult({
          status: "NOT_COVERED",
          product: null,
        });
      } else if (!product || product.coverageStatus !== "ENROLLED") {
        setResult({
          status: "NOT_COVERED",
          product: product || null,
        });
      } else if (cleanBatch && cleanBatch !== product.batch) {
        setResult({
          status: "NO_MATCH",
          product,
        });
      } else {
        setResult({
          status: "MATCH",
          product,
        });
      }

      setScreen("result");
    }, 700);
  };

  return (
    <div className="app-shell">
      {screen === "home" && (
        <main className="home-screen">
          <div className="connection-row">
            <div className={`online-status ${offline ? "offline" : ""}`}>
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

          <section className="logo-area">
            <img
              src={`${import.meta.env.BASE_URL}medauth-logo.png`}
              alt="MedAuth"
              className="main-logo"
            />
          </section>

          <section className="main-actions">
            <button
              className="scan-button"
              onClick={() => setScreen("scan")}
            >
              Scan Medicine
            </button>

            <button
              className="code-button"
              onClick={() => setScreen("manual")}
            >
              Enter Code Instead
            </button>
          </section>

          <div className="login-section">
            <button
              className="login-button"
              onClick={() => setScreen("login")}
            >
              Log In
            </button>
          </div>
        </main>
      )}

      {screen === "scan" && (
        <main className="inner-screen">
          <button className="back-button" onClick={goHome}>
            ← Back
          </button>

          <img
            src={`${import.meta.env.BASE_URL}medauth-logo.png`}
            alt="MedAuth"
            className="small-logo"
          />

          <h1>Scan Medicine</h1>

          <p className="description">
            Position the medicine code inside the scanner.
          </p>

          <div className="scanner-box">
            <span className="corner tl"></span>
            <span className="corner tr"></span>
            <span className="corner bl"></span>
            <span className="corner br"></span>
            <span className="scan-line"></span>
          </div>

          <button
            className="scan-button"
            onClick={() => verifyMedicine("MED-001", "B1001")}
          >
            Simulate Scan
          </button>

          <button
            className="code-button lower-button"
            onClick={() => setScreen("manual")}
          >
            Enter Code Instead
          </button>
        </main>
      )}

      {screen === "manual" && (
        <main className="inner-screen">
          <button className="back-button" onClick={goHome}>
            ← Back
          </button>

          <img
            src={`${import.meta.env.BASE_URL}medauth-logo.png`}
            alt="MedAuth"
            className="small-logo"
          />

          <h1>Enter Medicine Code</h1>

          <label className="field">
            Product Code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>

          <label className="field">
            Batch
            <input
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
            />
          </label>

          <button
            className="scan-button"
            onClick={() => verifyMedicine()}
          >
            Verify Medicine
          </button>
        </main>
      )}

      {screen === "checking" && (
        <main className="inner-screen center-screen">
          <img
            src={`${import.meta.env.BASE_URL}medauth-logo.png`}
            alt="MedAuth"
            className="small-logo"
          />

          <div className="loader"></div>

          <h1>Checking Medicine</h1>
          <p className="description">Verifying medicine information...</p>
        </main>
      )}

      {screen === "result" && result && (
        <main className="inner-screen">
          <img
            src={`${import.meta.env.BASE_URL}medauth-logo.png`}
            alt="MedAuth"
            className="small-logo"
          />

          <div className={`result-card ${result.status.toLowerCase()}`}>
            <div className="result-icon">
              {result.status === "MATCH"
                ? "✓"
                : result.status === "NO_MATCH"
                ? "!"
                : "?"}
            </div>

            <h1>
              {result.status === "MATCH"
                ? "Match"
                : result.status === "NO_MATCH"
                ? "No Match"
                : "Unable to Verify"}
            </h1>

            <p>
              {result.status === "MATCH" &&
                "The medicine code and batch match the MedAuth record."}

              {result.status === "NO_MATCH" &&
                "The medicine was found, but the batch does not match the registered record."}

              {result.status === "NOT_COVERED" &&
                "This medicine is not currently covered by MedAuth. This does not mean it is counterfeit."}
            </p>
          </div>

          <button className="scan-button" onClick={goHome}>
            Scan Another Medicine
          </button>
        </main>
      )}

      {screen === "login" && (
        <main className="inner-screen">
          <button className="back-button" onClick={goHome}>
            ← Back
          </button>

          <img
            src={`${import.meta.env.BASE_URL}medauth-logo.png`}
            alt="MedAuth"
            className="login-logo"
          />

          <h1>Log In</h1>

          <label className="field">
            Email
            <input
              type="email"
              placeholder="Email address"
            />
          </label>

          <label className="field">
            Password
            <input
              type="password"
              placeholder="Password"
            />
          </label>

          <button
            className="scan-button"
            onClick={() => setScreen("dashboard")}
          >
            Log In
          </button>
        </main>
      )}

      {screen === "dashboard" && (
        <main className="inner-screen">
          <img
            src={`${import.meta.env.BASE_URL}medauth-logo.png`}
            alt="MedAuth"
            className="small-logo"
          />

          <h1>Dashboard</h1>

          <div className="dashboard-card">
            <span>Medicine Verification</span>
            <strong>Ready</strong>
          </div>

          <button
            className="scan-button"
            onClick={() => setScreen("scan")}
          >
            Scan Medicine
          </button>

          <button
            className="code-button lower-button"
            onClick={goHome}
          >
            Log Out
          </button>
        </main>
      )}
    </div>
  );
}
