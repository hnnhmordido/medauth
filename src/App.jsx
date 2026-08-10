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

function verifyMedicine(code, batch, offline) {
  const product =
    medicines[code?.trim().toUpperCase()];

  if (
    offline &&
    code?.trim().toUpperCase() !== "MED-001"
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
    batch?.trim() &&
    batch.trim().toUpperCase() !== product.batch
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

  const [role, setRole] = useState("manufacturer");

  const [reportRef, setReportRef] = useState("");

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

    setReportRef("");
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
      {/* TOP CONNECTION STATUS */}

      <header className="topbar">
        <div
          className="topbar-spacer"
          aria-hidden="true"
        />

        <NetworkBadge
          offline={offline}
          onToggle={() =>
            setOffline(
              (current) => !current
            )
          }
        />
      </header>

      <main className="phone-stage">

        {/* ==============================
            HOME
        ============================== */}

        {screen === "home" && (
          <section className="screen home-screen">

            <div className="home-brand">
              <img
                className="hero-logo"
                src={`${import.meta.env.BASE_URL}medauth-logo.png`}
                alt="MedAuth"
              />
            </div>

            <div className="home-actions">

              <PrimaryButton
                onClick={() =>
                  setScreen("scan")
                }
              >
                Scan Medicine
              </PrimaryButton>

              <SecondaryButton
                onClick={() =>
                  setScreen("manual")
                }
              >
                Enter Code Instead
              </SecondaryButton>

              <button
                className="login-link"
                type="button"
                onClick={() =>
                  setScreen("login")
                }
              >
                Log In
              </button>

            </div>

          </section>
        )}

        {/* ==============================
            SCANNER
        ============================== */}

        {screen === "scan" && (
          <section className="screen">

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

        {/* ==============================
            MANUAL ENTRY
        ============================== */}

        {screen === "manual" && (
          <section className="screen">

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

            <p className="hint">
              Try MED-001/B1001,
              MED-002/B2045,
              or MED-003.
            </p>

          </section>
        )}

        {/* ==============================
            CHECKING
        ============================== */}

        {screen === "checking" && (
          <section
            className="
              screen
              center-screen
            "
          >

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

        {/* ==============================
            RESULT
        ============================== */}

        {screen === "result" &&
          result && (
            <section className="screen">

              {result.status ===
                "MATCH" && (
                <StatusCard
                  status="MATCH"
                  title="Match"
                  text="
                    This code and batch
                    match the prototype
                    record.
                  "
                />
              )}

              {result.status ===
                "NO_MATCH" && (
                <StatusCard
                  status="NO_MATCH"
                  title="No Match"
                  text="
                    The code was found,
                    but the batch does
                    not match the
                    prototype record.
                  "
                />
              )}

              {result.status ===
                "NOT_COVERED" && (
                <StatusCard
                  status="NOT_COVERED"
                  title="Unable to Verify"
                  text="
                    This product is not
                    yet covered by the
                    prototype data.
                    This does not mean
                    it is counterfeit.
                  "
                />
              )}

              {result.offline && (
                <div className="notice">
                  Offline result:
                  cached prototype data
                  may be used. Sync will
                  resume when online.
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
                    onClick={() =>
                      setScreen(
                        "report"
                      )
                    }
                  >
                    Report Medicine
                  </PrimaryButton>
                )}

                {result.status !==
                  "MATCH" && (
                  <SecondaryButton
                    onClick={() =>
                      alert(
                        "Prototype action: contact a qualified pharmacist."
                      )
                    }
                  >
                    Contact Pharmacist
                  </SecondaryButton>
                )}

                <SecondaryButton
                  onClick={reset}
                >
                  Done
                </SecondaryButton>

              </div>

            </section>
          )}

        {/* ==============================
            MEDICINE DETAILS
        ============================== */}

        {screen === "details" &&
          result?.product && (
            <section className="screen">

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

        {/* ==============================
            REPORT
        ============================== */}

        {screen === "report" && (
          <section className="screen">

            <div className="eyebrow">
              Suspicious medicine report
            </div>

            <h1>
              Tell us what looks wrong
            </h1>

            <div className="notice">
              Prototype only.
              Do not enter real
              personal or health
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
                placeholder="
                  Example: Packaging
                  looks different.
                "
                rows="4"
              />

            </label>

            <label className="field">

              Coarse location
              (optional)

              <input
                placeholder="
                  e.g. Adelaide SA
                "
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

        {/* ==============================
            REPORT CONFIRMATION
        ============================== */}

        {screen ===
          "confirmation" && (
          <section
            className="
              screen
              center-screen
            "
          >

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

        {/* ==============================
            PROFESSIONAL LOGIN
        ============================== */}

        {screen === "login" && (
          <section className="screen">

            <div className="eyebrow">
              Professional access
            </div>

            <h1>
              Log In
            </h1>

            <label className="field">

              Role

              <select
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value
                  )
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
                value={`${role}@demo.com`}
                readOnly
              />

            </label>

            <label className="field">

              Password

              <input
                value="demo123"
                readOnly
              />

            </label>

            <PrimaryButton
              onClick={() =>
                setScreen(
                  "dashboard"
                )
              }
            >
              Log In
            </PrimaryButton>

          </section>
        )}

        {/* ==============================
            PROFESSIONAL DASHBOARD
        ============================== */}

        {screen ===
          "dashboard" && (
          <section className="screen">

            <div className="dashboard-head">

              <div>

                <div className="eyebrow">
                  Professional dashboard
                </div>

                <h1>
                  {role
                    .charAt(0)
                    .toUpperCase() +
                    role.slice(1)}
                </h1>

              </div>

              <span className="role-badge">
                {role}
              </span>

            </div>

            {role ===
              "manufacturer" && (
              <ManufacturerDashboard
                totals={totals}
              />
            )}

            {role ===
              "pharmacist" && (
              <PharmacistDashboard
                onVerify={() =>
                  setScreen("scan")
                }
              />
            )}

            {role ===
              "admin" && (
              <AdminDashboard />
            )}

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

/* ======================================
   DETAIL ROW
====================================== */

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

/* ======================================
   MANUFACTURER DASHBOARD
====================================== */

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
          label="Covered events"
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
          Products & GS1
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

/* ======================================
   PHARMACIST DASHBOARD
====================================== */

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

        <p className="muted">
          Use qualified clinical and
          regulatory sources for real
          decisions.
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

/* ======================================
   ADMIN DASHBOARD
====================================== */

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

/* ======================================
   METRIC CARD
====================================== */

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
