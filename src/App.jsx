import { useState } from "react";
import { medicines } from "./data/medicines";
import "./styles.css";

export default function App() {
  const [screen, setScreen] = useState("scanner");
  const [offline, setOffline] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [result, setResult] = useState(null);
  const [code, setCode] = useState("MED-001");
  const [batch, setBatch] = useState("B1001");

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
    }, 800);
  };

  const resetHome = () => {
    setScreen("scanner");
    setResult(null);
    setCode("MED-001");
    setBatch("B1001");
  };

  return (
    <div className="app-shell">
      {screen === "scanner" && (
        <main className="scanner-screen">
          {/* TOP */}
          <div className="connection-row">
            <div
              className={`connection-status ${
                offline ? "is-offline" : ""
              }`}
            >
              <span className="connection-dot" />
              {offline ? "Offline" : "Online"}
            </div>

            <label className="offline-control">
              <input
                type="checkbox"
                checked={offline}
                onChange={(e) => setOffline(e.target.checked)}
              />
              <span>Offline</span>
            </label>
          </div>

          {/* LOGO */}
          <div className="logo-area">
            <img
              src={`${import.meta.env.BASE_URL}medauth-logo.png`}
              alt="MedAuth"
              className="main-logo"
            />
          </div>

          {/* SCANNER */}
          <button
            type="button"
            className="scanner-box"
            onClick={() => verifyMedicine("MED-001", "B1001")}
            aria-label="Scan medicine"
          >
            <span className="corner corner-tl" />
            <span className="corner corner-tr" />
            <span className="corner corner-bl" />
            <span className="corner corner-br" />

            <span className="scanner-line" />

            <span className="scan-help">
              Tap to scan medicine
            </span>
          </button>

          {/* FLASH */}
          <button
            type="button"
            className={`flash-button ${flashOn ? "active" : ""}`}
            onClick={() => setFlashOn(!flashOn)}
            aria-label="Toggle flashlight"
          >
            <span className="flash-shape">⌑</span>
          </button>

          {/* MANUAL OPTION */}
          <button
            type="button"
            className="manual-link"
            onClick={() => setScreen("manual")}
          >
            Enter Code Instead
          </button>

          {/* LOGIN */}
          <div className="login-footer">
            <button
              type="button"
              className="login-link"
              onClick={() => setScreen("login")}
            >
              Log In
            </button>
          </div>
        </main>
      )}

      {/* MANUAL ENTRY */}
      {screen === "manual" && (
        <main className="content-screen">
          <button className="back-button" onClick={resetHome}>
            ← Back
          </button>

          <div className="small-brand">
            <img
              src={`${import.meta.env.BASE_URL}medauth-logo.png`}
              alt="MedAuth"
            />
          </div>

          <h1>Enter medicine code</h1>
          <p className="screen-description">
            Enter the medicine identifier and batch number.
          </p>

          <label className="field">
            Product code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="MED-001"
            />
          </label>

          <label className="field">
            Batch
            <input
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              placeholder="B1001"
            />
          </label>

          <button
            className="primary-button"
            onClick={() => verifyMedicine()}
          >
            Verify Medicine
          </button>

          <div className="demo-options">
            <p>Demo codes</p>

            <button
              onClick={() => {
                setCode("MED-001");
                setBatch("B1001");
              }}
            >
              MED-001 / B1001 — Match
            </button>

            <button
              onClick={() => {
                setCode("MED-002");
                setBatch("B2045");
              }}
            >
              MED-002 / B2045 — No Match
            </button>

            <button
              onClick={() => {
                setCode("MED-003");
                setBatch("B9912");
              }}
            >
              MED-003 — Unable to Verify
            </button>
          </div>
        </main>
      )}

      {/* CHECKING */}
      {screen === "checking" && (
        <main className="content-screen center-screen">
          <img
            src={`${import.meta.env.BASE_URL}medauth-logo.png`}
            alt="MedAuth"
            className="checking-logo"
          />

          <div className="loader" />

          <h1>Checking medicine</h1>

          <p>
            Reading identifier and checking medicine record…
          </p>
        </main>
      )}

      {/* RESULT */}
      {screen === "result" && result && (
        <main className="content-screen">
          <div className="small-brand">
            <img
              src={`${import.meta.env.BASE_URL}medauth-logo.png`}
              alt="MedAuth"
            />
          </div>

          {result.status === "MATCH" && (
            <div className="result-card match">
              <div className="result-icon">✓</div>
              <h1>Match</h1>
              <p>
                The medicine code and batch match the
                MedAuth record.
              </p>
            </div>
          )}

          {result.status === "NO_MATCH" && (
            <div className="result-card warning">
              <div className="result-icon">!</div>
              <h1>No Match</h1>
              <p>
                The medicine was found, but the batch does
                not match the registered record.
              </p>
            </div>
          )}

          {result.status === "NOT_COVERED" && (
            <div className="result-card unknown">
              <div className="result-icon">?</div>
              <h1>Unable to Verify</h1>
              <p>
                This medicine is not currently covered by
                MedAuth. This does not mean it is counterfeit.
              </p>
            </div>
          )}

          {result.product && (
            <div className="medicine-info">
              <div>
                <span>Medicine</span>
                <strong>
                  {result.product.medicineName}
                </strong>
              </div>

              <div>
                <span>Manufacturer</span>
                <strong>
                  {result.product.manufacturer}
                </strong>
              </div>

              <div>
                <span>Batch</span>
                <strong>{batch}</strong>
              </div>
            </div>
          )}

          <button
            className="primary-button"
            onClick={resetHome}
          >
            Scan Another Medicine
          </button>
        </main>
      )}

      {/* LOGIN */}
      {screen === "login" && (
        <main className="content-screen">
          <button className="back-button" onClick={resetHome}>
            ← Back
          </button>

          <div className="small-brand login-brand">
            <img
              src={`${import.meta.env.BASE_URL}medauth-logo.png`}
              alt="MedAuth"
            />
          </div>

          <h1>Log In</h1>

          <p className="screen-description">
            Professional access
          </p>

          <label className="field">
            Role
            <select>
              <option>Manufacturer</option>
              <option>Pharmacist</option>
              <option>Admin</option>
            </select>
          </label>

          <label className="field">
            Email
            <input
              type="email"
              defaultValue="manufacturer@demo.com"
            />
          </label>

          <label className="field">
            Password
            <input
              type="password"
              defaultValue="demo123"
            />
          </label>

          <button
            className="primary-button"
            onClick={() => setScreen("dashboard")}
          >
            Log In
          </button>
        </main>
      )}

      {/* DASHBOARD */}
      {screen === "dashboard" && (
        <main className="content-screen">
          <div className="small-brand">
            <img
              src={`${import.meta.env.BASE_URL}medauth-logo.png`}
              alt="MedAuth"
            />
          </div>

          <h1>Dashboard</h1>

          <div className="dashboard-card">
            <span>Medicine verification</span>
            <strong>Ready</strong>
          </div>

          <div className="dashboard-card">
            <span>Network</span>
            <strong>
              {offline ? "Offline" : "Online"}
            </strong>
          </div>

          <button
            className="primary-button"
            onClick={resetHome}
          >
            Scan Medicine
          </button>

          <button
            className="secondary-button"
            onClick={resetHome}
          >
            Log Out
          </button>
        </main>
      )}
    </div>
  );
}
