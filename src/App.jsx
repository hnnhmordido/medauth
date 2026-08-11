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
    name: "Manufacturer",
    fullName: "MedAuth Manufacturer",
    email: "manufacturer@medauth.com",
  },

  "pharmacist@medauth.com": {
    role: "pharmacist",
    password: "demo123",
    name: "Marie",
    fullName: "Marie Nguyen",
    title: "Registered Pharmacist",
    organisation: "MedAuth Pharmacy Demo",
    email: "pharmacist@medauth.com",
  },

  "consumer@medauth.com": {
    role: "consumer",
    password: "demo123",
    name: "Consumer",
    fullName: "MedAuth Consumer",
    email: "consumer@medauth.com",
  },

  "admin@medauth.com": {
    role: "admin",
    password: "demo123",
    name: "Admin",
    fullName: "MedAuth Administrator",
    email: "admin@medauth.com",
  },
};

const prototypeRecalls = [
  {
    id: "REC-001",
    code: "MED-004",
    medicineName: "SampleMed 10mg",
    batch: "B2020",
    recallDate: "2026-08-01",
    severity: "High",
    status: "Active Recall",
    reason:
      "Prototype recall notice. Isolate the affected sample batch and follow normal pharmacy procedures.",
  },
];

function getMedicineName(product, fallback = "Medicine") {
  return (
    product?.medicineName ||
    product?.name ||
    product?.productName ||
    fallback
  );
}

function normaliseEvent(event, index = 0) {
  const timestamp =
    event.timestamp ||
    event.dateTime ||
    event.date ||
    new Date().toISOString();

  return {
    id:
      event.id ||
      `EVENT-${index}-${timestamp}`,

    code:
      event.code ||
      event.productCode ||
      event.productId ||
      "",

    medicine:
      event.medicine ||
      event.medicineName ||
      event.product ||
      event.productName ||
      "Medicine",

    batch:
      event.batch ||
      event.batchNumber ||
      "—",

    result:
      event.result ||
      event.status ||
      "NOT_COVERED",

    timestamp,

    offline: Boolean(
      event.offline ||
      event.cached
    ),

    region:
      event.region ||
      event.location ||
      "",

    type:
      event.type ||
      "verification",
  };
}

function formatEventTime(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp || "—";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function resultLabel(result) {
  switch (result) {
    case "MATCH":
      return "Match";

    case "NO_MATCH":
      return "No Match";

    case "RECALL_CHECK":
      return "Recall checked";

    default:
      return "Unable to Verify";
  }
}

function verifyMedicine(code, batch, offline) {
  const normalizedCode =
    code?.trim().toUpperCase();

  const normalizedBatch =
    batch?.trim().toUpperCase();

  const product =
    medicines[normalizedCode];

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
  const [screen, setScreen] =
    useState("home");

  const [offline, setOffline] =
    useState(false);

  const [syncing, setSyncing] =
    useState(false);

  const [pendingSync, setPendingSync] =
    useState(0);

  const [role, setRole] =
    useState("");

  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    rememberDevice,
    setRememberDevice,
  ] = useState(true);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loginError,
    setLoginError,
  ] = useState("");

  const [
    resetEmail,
    setResetEmail,
  ] = useState("");

  const [
    resetSent,
    setResetSent,
  ] = useState(false);

  const [code, setCode] =
    useState("MED-001");

  const [batch, setBatch] =
    useState("B1001");

  const [result, setResult] =
    useState(null);

  const [
    verificationEvents,
    setVerificationEvents,
  ] = useState(() => [
    ...demoEvents,
  ]);

  const [
    batchSearch,
    setBatchSearch,
  ] = useState("");

  const [
    batchResult,
    setBatchResult,
  ] = useState(null);

  const [
    selectedRecall,
    setSelectedRecall,
  ] = useState(null);

  const [
    reportRef,
    setReportRef,
  ] = useState("");

  const [
    reportComment,
    setReportComment,
  ] = useState("");

  const [
    reportLocation,
    setReportLocation,
  ] = useState("");

  const [
    reportImageName,
    setReportImageName,
  ] = useState("");

  const [reports, setReports] =
    useState([]);

  const [
    reportOrigin,
    setReportOrigin,
  ] = useState("result");

  const pharmacistEvents =
    useMemo(() => {
      return verificationEvents
        .map((event, index) =>
          normaliseEvent(
            event,
            index
          )
        )
        .sort(
          (a, b) =>
            new Date(
              b.timestamp
            ).getTime() -
            new Date(
              a.timestamp
            ).getTime()
        );
    }, [verificationEvents]);

  const totals = useMemo(
    () => ({
      scans:
        pharmacistEvents.filter(
          (event) =>
            event.type ===
            "verification"
        ).length,

      match:
        pharmacistEvents.filter(
          (event) =>
            event.result ===
            "MATCH"
        ).length,

      noMatch:
        pharmacistEvents.filter(
          (event) =>
            event.result ===
            "NO_MATCH"
        ).length,

      covered:
        pharmacistEvents.filter(
          (event) =>
            event.result !==
            "NOT_COVERED"
        ).length,

      recallMatches:
        prototypeRecalls.filter(
          (recall) =>
            recall.status ===
            "Active Recall"
        ).length,
    }),
    [pharmacistEvents]
  );

  const handleNetworkToggle = () => {
    if (!offline) {
      setOffline(true);
      return;
    }

    setOffline(false);

    if (pendingSync > 0) {
      setSyncing(true);

      window.setTimeout(() => {
        setPendingSync(0);
        setSyncing(false);
      }, 900);
    }
  };

  const handleHomeLogin = (
    event
  ) => {
    event.preventDefault();

    setLoginError("");

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    const user =
      demoUsers[
        normalizedEmail
      ];

    if (!user) {
      setLoginError(
        "Account not found. Check your email address."
      );
      return;
    }

    if (
      user.password !==
      password
    ) {
      setLoginError(
        "Incorrect password. Please try again."
      );
      return;
    }

    setRole(user.role);
    setCurrentUser(user);

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

  const handleForgotPassword =
    (event) => {
      event.preventDefault();

      if (!resetEmail.trim()) {
        return;
      }

      setResetSent(true);
    };

  const runVerification = (
    nextCode = code,
    nextBatch = batch
  ) => {
    setScreen("checking");

    window.setTimeout(() => {
      const verification =
        verifyMedicine(
          nextCode,
          nextBatch,
          offline
        );

      setResult(verification);

      if (
        role === "pharmacist"
      ) {
        const normalizedCode =
          nextCode
            ?.trim()
            .toUpperCase();

        const product =
          verification.product ||
          medicines[
            normalizedCode
          ];

        const newEvent = {
          id:
            `VERIFY-${Date.now()}`,

          code:
            normalizedCode,

          medicine:
            getMedicineName(
              product,
              normalizedCode
            ),

          batch:
            nextBatch || "—",

          result:
            verification.status,

          timestamp:
            new Date()
              .toISOString(),

          offline,

          region: "",

          type:
            "verification",
        };

        setVerificationEvents(
          (current) => [
            newEvent,
            ...current,
          ]
        );

        if (offline) {
          setPendingSync(
            (current) =>
              current + 1
          );
        }
      }

      setScreen("result");
    }, 650);
  };

  const handleBatchLookup =
    (event) => {
      event.preventDefault();

      const search =
        batchSearch
          .trim()
          .toUpperCase();

      if (!search) {
        return;
      }

      const recall =
        prototypeRecalls.find(
          (item) =>
            item.batch ===
            search
        );

      let medicineRecord =
        null;

      Object.values(
        medicines
      ).forEach(
        (medicine) => {
          if (
            medicine.batch ===
            search
          ) {
            medicineRecord =
              medicine;
          }
        }
      );

      setBatchResult({
        batch: search,

        recall,

        medicine:
          medicineRecord ||
          (recall
            ? {
                medicineName:
                  recall.medicineName,
              }
            : null),
      });

      if (
        role === "pharmacist"
      ) {
        const newEvent = {
          id:
            `BATCH-${Date.now()}`,

          medicine:
            recall
              ?.medicineName ||
            getMedicineName(
              medicineRecord,
              search
            ),

          batch: search,

          result:
            "RECALL_CHECK",

          timestamp:
            new Date()
              .toISOString(),

          offline,

          region: "",

          type: "recall",
        };

        setVerificationEvents(
          (current) => [
            newEvent,
            ...current,
          ]
        );

        if (offline) {
          setPendingSync(
            (current) =>
              current + 1
          );
        }
      }
    };

  const submitReport = () => {
    const reference =
      `MA-2026-${Math.floor(
        10000 +
          Math.random() *
            89999
      )}`;

    const newReport = {
      id: reference,
      code,
      batch,
      comment:
        reportComment,
      location:
        reportLocation,
      imageName:
        reportImageName,
      createdAt:
        new Date()
          .toISOString(),
      status: "New",
      role:
        role || "guest",
    };

    setReportRef(reference);

    setReports(
      (current) => [
        newReport,
        ...current,
      ]
    );

    if (
      role ===
        "pharmacist" &&
      offline
    ) {
      setPendingSync(
        (current) =>
          current + 1
      );
    }

    setScreen(
      "confirmation"
    );
  };

  const reset = () => {
    setScreen("home");

    setRole("");
    setCurrentUser(null);

    setPassword("");
    setLoginError("");

    setCode("MED-001");
    setBatch("B1001");
    setResult(null);

    setReportRef("");
    setReportComment("");
    setReportLocation("");
    setReportImageName("");
    setReportOrigin("result");

    setResetEmail("");
    setResetSent(false);

    setBatchSearch("");
    setBatchResult(null);
    setSelectedRecall(null);
  };

  const goBack = () => {
    switch (screen) {
      case "scan":
      case "manual":
      case "result":
        if (
          role === "pharmacist"
        ) {
          setScreen(
            "pharmacistDashboard"
          );
        } else {
          setScreen("home");
        }
        break;

      case "details":
        setScreen("result");
        break;

      case "report":
        if (
          role ===
            "pharmacist" &&
          reportOrigin ===
            "pharmacistDashboard"
        ) {
          setScreen(
            "pharmacistDashboard"
          );
        } else {
          setScreen("result");
        }
        break;

      case "pharmacistBatchLookup":
      case "pharmacistRecalls":
      case "pharmacistHistory":
      case "pharmacistProfile":
      case "pharmacistSettings":
        setScreen(
          "pharmacistDashboard"
        );
        break;

      case "pharmacistRecallDetail":
        setScreen(
          "pharmacistRecalls"
        );
        break;

      case "forgotPassword":
        setScreen("home");
        break;

      case "manufacturerDashboard":
      case "consumerDashboard":
      case "adminDashboard":
      case "pharmacistDashboard":
        setScreen("home");
        break;

      default:
        setScreen("home");
        break;
    }
  };

  return (
    <div
      className="app-shell"
      style={{
        "--brand-blue":
          palette.blue,

        "--brand-deep":
          palette.deepBlue,

        "--brand-teal":
          palette.teal,

        "--brand-aqua":
          palette.aqua,
      }}
    >
      <main className="phone-stage">

        {/* HOME */}

        {screen === "home" && (
          <section className="screen home-screen">

            <div className="home-status-row">
              <NetworkBadge
                offline={offline}
                onToggle={
                  handleNetworkToggle
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
              onSubmit={
                handleHomeLogin
              }
            >
              <label className="home-login-field">

                <span>
                  EMAIL ADDRESS
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(
                    event
                  ) => {
                    setEmail(
                      event.target.value
                    );

                    setLoginError("");
                  }}
                  placeholder="e.g. pharmacist@medauth.com"
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
                    onChange={(
                      event
                    ) => {
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
                        (current) =>
                          !current
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
                    checked={
                      rememberDevice
                    }
                    onChange={(
                      event
                    ) =>
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
                  onClick={() => {
                    setResetEmail(
                      email
                    );

                    setResetSent(
                      false
                    );

                    setScreen(
                      "forgotPassword"
                    );
                  }}
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
                Sign In →
              </button>

            </form>

            <div className="security-footer">

              <LockIcon />

              <span>
                Protected by AES-256 encryption
                {" · "}
                TLS 1.3
                {" · "}
                ISO 27001
              </span>

            </div>

          </section>
        )}

        {/* FORGOT PASSWORD */}

        {screen ===
          "forgotPassword" && (
          <section className="screen forgot-screen">

            <BackButton
              onClick={goBack}
            />

            <div className="forgot-brand">

              <img
                className="forgot-logo"
                src={`${import.meta.env.BASE_URL}medauth-logo.png`}
                alt="MedAuth"
              />

            </div>

            {!resetSent ? (
              <>
                <div className="eyebrow">
                  Account recovery
                </div>

                <h1>
                  Forgot password?
                </h1>

                <p className="forgot-description">
                  Enter the email
                  address linked to
                  your MedAuth account.
                </p>

                <form
                  className="forgot-form"
                  onSubmit={
                    handleForgotPassword
                  }
                >
                  <label className="home-login-field">

                    <span>
                      EMAIL ADDRESS
                    </span>

                    <input
                      type="email"
                      value={
                        resetEmail
                      }
                      onChange={(
                        event
                      ) =>
                        setResetEmail(
                          event.target.value
                        )
                      }
                      placeholder="e.g. pharmacist@medauth.com"
                      required
                    />

                  </label>

                  <button
                    type="submit"
                    className="home-signin-button"
                  >
                    Send Reset Instructions
                  </button>

                </form>
              </>
            ) : (
              <div className="reset-success">

                <div className="reset-success-icon">
                  <MailIcon />
                </div>

                <h1>
                  Check your email
                </h1>

                <p>
                  If an account exists
                  for{" "}
                  <strong>
                    {resetEmail}
                  </strong>
                  , reset instructions
                  have been requested.
                </p>

                <PrimaryButton
                  onClick={() => {
                    setScreen(
                      "home"
                    );

                    setResetSent(
                      false
                    );
                  }}
                >
                  Return to Sign In
                </PrimaryButton>

              </div>
            )}

          </section>
        )}

        {/* SCAN */}

        {screen === "scan" && (
          <section className="screen">

            <BackButton
              onClick={goBack}
            />

            <div className="eyebrow">
              {role ===
              "pharmacist"
                ? "Pharmacist verification"
                : "Guest verification"}
            </div>

            <h1>
              Scan medicine
            </h1>

            <p>
              Place the medicine
              GS1/DataMatrix-style
              code inside the scanning
              area.
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
                Simulate scan
              </strong>

              <button
                type="button"
                onClick={() => {
                  setCode(
                    "MED-001"
                  );

                  setBatch(
                    "B1001"
                  );

                  runVerification(
                    "MED-001",
                    "B1001"
                  );
                }}
              >
                MED-001 / B1001 —
                Match
              </button>

              <button
                type="button"
                onClick={() => {
                  setCode(
                    "MED-002"
                  );

                  setBatch(
                    "B2045"
                  );

                  runVerification(
                    "MED-002",
                    "B2045"
                  );
                }}
              >
                MED-002 / B2045 —
                No Match
              </button>

              <button
                type="button"
                onClick={() => {
                  setCode(
                    "MED-003"
                  );

                  setBatch(
                    "B9912"
                  );

                  runVerification(
                    "MED-003",
                    "B9912"
                  );
                }}
              >
                MED-003 —
                Not Yet Covered
              </button>

            </div>

            <SecondaryButton
              onClick={() =>
                setScreen(
                  "manual"
                )
              }
            >
              Enter Code Instead
            </SecondaryButton>

          </section>
        )}

        {/* MANUAL */}

        {screen === "manual" && (
          <section className="screen">

            <BackButton
              onClick={goBack}
            />

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
                onChange={(
                  event
                ) =>
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
                onChange={(
                  event
                ) =>
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

        {screen ===
          "checking" && (
          <section className="screen center-screen">

            <div className="loader" />

            <h1>
              Checking medicine…
            </h1>

          </section>
        )}

        {/* RESULT */}

        {screen === "result" &&
          result && (
            <section className="screen">

              <BackButton
                onClick={goBack}
              />

              {result.status ===
                "MATCH" && (
                <StatusCard
                  status="MATCH"
                  title="Match"
                  text="The scanned product and batch match the prototype record. This does not prove authenticity."
                />
              )}

              {result.status ===
                "NO_MATCH" && (
                <StatusCard
                  status="NO_MATCH"
                  title="No Match"
                  text="The scanned information does not match the prototype record."
                />
              )}

              {result.status ===
                "NOT_COVERED" && (
                <StatusCard
                  status="NOT_COVERED"
                  title="Unable to Verify"
                  text="There is not enough prototype data to verify this medicine right now."
                />
              )}

              {result.offline && (
                <div className="notice">
                  Offline Mode —
                  cached prototype
                  data was used.
                </div>
              )}

              {result.product && (
                <div className="product-card">

                  <div>
                    <span>
                      Medicine
                    </span>

                    <strong>
                      {getMedicineName(
                        result.product
                      )}
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
                      Batch
                    </span>

                    <strong>
                      {batch}
                    </strong>
                  </div>

                </div>
              )}

              <div className="action-stack">

                {result.status ===
                  "MATCH" && (
                  <PrimaryButton
                    onClick={() =>
                      setScreen(
                        "details"
                      )
                    }
                  >
                    View Medicine Details
                  </PrimaryButton>
                )}

                {result.status !==
                  "MATCH" && (
                  <PrimaryButton
                    onClick={() => {
                      setReportOrigin(
                        "result"
                      );

                      setScreen(
                        "report"
                      );
                    }}
                  >
                    {role ===
                    "pharmacist"
                      ? "Escalate / Report Suspicious Medicine"
                      : "Report Medicine"}
                  </PrimaryButton>
                )}

                {role ===
                  "pharmacist" ? (
                  <SecondaryButton
                    onClick={() =>
                      setScreen(
                        "pharmacistDashboard"
                      )
                    }
                  >
                    Back to Pharmacist Dashboard
                  </SecondaryButton>
                ) : (
                  <SecondaryButton
                    onClick={reset}
                  >
                    Done
                  </SecondaryButton>
                )}

              </div>

            </section>
          )}

        {/* DETAILS */}

        {screen ===
          "details" &&
          result?.product && (
            <section className="screen">

              <BackButton
                onClick={goBack}
              />

              <div className="eyebrow">
                Medicine details
              </div>

              <h1>
                {getMedicineName(
                  result.product
                )}
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
                      .productId ||
                    code
                  }
                />

                <Row
                  label="Batch"
                  value={
                    result.product
                      .batch
                  }
                />

                <Row
                  label="Expiry"
                  value={
                    result.product
                      .expiry ||
                    "—"
                  }
                />

                <Row
                  label="Country"
                  value={
                    result.product
                      .countryOfOrigin ||
                    "—"
                  }
                />

              </div>

            </section>
          )}

        {/* REPORT */}

        {screen === "report" && (
          <section className="screen">

            <BackButton
              onClick={goBack}
            />

            <div className="eyebrow">
              Suspicious medicine
              report
            </div>

            <h1>
              Report a concern
            </h1>

            <p>
              Prototype only.
              This report is stored
              locally.
            </p>

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
                value={
                  reportComment
                }
                onChange={(
                  event
                ) =>
                  setReportComment(
                    event.target.value
                  )
                }
                rows="4"
                placeholder="Example: Packaging looks different."
              />

            </label>

            <label className="field">

              Image (optional)

              <input
                type="file"
                accept="image/*"
                onChange={(
                  event
                ) =>
                  setReportImageName(
                    event.target
                      .files?.[0]
                      ?.name || ""
                  )
                }
              />

            </label>

            <label className="field">

              Coarse location
              (optional)

              <input
                value={
                  reportLocation
                }
                onChange={(
                  event
                ) =>
                  setReportLocation(
                    event.target.value
                  )
                }
                placeholder="e.g. Adelaide SA"
              />

            </label>

            <PrimaryButton
              onClick={
                submitReport
              }
            >
              Submit Report
            </PrimaryButton>

          </section>
        )}

        {/* CONFIRMATION */}

        {screen ===
          "confirmation" && (
          <section className="screen center-screen">

            <div className="success-badge">
              ✓
            </div>

            <h1>
              Report submitted
            </h1>

            <p>
              Reference{" "}
              <strong>
                {reportRef}
              </strong>
            </p>

            {role ===
            "pharmacist" ? (
              <PrimaryButton
                onClick={() =>
                  setScreen(
                    "pharmacistDashboard"
                  )
                }
              >
                Back to Pharmacist Dashboard
              </PrimaryButton>
            ) : (
              <PrimaryButton
                onClick={reset}
              >
                Return Home
              </PrimaryButton>
            )}

          </section>
        )}

        {/* PHARMACIST DASHBOARD */}

        {screen ===
          "pharmacistDashboard" && (
          <section className="screen pharmacist-screen">

            <div className="pharmacist-profile-header">

              <div className="pharmacist-profile-main">

                <img
                  className="pharmacist-avatar"
                  src={`${import.meta.env.BASE_URL}pharmacist-marie.png`}
                  alt="Marie Nguyen"
                />

                <div className="pharmacist-greeting">

                  <span className="pharmacist-welcome">
                    Welcome back
                  </span>

                  <h1>
                    Hi,{" "}
                    {currentUser?.name ||
                      "Marie"}
                  </h1>

                  <p>
                    Registered Pharmacist
                  </p>

                </div>

              </div>

              <div className="pharmacist-profile-actions">

                <button
                  type="button"
                  className="profile-icon-button"
                  onClick={() =>
                    setScreen(
                      "pharmacistProfile"
                    )
                  }
                  aria-label="My Profile"
                >
                  <ProfileIcon />
                </button>

                <button
                  type="button"
                  className="profile-icon-button"
                  onClick={() =>
                    setScreen(
                      "pharmacistSettings"
                    )
                  }
                  aria-label="Settings"
                >
                  <SettingsIcon />
                </button>

              </div>

            </div>

            <div
              className={`pharmacist-system-status ${
                offline
                  ? "is-offline"
                  : "is-online"
              }`}
            >
              <div>

                <strong>
                  {offline
                    ? "Offline Mode — Using Cached Data"
                    : syncing
                    ? "Synchronising…"
                    : "System Online"}
                </strong>

                {pendingSync >
                  0 && (
                  <span>
                    Pending Sync:{" "}
                    {pendingSync}
                  </span>
                )}

              </div>

              <NetworkBadge
                offline={offline}
                onToggle={
                  handleNetworkToggle
                }
              />

            </div>

            <button
              type="button"
              className="pharmacist-primary-action"
              onClick={() =>
                setScreen("scan")
              }
            >
              <ScanIcon />

              <div>

                <strong>
                  Verify Medicine
                </strong>

                <span>
                  Scan or enter a
                  medicine code
                </span>

              </div>

              <span>
                →
              </span>

            </button>

            <div className="pharmacist-action-grid">

              <button
                type="button"
                className="pharmacist-action-card"
                onClick={() => {
                  setBatchResult(
                    null
                  );

                  setScreen(
                    "pharmacistBatchLookup"
                  );
                }}
              >
                <BatchLookupIcon />

                <div className="pharmacist-action-copy">
                  <strong>
                    Batch Lookup
                  </strong>

                  <span>
                    Check batch and
                    recall status
                  </span>
                </div>
              </button>

              <button
                type="button"
                className="pharmacist-action-card"
                onClick={() =>
                  setScreen(
                    "pharmacistRecalls"
                  )
                }
              >
                <RecallIcon />

                <div className="pharmacist-action-copy">
                  <strong>
                    Recalls & Alerts
                  </strong>

                  <span>
                    Review active
                    notices
                  </span>
                </div>
              </button>

              <button
                type="button"
                className="pharmacist-action-card"
                onClick={() =>
                  setScreen(
                    "pharmacistHistory"
                  )
                }
              >
                <HistoryIcon />

                <div className="pharmacist-action-copy">
                  <strong>
                    Verification History
                  </strong>

                  <span>
                    Review recent
                    checks
                  </span>
                </div>
              </button>

              <button
                type="button"
                className="pharmacist-action-card pharmacist-escalate-card"
                onClick={() => {
                  setReportOrigin(
                    "pharmacistDashboard"
                  );

                  setScreen(
                    "report"
                  );
                }}
              >
                <EscalateIcon />

                <div className="pharmacist-action-copy">
                  <strong>
                    Escalate / Report
                  </strong>

                  <span>
                    Report suspicious
                    medicine
                  </span>
                </div>
              </button>

            </div>

            <div className="pharmacist-summary">

              <PharmacistMetric
                label="Scans Today"
                value={
                  totals.scans
                }
              />

              <PharmacistMetric
                label="Pending Sync"
                value={
                  pendingSync
                }
              />

              <PharmacistMetric
                label="Recall Matches"
                value={
                  totals.recallMatches
                }
              />

              <PharmacistMetric
                label="No Match"
                value={
                  totals.noMatch
                }
              />

            </div>

            <div className="pharmacist-recent">

              <div className="section-heading-row">

                <h3>
                  Recent Activity
                </h3>

                <button
                  type="button"
                  className="text-action"
                  onClick={() =>
                    setScreen(
                      "pharmacistHistory"
                    )
                  }
                >
                  View All
                </button>

              </div>

              {pharmacistEvents
                .slice(0, 4)
                .map(
                  (event) => (
                    <div
                      className="recent-event-row"
                      key={
                        event.id
                      }
                    >
                      <div>

                        <strong>
                          {
                            event.medicine
                          }
                        </strong>

                        <span>
                          Batch{" "}
                          {
                            event.batch
                          }
                        </span>

                      </div>

                      <div className="recent-event-result">

                        <strong>
                          {resultLabel(
                            event.result
                          )}
                        </strong>

                        <span>
                          {formatEventTime(
                            event.timestamp
                          )}
                        </span>

                      </div>

                    </div>
                  )
                )}

            </div>

            <PharmacistNav
              screen={screen}
              setScreen={
                setScreen
              }
            />

          </section>
        )}

        {/* PROFILE */}

        {screen ===
          "pharmacistProfile" && (
          <section className="screen pharmacist-sub-screen">

            <BackButton
              onClick={goBack}
            />

            <div className="profile-page-header">

              <img
                className="profile-page-avatar"
                src={`${import.meta.env.BASE_URL}pharmacist-marie.png`}
                alt="Marie Nguyen"
              />

              <h1>
                {currentUser?.fullName ||
                  "Marie Nguyen"}
              </h1>

              <p>
                {currentUser?.title ||
                  "Registered Pharmacist"}
              </p>

              <span className="professional-status">
                Professional Account
              </span>

            </div>

            <div className="profile-information-card">

              <ProfileRow
                label="Name"
                value={
                  currentUser?.fullName ||
                  "Marie Nguyen"
                }
              />

              <ProfileRow
                label="Role"
                value="Pharmacist"
              />

              <ProfileRow
                label="Email"
                value={
                  currentUser?.email ||
                  "pharmacist@medauth.com"
                }
              />

              <ProfileRow
                label="Organisation"
                value={
                  currentUser?.organisation ||
                  "MedAuth Pharmacy Demo"
                }
              />

            </div>

            <div className="profile-note">

              <LockIcon />

              <span>
                Demo professional
                profile. No patient
                health information is
                stored.
              </span>

            </div>

          </section>
        )}

        {/* SETTINGS */}

        {screen ===
          "pharmacistSettings" && (
          <section className="screen pharmacist-sub-screen">

            <BackButton
              onClick={goBack}
            />

            <div className="eyebrow">
              Pharmacist account
            </div>

            <h1>
              Settings
            </h1>

            <div className="settings-card">

              <div className="settings-row">

                <div>

                  <strong>
                    Connection mode
                  </strong>

                  <span>
                    {offline
                      ? "Offline — cached data"
                      : "Online"}
                  </span>

                </div>

                <NetworkBadge
                  offline={
                    offline
                  }
                  onToggle={
                    handleNetworkToggle
                  }
                />

              </div>

              <div className="settings-row">

                <div>

                  <strong>
                    Pending sync
                  </strong>

                  <span>
                    Activity waiting
                    to synchronise
                  </span>

                </div>

                <span className="settings-value">
                  {pendingSync}
                </span>

              </div>

              <div className="settings-row">

                <div>

                  <strong>
                    Remember this device
                  </strong>

                  <span>
                    Keep demo sign-in
                    preference
                  </span>

                </div>

                <input
                  className="settings-checkbox"
                  type="checkbox"
                  checked={
                    rememberDevice
                  }
                  onChange={(
                    event
                  ) =>
                    setRememberDevice(
                      event.target.checked
                    )
                  }
                />

              </div>

            </div>

            <div className="settings-card">

              <button
                type="button"
                className="settings-link-row"
                onClick={() =>
                  setScreen(
                    "pharmacistProfile"
                  )
                }
              >
                <span>
                  My Profile
                </span>

                <span>
                  →
                </span>
              </button>

              <button
                type="button"
                className="settings-link-row"
                onClick={() => {
                  setResetEmail(
                    currentUser?.email ||
                    email
                  );

                  setResetSent(
                    false
                  );

                  setScreen(
                    "forgotPassword"
                  );
                }}
              >
                <span>
                  Change Password
                </span>

                <span>
                  →
                </span>
              </button>

            </div>

            <SecondaryButton
              onClick={reset}
            >
              Sign Out
            </SecondaryButton>

          </section>
        )}

        {/* BATCH LOOKUP */}

        {screen ===
          "pharmacistBatchLookup" && (
          <section className="screen">

            <BackButton
              onClick={goBack}
            />

            <div className="eyebrow">
              Pharmacist workflow
            </div>

            <h1>
              Batch Lookup
            </h1>

            <form
              onSubmit={
                handleBatchLookup
              }
            >
              <label className="field">

                Batch number

                <input
                  value={
                    batchSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setBatchSearch(
                      event.target.value
                    )
                  }
                  placeholder="e.g. B2020"
                  required
                />

              </label>

              <PrimaryButton
                type="submit"
              >
                Search Batch
              </PrimaryButton>

            </form>

            {batchResult && (
              <div className="batch-result-card">

                <div
                  className={`recall-status ${
                    batchResult.recall
                      ? "active"
                      : "clear"
                  }`}
                >
                  {batchResult.recall
                    ? "Active Recall"
                    : "No Active Recall"}
                </div>

                <Row
                  label="Batch"
                  value={
                    batchResult.batch
                  }
                />

                <Row
                  label="Medicine"
                  value={
                    batchResult.medicine
                      ? getMedicineName(
                          batchResult.medicine
                        )
                      : "No matching prototype medicine"
                  }
                />

                {batchResult.recall && (
                  <>
                    <Row
                      label="Recall date"
                      value={
                        batchResult.recall
                          .recallDate
                      }
                    />

                    <Row
                      label="Severity"
                      value={
                        batchResult.recall
                          .severity
                      }
                    />

                    <div className="recall-notice">

                      <strong>
                        Safety notice
                      </strong>

                      <p>
                        {
                          batchResult.recall
                            .reason
                        }
                      </p>

                    </div>
                  </>
                )}

              </div>
            )}

            <PharmacistNav
              screen={screen}
              setScreen={
                setScreen
              }
            />

          </section>
        )}

        {/* RECALLS */}

        {screen ===
          "pharmacistRecalls" && (
          <section className="screen">

            <BackButton
              onClick={goBack}
            />

            <div className="eyebrow">
              Pharmacist workflow
            </div>

            <h1>
              Recalls & Alerts
            </h1>

            <div className="recall-list">

              {prototypeRecalls.map(
                (recall) => (
                  <button
                    key={
                      recall.id
                    }
                    type="button"
                    className="recall-list-card"
                    onClick={() => {
                      setSelectedRecall(
                        recall
                      );

                      setScreen(
                        "pharmacistRecallDetail"
                      );
                    }}
                  >
                    <strong>
                      {
                        recall.medicineName
                      }
                    </strong>

                    <span>
                      Batch{" "}
                      {
                        recall.batch
                      }
                    </span>

                    <span className="recall-pill">
                      {
                        recall.status
                      }
                    </span>

                    <small>
                      {
                        recall.recallDate
                      }
                    </small>

                  </button>
                )
              )}

            </div>

            <PharmacistNav
              screen={screen}
              setScreen={
                setScreen
              }
            />

          </section>
        )}

        {/* RECALL DETAIL */}

        {screen ===
          "pharmacistRecallDetail" &&
          selectedRecall && (
            <section className="screen">

              <BackButton
                onClick={goBack}
              />

              <div className="eyebrow">
                Recall details
              </div>

              <h1>
                {
                  selectedRecall.medicineName
                }
              </h1>

              <div className="recall-status active">
                Active Recall
              </div>

              <div className="details-list">

                <Row
                  label="Batch"
                  value={
                    selectedRecall.batch
                  }
                />

                <Row
                  label="Recall date"
                  value={
                    selectedRecall.recallDate
                  }
                />

                <Row
                  label="Severity"
                  value={
                    selectedRecall.severity
                  }
                />

                <Row
                  label="Status"
                  value={
                    selectedRecall.status
                  }
                />

              </div>

              <div className="recall-notice">

                <strong>
                  Safety notice
                </strong>

                <p>
                  {
                    selectedRecall.reason
                  }
                </p>

              </div>

            </section>
          )}

        {/* HISTORY */}

        {screen ===
          "pharmacistHistory" && (
          <section className="screen">

            <BackButton
              onClick={goBack}
            />

            <div className="eyebrow">
              Pharmacist workflow
            </div>

            <h1>
              Verification History
            </h1>

            <div className="history-list">

              {pharmacistEvents.map(
                (event) => (
                  <div
                    className="history-card"
                    key={
                      event.id
                    }
                  >
                    <div className="history-card-head">

                      <strong>
                        {
                          event.medicine
                        }
                      </strong>

                      <span
                        className={`history-status history-${event.result.toLowerCase()}`}
                      >
                        {resultLabel(
                          event.result
                        )}
                      </span>

                    </div>

                    <Row
                      label="Batch"
                      value={
                        event.batch
                      }
                    />

                    <Row
                      label="Time"
                      value={
                        formatEventTime(
                          event.timestamp
                        )
                      }
                    />

                    <Row
                      label="Connection"
                      value={
                        event.offline
                          ? "Offline / Cached"
                          : "Online"
                      }
                    />

                  </div>
                )
              )}

            </div>

            <PharmacistNav
              screen={screen}
              setScreen={
                setScreen
              }
            />

          </section>
        )}

        {/* MANUFACTURER */}

        {screen ===
          "manufacturerDashboard" && (
          <section className="screen">

            <BackButton
              onClick={goBack}
            />

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

        {/* CONSUMER */}

        {screen ===
          "consumerDashboard" && (
          <section className="screen">

            <BackButton
              onClick={goBack}
            />

            <DashboardHeader
              title="My MedAuth"
              role="Consumer"
            />

            <div className="panel">

              <h3>
                Verify a medicine
              </h3>

              <PrimaryButton
                onClick={() =>
                  setScreen(
                    "scan"
                  )
                }
              >
                Scan Medicine
              </PrimaryButton>

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

            <BackButton
              onClick={goBack}
            />

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
    >
      ← Back
    </button>
  );
}

function ProfileRow({
  label,
  value,
}) {
  return (
    <div className="profile-row">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

function PharmacistMetric({
  label,
  value,
}) {
  return (
    <div className="pharmacist-metric">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

function PharmacistNav({
  screen,
  setScreen,
}) {
  const items = [
    {
      label: "Dashboard",
      screen:
        "pharmacistDashboard",
    },

    {
      label: "Verify",
      screen: "scan",
    },

    {
      label: "Batch",
      screen:
        "pharmacistBatchLookup",
    },

    {
      label: "Recalls",
      screen:
        "pharmacistRecalls",
    },

    {
      label: "History",
      screen:
        "pharmacistHistory",
    },
  ];

  return (
    <nav className="pharmacist-nav">

      {items.map(
        (item) => (
          <button
            key={
              item.screen
            }
            type="button"
            className={
              screen ===
              item.screen
                ? "active"
                : ""
            }
            onClick={() =>
              setScreen(
                item.screen
              )
            }
          >
            {item.label}
          </button>
        )
      )}

    </nav>
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

function ManufacturerDashboard({
  totals,
}) {
  return (
    <>
      <div className="metric-grid">

        <Metric
          label="Demo scans"
          value={
            totals.scans
          }
        />

        <Metric
          label="Matches"
          value={
            totals.match
          }
        />

        <Metric
          label="No matches"
          value={
            totals.noMatch
          }
        />

        <Metric
          label="Covered"
          value={
            totals.covered
          }
        />

      </div>

      <div className="panel">

        <h3>
          Products
        </h3>

        <p>
          SampleMed 10mg —
          enrolled
        </p>

        <p>
          HealthMed 20mg —
          enrolled
        </p>

      </div>
    </>
  );
}

function AdminDashboard() {
  return (
    <div className="panel">

      <h3>
        Report review
      </h3>

      <p>
        Prototype administration
        tools.
      </p>

    </div>
  );
}

/* ICONS */

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

function BatchLookupIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="10"
        cy="10"
        r="6"
      />

      <path d="m15 15 5 5" />
    </svg>
  );
}

function RecallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 3v3" />

      <path d="M6 10a6 6 0 0 1 12 0v4l2 3H4l2-3v-4Z" />

      <path d="M10 20h4" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />

      <path d="M3 4v5h5" />

      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function EscalateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 3 3 20h18L12 3Z" />

      <path d="M12 9v4" />

      <path d="M12 17h.01" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />

      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="3"
      />

      <circle
        cx="12"
        cy="12"
        r="8"
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

      <path d="M6 7c-2 2-3.5 5-3.5 5s3.5 6 9.5 6" />
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

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />

      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}
