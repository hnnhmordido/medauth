import { useMemo, useState } from "react";

import {
  medicines,
  demoEvents,
  findMedicine,
  findMedicineByBatch,
  getActiveRecalls,
} from "./data/medicines";

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

const shortageData = [
  {
    id: "SHORT-001",
    medicineName: "Amoxicillin 500mg",
    availability: "Available",
    status: "available",
    note: "Normal prototype availability",
  },
  {
    id: "SHORT-002",
    medicineName: "Ibuprofen 400mg",
    availability: "Low Stock",
    status: "low",
    note: "Limited prototype availability",
  },
  {
    id: "SHORT-003",
    medicineName: "Paracetamol 1g",
    availability: "Unavailable",
    status: "unavailable",
    note: "Currently unavailable in prototype data",
  },
];

function getMedicineName(
  product,
  fallback = "Medicine"
) {
  return (
    product?.medicineName ||
    product?.name ||
    product?.productName ||
    fallback
  );
}

function normaliseEvent(
  event,
  index = 0
) {
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

    productId:
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

    pendingSync:
      Boolean(
        event.pendingSync
      ),

    region:
      event.region ||
      event.location ||
      "",

    type:
      event.type ||
      "verification",

    channel:
      event.channel ||
      "PHARMACIST",
  };
}

function formatEventTime(
  timestamp
) {
  const date =
    new Date(timestamp);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return timestamp || "—";
  }

  return date.toLocaleString(
    [],
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function resultLabel(result) {
  switch (result) {
    case "MATCH":
      return "Data match found";

    case "NO_MATCH":
      return "No Match";

    case "RECALL_CHECK":
      return "Recall checked";

    default:
      return "Unable to Verify";
  }
}

function verifyMedicine(
  identifier,
  batch,
  offline
) {
  const normalizedIdentifier =
    identifier
      ?.trim()
      .toUpperCase();

  const normalizedBatch =
    batch
      ?.trim()
      .toUpperCase();

  const product =
    findMedicine(
      normalizedIdentifier
    );

  if (!product) {
    return {
      status: "NOT_COVERED",
      product: null,
      scannedCode:
        normalizedIdentifier,
      scannedBatch:
        normalizedBatch,
      offline,
      mismatchField: null,
    };
  }

  if (
    offline &&
    !product.cached
  ) {
    return {
      status: "NOT_COVERED",
      product,
      scannedCode:
        normalizedIdentifier,
      scannedBatch:
        normalizedBatch,
      offline: true,
      mismatchField: null,
    };
  }

  if (
    product.coverageStatus !==
    "ENROLLED"
  ) {
    return {
      status: "NOT_COVERED",
      product,
      scannedCode:
        normalizedIdentifier,
      scannedBatch:
        normalizedBatch,
      offline,
      mismatchField: null,
    };
  }

  if (
    normalizedBatch &&
    normalizedBatch !==
      product.batch.toUpperCase()
  ) {
    return {
      status: "NO_MATCH",
      product,
      scannedCode:
        normalizedIdentifier,
      scannedBatch:
        normalizedBatch,
      registeredBatch:
        product.batch,
      offline,
      mismatchField:
        "batch",
    };
  }

  return {
    status: "MATCH",
    product,
    scannedCode:
      normalizedIdentifier,
    scannedBatch:
      normalizedBatch ||
      product.batch,
    offline,
    mismatchField: null,
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
    batchProductCode,
    setBatchProductCode,
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

  const [
    reports,
    setReports,
  ] = useState([]);

  const [
    reportOrigin,
    setReportOrigin,
  ] = useState("result");

  const activeRecalls =
    useMemo(
      () =>
        getActiveRecalls(),
      []
    );

  const pharmacistEvents =
    useMemo(() => {
      return verificationEvents
        .map(
          (
            event,
            index
          ) =>
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
    }, [
      verificationEvents,
    ]);

  const totals =
    useMemo(
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
          activeRecalls.length,
      }),
      [
        pharmacistEvents,
        activeRecalls,
      ]
    );

  const handleNetworkToggle =
    () => {
      if (!offline) {
        setOffline(true);
        return;
      }

      setOffline(false);

      if (
        pendingSync > 0
      ) {
        setSyncing(true);

        window.setTimeout(
          () => {
            setVerificationEvents(
              (current) =>
                current.map(
                  (event) => ({
                    ...event,
                    pendingSync:
                      false,
                  })
                )
            );

            setPendingSync(0);
            setSyncing(false);
          },
          900
        );
      }
    };

  const handleHomeLogin =
    (event) => {
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

      switch (
        user.role
      ) {
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

      if (
        !resetEmail.trim()
      ) {
        return;
      }

      setResetSent(true);
    };

  const runVerification =
    (
      nextCode = code,
      nextBatch = batch
    ) => {
      setScreen(
        "checking"
      );

      window.setTimeout(
        () => {
          const verification =
            verifyMedicine(
              nextCode,
              nextBatch,
              offline
            );

          setResult(
            verification
          );

          const product =
            verification.product;

          const event = {
            id:
              `VE-${Date.now()}`,

            timestamp:
              new Date()
                .toISOString(),

            code:
              product?.code ||
              nextCode
                ?.trim()
                .toUpperCase(),

            productId:
              product
                ?.productId ||
              nextCode,

            medicine:
              product
                ?.medicineName ||
              "Unknown medicine",

            batch:
              nextBatch
                ?.trim()
                .toUpperCase() ||
              product
                ?.batch ||
              "—",

            result:
              verification.status,

            channel:
              role ===
              "pharmacist"
                ? "PHARMACIST"
                : "CONSUMER",

            offline,

            pendingSync:
              offline,

            region:
              product
                ?.coarseRegion ||
              "",

            type:
              "verification",
          };

          setVerificationEvents(
            (current) => [
              event,
              ...current,
            ]
          );

          if (offline) {
            setPendingSync(
              (current) =>
                current + 1
            );
          }

          setScreen(
            "result"
          );
        },
        650
      );
    };

  const handleBatchLookup =
    (event) => {
      event.preventDefault();

      const normalizedBatch =
        batchSearch
          .trim()
          .toUpperCase();

      if (
        !normalizedBatch
      ) {
        return;
      }

      const productFromCode =
        batchProductCode
          ? findMedicine(
              batchProductCode
            )
          : null;

      const productFromBatch =
        findMedicineByBatch(
          normalizedBatch
        );

      const registeredProduct =
        productFromCode ||
        result?.product ||
        productFromBatch;

      const recall =
        registeredProduct
          ?.recall?.active
          ? {
              active: true,
              medicineName:
                registeredProduct
                  .medicineName,
              batch:
                registeredProduct
                  .batch,
              recallDate:
                registeredProduct
                  .recall
                  .recallDate,
              severity:
                registeredProduct
                  .recall
                  .severity,
              status:
                registeredProduct
                  .recall
                  .status,
              reason:
                registeredProduct
                  .recall
                  .reason,
            }
          : null;

      setBatchResult({
        batch:
          normalizedBatch,
        medicine:
          registeredProduct,
        recall,
      });
    };

  const submitReport =
    () => {
      const reference =
        `MA-2026-${Math.floor(
          10000 +
            Math.random() *
              89999
        )}`;

      const newReport = {
        id:
          reference,

        code:
          result
            ?.product
            ?.code ||
          code,

        productId:
          result
            ?.product
            ?.productId ||
          code,

        medicine:
          result
            ?.product
            ?.medicineName ||
          "Unknown medicine",

        batch:
          result
            ?.scannedBatch ||
          batch,

        verificationResult:
          result
            ?.status ||
          "",

        comment:
          reportComment,

        location:
          reportLocation,

        imageName:
          reportImageName,

        createdAt:
          new Date()
            .toISOString(),

        status:
          "New",

        role:
          role ||
          "guest",
      };

      setReportRef(
        reference
      );

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
    setScreen(
      "home"
    );

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
    setReportOrigin(
      "result"
    );

    setResetEmail("");
    setResetSent(false);

    setBatchSearch("");
    setBatchProductCode("");
    setBatchResult(null);
    setSelectedRecall(null);
  };

  const goBack = () => {
    switch (
      screen
    ) {
      case "scan":
      case "manual":
      case "result":
        if (
          role ===
          "pharmacist"
        ) {
          setScreen(
            "pharmacistDashboard"
          );
        } else {
          setScreen(
            "home"
          );
        }
        break;

      case "details":
        setScreen(
          "result"
        );
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
          setScreen(
            "result"
          );
        }
        break;

      case "pharmacistBatchLookup":
      case "pharmacistRecalls":
      case "pharmacistHistory":
      case "pharmacistShortages":
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
        setScreen(
          "home"
        );
        break;

      case "manufacturerDashboard":
      case "consumerDashboard":
      case "adminDashboard":
      case "pharmacistDashboard":
        setScreen(
          "home"
        );
        break;

      default:
        setScreen(
          "home"
        );
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

        {/* ================= HOME ================= */}

        {screen === "home" && (
          <section className="screen home-screen">

            <div className="home-status-row">
              <NetworkBadge
                offline={
                  offline
                }
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
                setScreen(
                  "scan"
                )
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
                  value={
                    email
                  }
                  onChange={(
                    event
                  ) => {
                    setEmail(
                      event.target
                        .value
                    );

                    setLoginError(
                      ""
                    );
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
                    value={
                      password
                    }
                    onChange={(
                      event
                    ) => {
                      setPassword(
                        event
                          .target
                          .value
                      );

                      setLoginError(
                        ""
                      );
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
                        (
                          current
                        ) =>
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
                        event
                          .target
                          .checked
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

        {/* ================= FORGOT ================= */}

        {screen === "forgotPassword" && (
          <section className="screen forgot-screen">

            <BackButton
              onClick={
                goBack
              }
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
                  Enter the email address linked to your MedAuth account.
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
                          event
                            .target
                            .value
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
                  If an account exists for{" "}
                  <strong>
                    {resetEmail}
                  </strong>
                  , reset instructions have been requested.
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

        {/* ================= SCAN ================= */}

        {screen === "scan" && (
          <section className="screen">

            <BackButton
              onClick={
                goBack
              }
            />

            <div className="eyebrow">
              {role ===
              "pharmacist"
                ? "Pharmacist verification"
                : "Guest verification"}
            </div>

            <h1>
              Scan & Verify Medication
            </h1>

            <p>
              Check medicine information using barcode or manual entry · Prototype verification
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
                MED-001 / B1001 — Data match found
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
                MED-002 / B2045 — No Match
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
                MED-003 — Not Yet Covered
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

        {/* ================= MANUAL ================= */}

        {screen === "manual" && (
          <section className="screen">

            <BackButton
              onClick={
                goBack
              }
            />

            <div className="eyebrow">
              Manual verification
            </div>

            <h1>
              Enter medicine code
            </h1>

            <label className="field">

              Product identifier

              <input
                value={
                  code
                }
                onChange={(
                  event
                ) =>
                  setCode(
                    event.target
                      .value
                  )
                }
                placeholder="e.g. MED-001"
              />

            </label>

            <label className="field">

              Batch (optional)

              <input
                value={
                  batch
                }
                onChange={(
                  event
                ) =>
                  setBatch(
                    event.target
                      .value
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

        {/* ================= CHECKING ================= */}

        {screen === "checking" && (
          <section className="screen center-screen">

            <div className="loader" />

            <h1>
              Checking medicine…
            </h1>

            <p>
              Comparing product and batch information with the MedAuth prototype dataset.
            </p>

          </section>
        )}

        {/* ================= RESULT ================= */}

        {screen === "result" &&
          result && (
            <section className="screen">

              <BackButton
                onClick={
                  goBack
                }
              />

              {result.status === "MATCH" && (
                <>
                  <StatusCard
                    status="MATCH"
                    title={
                      result.offline
                        ? "Data match found — Offline"
                        : "Data match found"
                    }
                    text="The scanned code and batch match information registered in MedAuth."
                  />

                  <MedicineResultDetails
                    product={
                      result.product
                    }
                    scannedBatch={
                      result.scannedBatch
                    }
                  />

                  <div className="verification-info-box">

                    <strong>
                      What this means
                    </strong>

                    <p>
                      This result confirms that the scanned information matches the registered prototype record. It does not guarantee that the medicine is authentic or safe to use.
                    </p>

                  </div>

                  <SupplyChainSnapshot
                    product={
                      result.product
                    }
                    result={
                      result
                    }
                  />

                  {result.offline && (
                    <div className="offline-result-notice">

                      <strong>
                        Offline Mode — Cached Data
                      </strong>

                      <span>
                        Pending Sync. This verification will synchronise when the prototype returns online.
                      </span>

                    </div>
                  )}

                  <div className="action-stack">

                    <PrimaryButton
                      onClick={() =>
                        setScreen(
                          "details"
                        )
                      }
                    >
                      View Medicine Details
                    </PrimaryButton>

                    {role ===
                      "pharmacist" && (
                      <SecondaryButton
                        onClick={() =>
                          setScreen(
                            "pharmacistDashboard"
                          )
                        }
                      >
                        Back to Pharmacist Dashboard
                      </SecondaryButton>
                    )}

                  </div>
                </>
              )}

              {result.status === "NO_MATCH" && (
                <>
                  <StatusCard
                    status="NO_MATCH"
                    title="No Match"
                    text="The scanned information does not fully match the product or batch information registered in MedAuth."
                  />

                  <MedicineResultDetails
                    product={
                      result.product
                    }
                    scannedBatch={
                      result.scannedBatch
                    }
                  />

                  <div className="verification-warning-box">

                    <strong>
                      Important
                    </strong>

                    <p>
                      A No Match result does not confirm that this medicine is counterfeit.
                    </p>

                  </div>

                  <SupplyChainSnapshot
                    product={
                      result.product
                    }
                    result={
                      result
                    }
                  />

                  <div className="action-stack">

                    <PrimaryButton
                      onClick={() => {
                        setBatchSearch(
                          result.scannedBatch ||
                            ""
                        );

                        setBatchProductCode(
                          result.product
                            ?.code ||
                            ""
                        );

                        setBatchResult(
                          null
                        );

                        setScreen(
                          "pharmacistBatchLookup"
                        );
                      }}
                    >
                      Check Batch / Recall
                    </PrimaryButton>

                    <SecondaryButton
                      onClick={() => {
                        setReportOrigin(
                          "result"
                        );

                        setScreen(
                          "report"
                        );
                      }}
                    >
                      Report Concern
                    </SecondaryButton>

                    {role ===
                      "pharmacist" && (
                      <SecondaryButton
                        onClick={() => {
                          setReportOrigin(
                            "result"
                          );

                          setScreen(
                            "report"
                          );
                        }}
                      >
                        Escalate
                      </SecondaryButton>
                    )}

                    {role ===
                      "pharmacist" && (
                      <SecondaryButton
                        onClick={() =>
                          setScreen(
                            "pharmacistDashboard"
                          )
                        }
                      >
                        Back to Pharmacist Dashboard
                      </SecondaryButton>
                    )}

                  </div>
                </>
              )}

              {result.status === "NOT_COVERED" && (
                <>
                  <StatusCard
                    status="NOT_COVERED"
                    title="Unable to Verify"
                    text="MedAuth does not currently have enough prototype information to verify this medicine."
                  />

                  <div className="verification-info-box">

                    <strong>
                      What this means
                    </strong>

                    <p>
                      This does not mean the medicine is counterfeit.
                    </p>

                  </div>

                  <SupplyChainSnapshot
                    product={
                      result.product
                    }
                    result={
                      result
                    }
                  />

                  <div className="action-stack">

                    <PrimaryButton
                      onClick={() =>
                        setScreen(
                          "scan"
                        )
                      }
                    >
                      Try Another Scan
                    </PrimaryButton>

                    <SecondaryButton
                      onClick={() =>
                        setScreen(
                          "manual"
                        )
                      }
                    >
                      Enter Code Manually
                    </SecondaryButton>

                    <SecondaryButton
                      onClick={() => {
                        setReportOrigin(
                          "result"
                        );

                        setScreen(
                          "report"
                        );
                      }}
                    >
                      Report Concern
                    </SecondaryButton>

                    {role ===
                      "pharmacist" && (
                      <SecondaryButton
                        onClick={() =>
                          setScreen(
                            "pharmacistDashboard"
                          )
                        }
                      >
                        Back to Pharmacist Dashboard
                      </SecondaryButton>
                    )}

                  </div>
                </>
              )}

            </section>
          )}

        {/* ================= DETAILS ================= */}

        {screen === "details" &&
          result?.product && (
            <section className="screen">

              <BackButton
                onClick={
                  goBack
                }
              />

              <div className="eyebrow">
                Medicine details
              </div>

              <h1>
                {result.product
                  .medicineName}
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
                  label="Product identifier"
                  value={
                    result.product
                      .productId
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
                      .expiry
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
                  label="Source"
                  value={
                    result.product
                      .source
                  }
                />

                <Row
                  label="Last updated"
                  value={
                    result.product
                      .lastUpdated
                      ?.replace(
                        "T",
                        " "
                      )
                  }
                />

              </div>

              <SecondaryButton
                onClick={() =>
                  setScreen(
                    "result"
                  )
                }
              >
                Back to Result
              </SecondaryButton>

            </section>
          )}

        {/* ================= REPORT ================= */}

        {screen === "report" && (
          <section className="screen">

            <BackButton
              onClick={
                goBack
              }
            />

            <div className="eyebrow">
              Suspicious medicine report
            </div>

            <h1>
              Report a concern
            </h1>

            <p>
              Prototype only. This report is saved locally in the MedAuth demo.
            </p>

            <label className="field">

              Medicine

              <input
                value={
                  result?.product
                    ?.medicineName ||
                  "Unknown medicine"
                }
                readOnly
              />

            </label>

            <label className="field">

              Product ID

              <input
                value={
                  result?.product
                    ?.productId ||
                  code
                }
                readOnly
              />

            </label>

            <label className="field">

              Batch

              <input
                value={
                  result
                    ?.scannedBatch ||
                  batch
                }
                readOnly
              />

            </label>

            <label className="field">

              Verification result

              <input
                value={
                  result
                    ? resultLabel(
                        result.status
                      )
                    : ""
                }
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
                    event.target
                      .value
                  )
                }
                rows="4"
                placeholder="Example: Packaging or batch information looks different."
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
                      ?.name ||
                      ""
                  )
                }
              />

            </label>

            <label className="field">

              Coarse location (optional)

              <input
                value={
                  reportLocation
                }
                onChange={(
                  event
                ) =>
                  setReportLocation(
                    event.target
                      .value
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

        {/* ================= CONFIRMATION ================= */}

        {screen === "confirmation" && (
          <section className="screen center-screen">

            <div className="success-badge">
              ✓
            </div>

            <h1>
              Report submitted
            </h1>

            <p>
              Prototype reference:{" "}
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
                onClick={
                  reset
                }
              >
                Return Home
              </PrimaryButton>
            )}

          </section>
        )}

        {/* ================= PHARMACIST ================= */}

        {screen === "pharmacistDashboard" && (
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
                    {currentUser
                      ?.name ||
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
                    ? "Offline Mode — Cached Data"
                    : syncing
                    ? "Synchronising…"
                    : "System Online"}
                </strong>

                {pendingSync > 0 && (
                  <span>
                    Pending Sync:{" "}
                    {pendingSync}
                  </span>
                )}

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

            <button
              type="button"
              className="pharmacist-primary-action"
              onClick={() =>
                setScreen(
                  "scan"
                )
              }
            >
              <ScanIcon />

              <div>
                <strong>
                  Verify Medicine
                </strong>

                <span>
                  Scan or enter a medicine code
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
                  setBatchSearch(
                    ""
                  );

                  setBatchProductCode(
                    ""
                  );

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
                    Check batch and recall status
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
                    Review active notices
                  </span>
                </div>
              </button>

              <button
                type="button"
                className="pharmacist-action-card"
                onClick={() =>
                  setScreen(
                    "pharmacistShortages"
                  )
                }
              >
                <ShortagesIcon />

                <div className="pharmacist-action-copy">
                  <strong>
                    Shortages
                  </strong>

                  <span>
                    Current availability
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
                    Report suspicious medicine
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
              screen={
                screen
              }
              setScreen={
                setScreen
              }
            />

          </section>
        )}

        {/* ================= BATCH ================= */}

        {screen === "pharmacistBatchLookup" && (
          <section className="screen">

            <BackButton
              onClick={
                goBack
              }
            />

            <div className="eyebrow">
              Pharmacist workflow
            </div>

            <h1>
              Batch Lookup
            </h1>

            {batchProductCode && (
              <div className="notice">
                Product:{" "}
                <strong>
                  {batchProductCode}
                </strong>
              </div>
            )}

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
                      event.target
                        .value
                    )
                  }
                  placeholder="e.g. B2000"
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
                    batchResult
                      .recall
                      ? "active"
                      : "clear"
                  }`}
                >
                  {batchResult
                    .recall
                    ? "Active Recall"
                    : "No Active Recall"}
                </div>

                <Row
                  label="Scanned batch"
                  value={
                    batchResult
                      .batch
                  }
                />

                <Row
                  label="Medicine"
                  value={
                    batchResult
                      .medicine
                      ? batchResult
                          .medicine
                          .medicineName
                      : "No prototype medicine found"
                  }
                />

                {batchResult
                  .medicine && (
                  <Row
                    label="Registered batch"
                    value={
                      batchResult
                        .medicine
                        .batch
                    }
                  />
                )}

                {batchResult
                  .recall && (
                  <>
                    <Row
                      label="Recall date"
                      value={
                        batchResult
                          .recall
                          .recallDate
                      }
                    />

                    <Row
                      label="Severity"
                      value={
                        batchResult
                          .recall
                          .severity
                      }
                    />

                    <div className="recall-notice">

                      <strong>
                        Safety notice
                      </strong>

                      <p>
                        {
                          batchResult
                            .recall
                            .reason
                        }
                      </p>

                    </div>
                  </>
                )}

              </div>
            )}

            <PharmacistNav
              screen={
                screen
              }
              setScreen={
                setScreen
              }
            />

          </section>
        )}

        {/* ================= RECALLS ================= */}

        {screen === "pharmacistRecalls" && (
          <section className="screen">

            <BackButton
              onClick={
                goBack
              }
            />

            <div className="eyebrow">
              Pharmacist workflow
            </div>

            <h1>
              Recalls & Alerts
            </h1>

            <div className="recall-list">

              {activeRecalls.map(
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
              screen={
                screen
              }
              setScreen={
                setScreen
              }
            />

          </section>
        )}

        {/* ================= RECALL DETAIL ================= */}

        {screen === "pharmacistRecallDetail" &&
          selectedRecall && (
            <section className="screen">

              <BackButton
                onClick={
                  goBack
                }
              />

              <div className="eyebrow">
                Recall details
              </div>

              <h1>
                {
                  selectedRecall
                    .medicineName
                }
              </h1>

              <div className="recall-status active">
                Active Recall
              </div>

              <div className="details-list">

                <Row
                  label="Batch"
                  value={
                    selectedRecall
                      .batch
                  }
                />

                <Row
                  label="Recall date"
                  value={
                    selectedRecall
                      .recallDate
                  }
                />

                <Row
                  label="Severity"
                  value={
                    selectedRecall
                      .severity
                  }
                />

                <Row
                  label="Status"
                  value={
                    selectedRecall
                      .status
                  }
                />

              </div>

              <div className="recall-notice">

                <strong>
                  Safety notice
                </strong>

                <p>
                  {
                    selectedRecall
                      .reason
                  }
                </p>

              </div>

            </section>
          )}

        {/* ================= SHORTAGES ================= */}

        {screen === "pharmacistShortages" && (
          <section className="screen">

            <BackButton
              onClick={
                goBack
              }
            />

            <div className="eyebrow">
              Pharmacist workflow
            </div>

            <h1>
              Shortages
            </h1>

            <p>
              Current medicine availability from the MedAuth prototype data.
            </p>

            <div className="shortage-list">

              {shortageData.map(
                (item) => (
                  <div
                    className="shortage-card"
                    key={
                      item.id
                    }
                  >
                    <div>

                      <strong>
                        {
                          item.medicineName
                        }
                      </strong>

                      <span>
                        {
                          item.note
                        }
                      </span>

                    </div>

                    <span
                      className={`availability-badge ${item.status}`}
                    >
                      {
                        item.availability
                      }
                    </span>

                  </div>
                )
              )}

            </div>

            <PharmacistNav
              screen={
                screen
              }
              setScreen={
                setScreen
              }
            />

          </section>
        )}

        {/* ================= HISTORY ================= */}

        {screen === "pharmacistHistory" && (
          <section className="screen">

            <BackButton
              onClick={
                goBack
              }
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
                      label="Product"
                      value={
                        event.productId ||
                        event.code
                      }
                    />

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
                      label="Channel"
                      value={
                        event.channel
                      }
                    />

                    <Row
                      label="Connection"
                      value={
                        event.offline
                          ? event.pendingSync
                            ? "Offline · Pending Sync"
                            : "Offline · Synced"
                          : "Online"
                      }
                    />

                    {event.region && (
                      <Row
                        label="Region"
                        value={
                          event.region
                        }
                      />
                    )}

                  </div>
                )
              )}

            </div>

            <PharmacistNav
              screen={
                screen
              }
              setScreen={
                setScreen
              }
            />

          </section>
        )}

        {/* ================= PROFILE ================= */}

        {screen === "pharmacistProfile" && (
          <section className="screen pharmacist-sub-screen">

            <BackButton
              onClick={
                goBack
              }
            />

            <div className="profile-page-header">

              <img
                className="profile-page-avatar"
                src={`${import.meta.env.BASE_URL}pharmacist-marie.png`}
                alt="Marie Nguyen"
              />

              <h1>
                {currentUser
                  ?.fullName ||
                  "Marie Nguyen"}
              </h1>

              <p>
                {currentUser
                  ?.title ||
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
                  currentUser
                    ?.fullName ||
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
                  currentUser
                    ?.email ||
                  "pharmacist@medauth.com"
                }
              />

              <ProfileRow
                label="Organisation"
                value={
                  currentUser
                    ?.organisation ||
                  "MedAuth Pharmacy Demo"
                }
              />

            </div>

            <div className="profile-note">

              <LockIcon />

              <span>
                Demo professional profile. No patient health information is stored.
              </span>

            </div>

          </section>
        )}

        {/* ================= SETTINGS ================= */}

        {screen === "pharmacistSettings" && (
          <section className="screen pharmacist-sub-screen">

            <BackButton
              onClick={
                goBack
              }
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
                    Activity waiting to synchronise
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
                    Keep demo sign-in preference
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
                      event.target
                        .checked
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
                    currentUser
                      ?.email ||
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
              onClick={
                reset
              }
            >
              Sign Out
            </SecondaryButton>

          </section>
        )}

        {/* ================= MANUFACTURER ================= */}

        {screen === "manufacturerDashboard" && (
          <section className="screen">

            <BackButton
              onClick={
                goBack
              }
            />

            <DashboardHeader
              title="Manufacturer"
              role="Manufacturer"
            />

            <ManufacturerDashboard
              totals={
                totals
              }
            />

            <SecondaryButton
              onClick={
                reset
              }
            >
              Sign Out
            </SecondaryButton>

          </section>
        )}

        {/* ================= CONSUMER ================= */}

        {screen === "consumerDashboard" && (
          <section className="screen">

            <BackButton
              onClick={
                goBack
              }
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
              onClick={
                reset
              }
            >
              Sign Out
            </SecondaryButton>

          </section>
        )}

        {/* ================= ADMIN ================= */}

        {screen === "adminDashboard" && (
          <section className="screen">

            <BackButton
              onClick={
                goBack
              }
            />

            <DashboardHeader
              title="Administration"
              role="Admin"
            />

            <AdminDashboard />

            <SecondaryButton
              onClick={
                reset
              }
            >
              Sign Out
            </SecondaryButton>

          </section>
        )}

      </main>
    </div>
  );
}

function MedicineResultDetails({
  product,
  scannedBatch,
}) {
  if (!product) {
    return null;
  }

  return (
    <div className="verification-details-card">

      <Row
        label="Medicine"
        value={
          product.medicineName
        }
      />

      <Row
        label="Manufacturer"
        value={
          product.manufacturer
        }
      />

      <Row
        label="Product identifier"
        value={
          product.productId
        }
      />

      <Row
        label="Batch"
        value={
          scannedBatch ||
          product.batch
        }
      />

      <Row
        label="Expiry"
        value={
          product.expiry
        }
      />

      <Row
        label="Country"
        value={
          product.countryOfOrigin
        }
      />

      <Row
        label="Source"
        value={
          product.source ||
          "MedAuth prototype dataset"
        }
      />

      <Row
        label="Last updated"
        value={
          product.lastUpdated
            ?.replace(
              "T",
              " "
            )
        }
      />

    </div>
  );
}

function SupplyChainSnapshot({
  product,
  result,
}) {
  if (
    !product ||
    result.status ===
      "NOT_COVERED" ||
    !product.supplyChain
  ) {
    return (
      <div className="supply-chain-card">

        <div className="section-heading-row">

          <div>

            <h3>
              Supply Chain Snapshot
            </h3>

            <span className="prototype-label">
              Prototype information
            </span>

          </div>

        </div>

        <div className="supply-unavailable-row">

          <span>
            Product record
          </span>

          <strong>
            Not available
          </strong>

        </div>

        <div className="supply-unavailable-row">

          <span>
            Batch record
          </span>

          <strong>
            Not available
          </strong>

        </div>

        <div className="supply-unavailable-row">

          <span>
            Supply-chain history
          </span>

          <strong>
            Not Yet Covered
          </strong>

        </div>

        <p className="supply-chain-note">
          Supply-chain information is unavailable for this product in the current MedAuth prototype dataset.
        </p>

      </div>
    );
  }

  return (
    <div className="supply-chain-card">

      <div className="section-heading-row">

        <div>

          <h3>
            Supply Chain Snapshot
          </h3>

          <span className="prototype-label">
            Prototype / sample information
          </span>

        </div>

      </div>

      <div className="supply-chain-timeline">

        {product.supplyChain.map(
          (stage) => {
            const mismatch =
              result.status ===
                "NO_MATCH" &&
              result.mismatchField ===
                "batch" &&
              stage.stage ===
                "At Pharmacy";

            return (
              <div
                key={
                  stage.id
                }
                className={`supply-chain-stage ${
                  mismatch
                    ? "mismatch"
                    : ""
                }`}
              >
                <div className="supply-stage-marker">

                  {mismatch
                    ? "!"
                    : stage.status ===
                      "PENDING"
                    ? "○"
                    : "✓"}

                </div>

                <div className="supply-stage-content">

                  <div className="supply-stage-heading">

                    <strong>
                      {mismatch
                        ? "Batch / Pharmacy Record"
                        : stage.stage}
                    </strong>

                    <span
                      className={`supply-stage-status ${
                        mismatch
                          ? "mismatch"
                          : stage.status.toLowerCase()
                      }`}
                    >
                      {mismatch
                        ? "MISMATCH"
                        : stage.status ===
                          "CURRENT"
                        ? "CURRENT LOCATION"
                        : stage.status}
                    </span>

                  </div>

                  {stage.organisation && (
                    <span>
                      {
                        stage.organisation
                      }
                    </span>
                  )}

                  {stage.date && (
                    <small>
                      {
                        stage.date
                      }
                    </small>
                  )}

                  {stage.detail && (
                    <small>
                      {
                        stage.detail
                      }
                    </small>
                  )}

                  {mismatch && (
                    <p>
                      Scanned batch{" "}
                      <strong>
                        {
                          result.scannedBatch
                        }
                      </strong>{" "}
                      differs from registered batch{" "}
                      <strong>
                        {
                          product.batch
                        }
                      </strong>
                      .
                    </p>
                  )}

                </div>

              </div>
            );
          }
        )}

      </div>

      {result.status ===
        "NO_MATCH" && (
        <p className="supply-chain-warning">
          A difference was found between the scanned information and the registered prototype record.
        </p>
      )}

      <p className="supply-chain-note">
        This is prototype/sample supply-chain information and is not a real blockchain record.
      </p>

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
      onClick={
        onClick
      }
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
      label:
        "Dashboard",
      screen:
        "pharmacistDashboard",
    },
    {
      label:
        "Verify",
      screen:
        "scan",
    },
    {
      label:
        "Batch",
      screen:
        "pharmacistBatchLookup",
    },
    {
      label:
        "Recalls",
      screen:
        "pharmacistRecalls",
    },
    {
      label:
        "History",
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
            {
              item.label
            }
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
        {value ||
          "—"}
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
          SampleMed 10mg — enrolled
        </p>

        <p>
          HealthMed 20mg — enrolled
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
        Prototype administration tools.
      </p>

    </div>
  );
}

/* ================= ICONS ================= */

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

function ShortagesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="3"
        width="12"
        height="18"
        rx="2"
      />
      <path d="M9 7h6" />
      <path d="M9 11h6" />
      <path d="M9 15h3" />
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
