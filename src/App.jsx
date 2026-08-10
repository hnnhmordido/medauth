import { useState } from "react";
import { medicines } from "./data/medicines";
import "./styles.css";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [offline, setOffline] = useState(false);

  const [code, setCode] = useState("MED-001");
  const [batch, setBatch] = useState("B1001");
  const [result, setResult] = useState(null);

  const [role, setRole] = useState("manufacturer");

  const goHome = () => {
    setScreen("home");
    setResult(null);
  };

  const verifyMedicine = (
    nextCode = code,
    nextBatch = batch
  ) => {
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
      } else if (
        !product ||
        product.coverageStatus !== "ENROLLED"
      ) {
        setResult({
          status: "NOT_COVERED",
          product: product || null,
        });
      } else if (
        cleanBatch &&
        cleanBatch !== product.batch
      ) {
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

  return (
    <div className="app-shell">

      {/* HOME */}
      {screen === "home" && (
        <main className="home-screen">

          <div className="status-row">
            <div
              className={`online ${
                offline ? "offline" : ""
              }`}
            >
              <span className="status-dot"></span>
              {offline ? "Offline" : "Online"}
            </div>

            <label className="offline-switch">
              <input
                type="checkbox"
                checked={offline}
                onChange={(e) =>
                  setOffline(e.target.checked)
                }
              />
              <span>Offline</span>
            </label>
          </div>

          <div className="logo-container">
            <img
              src={`${import.meta.env.BASE_URL}medauth-logo.png`}
              alt="MedAuth"
              className="main-logo"
            />
          </div>

          <div className="home-actions">

            <button
              className="primary-action"
              onClick={() => setScreen("scan")}
            >
              Scan Medicine
            </button>

            <button
              className="secondary-action"
              onClick={() => setScreen("manual")}
            >
              Enter Code Instead
            </button>

          </div>

          <div className="login-area">
            <button
              className="login-action"
              onClick={() => setScreen("login")}
            >
              Log In
            </button>
          </div>

        </main>
      )}

      {/* SCAN SCREEN */}
      {screen === "scan" && (
        <main className="content-screen">

          <button
            className="back-button"
            onClick={goHome}
          >
            ← Back
          </button>

          <div className="small-logo">
            <img
              src={`${import.meta.env.BASE_URL}medauth-logo.png`}
              alt="MedAuth"
            />
          </div>

          <h1>Scan Medicine</h1>

          <p className="description">
            Position the medicine code inside the
            scanner.
          </p>

          <div className="scanner">

            <span className="corner tl"></span>
            <span className="corner tr"></span>
            <span className="corner bl"></span>
            <span className="corner br"></span>

            <div className="scan-line"></div>

            <span className="camera-text">
              Camera scanner
            </span>

          </div>

          <button
            className="primary-action"
            onClick={() =>
              verifyMedicine("MED-001", "B1001")
            }
          >
            Simulate Scan
          </button>

          <button
            className="secondary-action scan-manual"
            onClick={() => setScreen("manual")}
          >
            Enter Code Instead
          </button>

        </main>
      )}

      {/* MANUAL ENTRY */}
      {screen === "manual" && (
        <main className="content-screen">

          <button
            className="back-button"
            onClick={goHome}
          >
            ← Back
          </button>

          <div className="small-logo">
            <img
              src={`${import.meta.env.BASE_URL}medauth-logo.png`}
              alt="MedAuth"
            />
          </div>

          <h1>Enter Medicine Code</h1>

          <p className="description">
            Enter the product code and batch number.
          </p>

          <label className="field">
            Product code

            <input
              value={code}
              onChange={(e) =>
                setCode(e.target.value)
              }
              placeholder="MED-001"
            />
          </label>

          <label className="field">
            Batch

            <input
              value={batch}
              onChange={(e) =>
                setBatch(e.target.value)
              }
              placeholder="B1001"
            />
          </label>

          <button
            className="primary-action"
            onClick={() => verifyMedicine()}
          >
            Verify Medicine
          </button>

          <div className="demo-codes">
            <p>Demo examples</p>

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

          <div className="loader"></div>

          <h1>Checking Medicine</h1>

          <p className="description">
            Verifying medicine information...
          </p>

        </main>
      )}

      {/* RESULT */}
      {screen === "result" && result && (
        <main className="content-screen">

          <button
            className="back-button"
            onClick={goHome}
          >
            ← Home
          </button>

          <div className="small-logo">
            <img
              src={`${import.meta.env.BASE_URL}medauth-logo.png`}
              alt="MedAuth"
            />
          </div>

          {result.status === "MATCH" && (
            <div className="result-card match">

              <div className="result-icon">
                ✓
              </div>

              <h1>Match</h1>

              <p>
                This medicine code and batch match
                the MedAuth record.
              </p>

            </div>
          )}

          {result.status === "NO_MATCH" && (
            <div className="result-card warning">

              <div className="result-icon">
                !
              </div>

              <h1>No Match</h1>

              <p>
                The medicine was found, but the batch
                does not match the registered record.
              </p>

            </div>
          )}

          {result.status === "NOT_COVERED" && (
            <div className="result-card unknown">

              <div className="result-icon">
                ?
              </div>

              <h1>Unable to Verify</h1>

              <p>
                This medicine is not currently covered
                by MedAuth. This does not mean it is
                counterfeit.
              </p>

            </div>
          )}

          {result.product && (
            <div className="medicine-details">

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
            className="primary-action"
            onClick={goHome}
          >
            Scan Another Medicine
          </button>

        </main>
      )}

      {/* LOGIN */}
      {screen === "login" && (
        <main className="content-screen">

          <button
            className="back-button"
            onClick={goHome}
          >
            ← Back
          </button>

          <div className="small-logo login-logo">
            <img
              src={`${import.meta.env.BASE_URL}medauth-logo.png`}
              alt="MedAuth"
            />
          </div>

          <h1>Log In</h1>

          <p className="description">
            Professional access
          </p>

          <label className="field">
            Role

            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value)
              }
            >
              <option value="manufacturer">
                Manufacturer
              </option>

              <option value="pharmacist">
                Pharmacist
              </option>

              <option value="admin">
                Admin
              </option>
            </select>
          </label>

          <label className="field">
            Email

            <input
              type="email"
              value={`${role}@demo.com`}
              readOnly
            />
          </label>

          <label className="field">
            Password

            <input
              type="password"
              value="demo123"
              readOnly
            />
          </label>

          <button
            className="primary-action"
            onClick={() => setScreen("dashboard")}
          >
            Log In
          </button>

        </main>
      )}

      {/* DASHBOARD */}
      {screen === "dashboard" && (
        <main className="content-screen">

          <div className="small-logo">
            <img
              src={`${import.meta.env.BASE_URL}medauth-logo.png`}
              alt="MedAuth"
            />
          </div>

          <h1>
            {role.charAt(0).toUpperCase() +
              role.slice(1)}
          </h1>

          <p className="description">
            MedAuth Dashboard
          </p>

          <div className="dashboard-card">
            <span>Verification</span>
            <strong>Available</strong>
          </div>

          <div className="dashboard-card">
            <span>Network</span>
            <strong>
              {offline ? "Offline" : "Online"}
            </strong>
          </div>

          <button
            className="primary-action"
            onClick={() => setScreen("scan")}
          >
            Scan Medicine
          </button>

          <button
            className="secondary-action dashboard-logout"
            onClick={goHome}
          >
            Log Out
          </button>

        </main>
      )}

    </div>
  );
}
