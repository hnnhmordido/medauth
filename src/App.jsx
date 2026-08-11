import { useMemo, useState } from "react";
import { medicines, demoEvents } from "./data/medicines";

import {
  NetworkBadge,
  PrimaryButton,
  SecondaryButton,
  StatusCard,
} from "./components/UI";

const palette = {
  blue: "#0B63B6",
  deepBlue: "#084B99",
  teal: "#00989F",
  aqua: "#01A09D",
};

const demoUsers = {
  "manufacturer@medauth.com": {
    role: "manufacturer",
    password: "demo123",
  },

  "pharmacist@medauth.com": {
    role: "pharmacist",
    password: "demo123",
  },

  "consumer@medauth.com": {
    role: "consumer",
    password: "demo123",
  },

  "admin@medauth.com": {
    role: "admin",
    password: "demo123",
  },
};

function verifyMedicine(code, batch, offline) {
  const normalizedCode = code?.trim().toUpperCase();
  const normalizedBatch = batch?.trim().toUpperCase();

  const product = medicines[normalizedCode];

  if (
    offline &&
    normalizedCode !== "MED-001"
  ) {
    return {
      status: "NOT_COVERED",
      product: null,
      offline: true,
    };
  }

  if (
    !product ||
    product.coverageStatus !== "ENROLLED"
  ) {
    return {
      status: "NOT_COVERED",
      product: product || null,
      offline,
    };
  }

  if (
    normalizedBatch &&
    normalizedBatch !== product.batch
  ) {
    return {
      status: "NO_MATCH",
      product,
      offline,
    };
  }

  return {
    status: "MATCH",
    product,
    offline,
  };
}

export default function App() {
  const [screen, setScreen] = useState("home");

  const [offline, setOffline] = useState(false);

  const [code, setCode] = useState("MED-001");
  const [batch, setBatch] = useState("B1001");

  const [result, setResult] = useState(null);

  const [role, setRole] = useState("");

  const [reportRef, setReportRef] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberDevice, setRememberDevice] =
    useState(true);

  const [showPassword, setShowPassword] =
    useState(false);

  const [loginError, setLoginError] =
    useState("");

  const totals = useMemo(
    () => ({
      scans: demoEvents.length,

      match: demoEvents.filter(
        (event) => event.result === "MATCH"
      ).length,

      noMatch: demoEvents.filter(
        (event) => event.result === "NO_MATCH"
      ).length,

      covered: demoEvents.filter(
        (event) =>
          event.result !== "NOT_COVERED"
      ).length,
    }),
    []
  );

  const runVerification = (
    nextCode = code,
    nextBatch = batch
  ) => {
    setScreen("checking");

    window.setTimeout(() => {
      setResult(
        verifyMedicine(
          nextCode,
          nextBatch,
          offline
        )
      );

      setScreen("result");
    }, 650);
  };

  const reset = () => {
    setScreen("home");

    setCode("MED-001");
    setBatch("B1001");

    setResult(null);

    setRole("");

    setReportRef("");

    setPassword("");

    setLoginError("");
  };

  const goBack = () => {
    switch (screen) {
      case "scan":
      case "manual":
      case "result":
        setScreen("home");
        break;

      case "details":
      case "report":
        setScreen("result");
        break;

      case "manufacturerDashboard":
      case "pharmacistDashboard":
      case "consumerDashboard":
      case "adminDashboard":
        setScreen("home");
        break;

      default:
        setScreen("home");
        break;
    }
  };

  const handleHomeLogin = (event) => {
    event.preventDefault();

    setLoginError("");

    const normalizedEmail =
      email.trim().toLowerCase();

    const user =
      demoUsers[normalizedEmail];

    if (!user) {
      setLoginError(
        "Account not found. Check your email address."
      );

      return;
    }

    if (user.password !== password) {
      setLoginError(
        "Incorrect password. Please try again."
      );

      return;
    }

    setRole(user.role);

    switch (user.role) {
      case "manufacturer":
        setScreen(
          "manufacturerDashboard"
        );
        break;

      case "pharmacist":
        setScreen(
          "pharmacistDashboard"
        );
        break;

      case "consumer":
        setScreen(
          "consumerDashboard"
        );
        break;

      case "admin":
        setScreen(
          "adminDashboard"
        );
        break;

      default:
        setLoginError(
          "This account does not have a valid role."
        );
    }
  };

  return (
    <div
      className="app-shell"
      style={{
        "--brand-blue": palette.blue,
        "--brand-deep": palette.deepBlue,
        "--brand-teal": palette.teal,
        "--brand-aqua": palette.aqua,
      }}
    >
      <main className="phone-stage">

        {/* HOME */}

        {screen === "home" && (
          <section className="screen home-screen">

            <div className="home-status-row">
              <NetworkBadge
                offline={offline}
                onToggle={() =>
                  setOffline(
                    (current) => !current
                  )
                }
              />
            </div>

            <div className="home-brand">
              <img
                className="hero-logo"
                src={`${import.meta.env.BASE_URL}medauth-logo.png`}
                alt="MedAuth"
              />
            </div>

            <button
              type="button"
              className="home-scan-button"
              onClick={() =>
                setScreen("scan")
              }
            >
              <ScanIcon />

              <span>
                Scan Medicine
              </span>
            </button>

            <div className="home-divider">
              <span>
                or
              </span>
            </div>

            <form
              className="home-login-form"
              onSubmit={handleHomeLogin}
            >

              <label className="home-login-field">
                <span>
                  EMAIL ADDRESS
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(
                      event.target.value
                    );

                    setLoginError("");
                  }}
                  placeholder="e.g. manufacturer@medauth.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="home-login-field">
                <span>
                  PASSWORD
                </span>

                <div className="password-input-wrap">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) => {
                      setPassword(
                        event.target.value
                      );

                      setLoginError("");
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOffIcon />
                    ) : (
                      <EyeIcon />
                    )}
                  </button>

                </div>
              </label>

              <div className="login-options">

                <label className="remember-device">

                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(event) =>
                      setRememberDevice(
                        event.target.checked
                      )
                    }
                  />

                  <span>
                    Remember this device
                  </span>

                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    alert(
                      "Password recovery can be connected here."
                    )
                  }
                >
                  Forgot password?
                </button>

              </div>

              {loginError && (
                <div
                  className="login-error"
                  role="alert"
                >
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="home-signin-button"
              >
                <span>
                  Sign In
                </span>

                <span
                  className="signin-arrow"
                  aria-hidden="true"
                >
                  →
                </span>
              </button>

            </form>

            <div className="security-footer">
              <LockIcon />

              <span>
                Secure connection
              </span>
            </div>

          </section>
        )}

        {/* SCAN */}

        {screen === "scan" && (
          <section className="screen">

            <BackButton onClick={goBack} />

            <div className="eyebrow">
              Guest verification
            </div>

            <h1>
              Scan medicine
            </h1>

            <p>
              Place a GS1 DataMatrix-style
              code inside the frame.
            </p>

            <div className="scanner-panel">

              <div className="scan-corners">
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="scan-line" />

              <small>
                Camera simulation
              </small>

            </div>

            <div className="sample-box">

              <strong>
                Demo samples
              </strong>

              <button
                type="button"
                onClick={() => {
                  setCode("MED-001");
                  setBatch("B1001");

                  runVerification(
                    "MED-001",
                    "B1001"
                  );
                }}
              >
                MED-001 / B1001 — Match
              </button>

              <button
                type="button"
                onClick={() => {
                  setCode("MED-002");
                  setBatch("B2045");

                  runVerification(
                    "MED-002",
                    "B2045"
                  );
                }}
              >
                MED-002 / B2045 — No Match
              </button>

              <button
                type="button"
                onClick={() => {
                  setCode("MED-003");
                  setBatch("B9912");

                  runVerification(
                    "MED-003",
                    "B9912"
                  );
                }}
              >
                MED-003 — Not Yet Covered
              </button>

            </div>

            <SecondaryButton
              onClick={() =>
                setScreen("manual")
              }
            >
              Enter Code Instead
            </SecondaryButton>

          </section>
        )}

        {/* MANUAL */}

        {screen === "manual" && (
          <section className="screen">

            <BackButton onClick={goBack} />

            <div className="eyebrow">
              Manual verification
            </div>

            <h1>
              Enter medicine code
            </h1>

            <label className="field">
              Product code

              <input
                value={code}
                onChange={(event) =>
                  setCode(
                    event.target.value
                  )
                }
                placeholder="e.g. MED-001"
              />
            </label>

            <label className="field">
              Batch (optional)

              <input
                value={batch}
                onChange={(event) =>
                  setBatch(
                    event.target.value
                  )
                }
                placeholder="e.g. B1001"
              />
            </label>

            <PrimaryButton
              onClick={() =>
                runVerification()
              }
            >
              Verify Medicine
            </PrimaryButton>

          </section>
        )}

        {/* CHECKING */}

        {screen === "checking" && (
          <section className="screen center-screen">

            <div className="loader" />

            <h1>
              Checking medicine…
            </h1>

            <p>
              Reading identifier →
              checking record →
              checking batch
            </p>

          </section>
        )}

        {/* RESULT */}

        {screen === "result" &&
          result && (
            <section className="screen">

              <BackButton onClick={goBack} />

              {result.status === "MATCH" && (
                <StatusCard
                  status="MATCH"
                  title="Match"
                  text="This code and batch match the prototype record."
                />
              )}

              {result.status === "NO_MATCH" && (
                <StatusCard
                  status="NO_MATCH"
                  title="No Match"
                  text="The code was found, but the batch does not match the prototype record."
                />
              )}

              {result.status ===
                "NOT_COVERED" && (
                <StatusCard
                  status="NOT_COVERED"
                  title="Unable to Verify"
                  text="This product is not yet covered by the prototype data. This does not mean it is counterfeit."
                />
              )}

              {result.offline && (
                <div className="notice">
                  Offline result: cached
                  prototype data may be used.
                </div>
              )}

              {result.product && (
                <div className="product-card">

                  <div>
                    <span>
                      Medicine
                    </span>

                    <strong>
                      {
                        result.product
                          .medicineName
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Manufacturer
                    </span>

                    <strong>
                      {
                        result.product
                          .manufacturer
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Scanned batch
                    </span>

                    <strong>
                      {batch || "—"}
                    </strong>
                  </div>

                </div>
              )}

              <div className="action-stack">

                {result.status === "MATCH" && (
                  <PrimaryButton
                    onClick={() =>
                      setScreen("details")
                    }
                  >
                    View Medicine Details
                  </PrimaryButton>
                )}

                {result.status !== "MATCH" && (
                  <PrimaryButton
                    onClick={() =>
                      setScreen("report")
                    }
                  >
                    Report Medicine
                  </PrimaryButton>
                )}

                <SecondaryButton
                  onClick={reset}
                >
                  Done
                </SecondaryButton>

              </div>

            </section>
          )}

        {/* DETAILS */}

        {screen === "details" &&
          result?.product && (
            <section className="screen">

              <BackButton onClick={goBack} />

              <div className="eyebrow">
                Medicine details
              </div>

              <h1>
                {
                  result.product
                    .medicineName
                }
              </h1>

              <div className="details-list">

                <Row
                  label="Manufacturer"
                  value={
                    result.product
                      .manufacturer
                  }
                />

                <Row
                  label="Product ID"
                  value={
                    result.product
                      .productId
                  }
                />

                <Row
                  label="Batch"
                  value={
                    result.product.batch
                  }
                />

                <Row
                  label="Expiry"
                  value={
                    result.product.expiry
                  }
                />

                <Row
                  label="Country"
                  value={
                    result.product
                      .countryOfOrigin
                  }
                />

                <Row
                  label="Last updated"
                  value={
                    result.product
                      .lastUpdated
                      .replace(
                        "T",
                        " "
                      )
                  }
                />

              </div>

              <SecondaryButton
                onClick={() =>
                  setScreen("result")
                }
              >
                Back to Result
              </SecondaryButton>

            </section>
          )}

        {/* REPORT */}

        {screen === "report" && (
          <section className="screen">

            <BackButton onClick={goBack} />

            <div className="eyebrow">
              Suspicious medicine report
            </div>

            <h1>
              Tell us what looks wrong
            </h1>

            <div className="notice">
              Prototype only. Do not enter
              real personal or health
              information.
            </div>

            <label className="field">
              Product code

              <input
                value={code}
                readOnly
              />
            </label>

            <label className="field">
              Batch

              <input
                value={batch}
                readOnly
              />
            </label>

            <label className="field">
              Comment

              <textarea
                placeholder="Example: Packaging looks different."
                rows="4"
              />
            </label>

            <label className="field">
              Coarse location (optional)

              <input
                placeholder="e.g. Adelaide SA"
              />
            </label>

            <PrimaryButton
              onClick={() => {
                setReportRef(
                  `MA-2026-${Math.floor(
                    10000 +
                      Math.random() *
                        89999
                  )}`
                );

                setScreen(
                  "confirmation"
                );
              }}
            >
              Submit Report
            </PrimaryButton>

          </section>
        )}

        {/* CONFIRMATION */}

        {screen === "confirmation" && (
          <section className="screen center-screen">

            <div className="success-badge">
              ✓
            </div>

            <h1>
              Report submitted
            </h1>

            <p>
              Reference:{" "}
              <strong>
                {reportRef}
              </strong>
            </p>

            <PrimaryButton
              onClick={reset}
            >
              Return Home
            </PrimaryButton>

          </section>
        )}

        {/* MANUFACTURER */}

        {screen ===
          "manufacturerDashboard" && (
          <section className="screen">

            <BackButton onClick={goBack} />

            <DashboardHeader
              title="Manufacturer"
              role="Manufacturer"
            />

            <ManufacturerDashboard
              totals={totals}
            />

            <SecondaryButton
              onClick={reset}
            >
              Sign Out
            </SecondaryButton>

          </section>
        )}

        {/* PHARMACIST */}

        {screen ===
          "pharmacistDashboard" && (
          <section className="screen">

            <BackButton onClick={goBack} />

            <DashboardHeader
              title="Pharmacist"
              role="Pharmacist"
            />

            <PharmacistDashboard
              onVerify={() =>
                setScreen("scan")
              }
            />

            <SecondaryButton
              onClick={reset}
            >
              Sign Out
            </SecondaryButton>

          </section>
        )}

        {/* CONSUMER */}

        {screen ===
          "consumerDashboard" && (
          <section className="screen">

            <BackButton onClick={goBack} />

            <DashboardHeader
              title="My MedAuth"
              role="Consumer"
            />

            <div className="panel">

              <h3>
                Verify a medicine
              </h3>

              <p>
                Scan a medicine package
                to check its verification
                record.
              </p>

              <PrimaryButton
                onClick={() =>
                  setScreen("scan")
                }
              >
                Scan Medicine
              </PrimaryButton>

            </div>

            <div className="panel">

              <h3>
                Enter code manually
              </h3>

              <SecondaryButton
                onClick={() =>
                  setScreen("manual")
                }
              >
                Enter Medicine Code
              </SecondaryButton>

            </div>

            <div className="panel">

              <h3>
                Recent activity
              </h3>

              <p>
                MED-001 / B1001 — Match
              </p>

              <p>
                MED-002 / B2045 — No Match
              </p>

            </div>

            <SecondaryButton
              onClick={reset}
            >
              Sign Out
            </SecondaryButton>

          </section>
        )}

        {/* ADMIN */}

        {screen ===
          "adminDashboard" && (
          <section className="screen">

            <BackButton onClick={goBack} />

            <DashboardHeader
              title="Administration"
              role="Admin"
            />

            <AdminDashboard />

            <SecondaryButton
              onClick={reset}
            >
              Sign Out
            </SecondaryButton>

          </section>
        )}

      </main>
    </div>
  );
}

function BackButton({
  onClick,
}) {
  return (
    <button
      type="button"
      className="back-button"
      onClick={onClick}
      aria-label="Go back"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>

      <span>
        Back
      </span>
    </button>
  );
}

function ScanIcon() {
  return (
    <svg
      className="home-scan-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />

      <path d="M16 3h3a2 2 0 0 1 2 2v3" />

      <path d="M8 21H5a2 2 0 0 1-2-2v-3" />

      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />

      <rect
        x="8"
        y="8"
        width="3"
        height="3"
      />

      <rect
        x="13"
        y="8"
        width="3"
        height="3"
      />

      <rect
        x="8"
        y="13"
        width="3"
        height="3"
      />

      <rect
        x="13"
        y="13"
        width="3"
        height="3"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />

      <circle
        cx="12"
        cy="12"
        r="2.5"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m3 3 18 18" />

      <path d="M10.6 6.2A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.1 2.8" />

      <path d="M6.6 6.7C4 8.3 2.5 12 2.5 12s3.5 6 9.5 6a9.8 9.8 0 0 0 3.1-.5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="security-lock"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
      />

      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function DashboardHeader({
  title,
  role,
}) {
  return (
    <div className="dashboard-head">

      <div>

        <div className="eyebrow">
          MedAuth account
        </div>

        <h1>
          {title}
        </h1>

      </div>

      <span className="role-badge">
        {role}
      </span>

    </div>
  );
}

function Row({
  label,
  value,
}) {
  return (
    <div className="detail-row">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

function ManufacturerDashboard({
  totals,
}) {
  return (
    <>
      <div className="metric-grid">

        <Metric
          label="Demo scans"
          value={totals.scans}
        />

        <Metric
          label="Matches"
          value={totals.match}
        />

        <Metric
          label="No matches"
          value={totals.noMatch}
        />

        <Metric
          label="Covered"
          value={totals.covered}
        />

      </div>

      <div className="panel">

        <h3>
          Brand alerts
        </h3>

        <p>
          <strong>
            HealthMed 20mg / B2045
          </strong>
        </p>

        <p className="muted">
          No Match • Adelaide SA •
          Under review
        </p>

      </div>

      <div className="panel">

        <h3>
          Products
        </h3>

        <p>
          SampleMed 10mg — enrolled
        </p>

        <p>
          HealthMed 20mg — enrolled
        </p>

        <p>
          TestMed 5mg — not yet covered
        </p>

      </div>
    </>
  );
}

function PharmacistDashboard({
  onVerify,
}) {
  return (
    <>
      <PrimaryButton
        onClick={onVerify}
      >
        Verify Medicine
      </PrimaryButton>

      <div className="panel">

        <h3>
          Batch lookup
        </h3>

        <p>
          <strong>
            B2020
          </strong>{" "}
          — Active Recall (demo)
        </p>

      </div>

      <div className="panel">

        <h3>
          Recent activity
        </h3>

        <p>
          MED-001 / B1001 — Match
        </p>

        <p>
          MED-002 / B2045 — No Match
        </p>

      </div>
    </>
  );
}

function AdminDashboard() {
  return (
    <>
      <div className="metric-grid">

        <Metric
          label="New reports"
          value="1"
        />

        <Metric
          label="Under review"
          value="1"
        />

        <Metric
          label="Resolved"
          value="0"
        />

      </div>

      <div className="panel">

        <h3>
          Report review
        </h3>

        <p>
          MA-2026-00125 —
          Packaging looks different.
        </p>

        <p className="muted">
          Status: New
        </p>

      </div>
    </>
  );
}

function Metric({
  label,
  value,
}) {
  return (
    <div className="metric">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}
