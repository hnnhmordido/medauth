import { useMemo, useState } from "react";

import {
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
    name: "Luna",
    fullName: "Luna Chen",
    title: "MedAuth Administrator",
    organisation: "MedAuth Administration",
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

const initialAdminReports = [
  {
    id: "MA-2026-00125",
    eventId: "VE-0002",
    medicine: "HealthMed 20mg",
    productId: "09312345678902",
    code: "MED-002",
    batch: "B2045",
    verificationResult: "NO_MATCH",
    region: "Adelaide SA",
    reporterType: "Pharmacist",
    comment: "Batch information does not match the prototype record.",
    createdAt: "2026-08-11T10:10:00",
    status: "NEW",
    escalated: false,
    imageName: "",
  },
];

const initialAuditEvents = [
  {
    id: "AUD-0001",
    timestamp: "2026-08-11T10:10:00",
    actor: "Pharmacist",
    action: "Report created",
    recordType: "Suspicious Report",
    recordId: "MA-2026-00125",
    previousState: "—",
    newState: "NEW",
  },
  {
    id: "AUD-0002",
    timestamp: "2026-08-11T10:08:00",
    actor: "Pharmacist",
    action: "Verification completed",
    recordType: "Verification Event",
    recordId: "VE-0002",
    previousState: "—",
    newState: "NO_MATCH",
  },
];

function normaliseEvent(event, index = 0) {
  const timestamp =
    event.timestamp ||
    event.dateTime ||
    event.date ||
    new Date().toISOString();

  return {
    id: event.id || `EVENT-${index}-${timestamp}`,
    code: event.code || event.productCode || "",
    productId: event.productId || "",
    medicine:
      event.medicine ||
      event.medicineName ||
      event.productName ||
      "Medicine",
    batch: event.batch || event.batchNumber || "—",
    result: event.result || event.status || "NOT_COVERED",
    timestamp,
    offline: Boolean(event.offline || event.cached),
    pendingSync: Boolean(event.pendingSync),
    region: event.region || event.location || "",
    type: event.type || "verification",
    channel: event.channel || "PHARMACIST",
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

function verifyMedicine(identifier, batch, offline) {
  const normalizedIdentifier =
    identifier?.trim().toUpperCase();

  const normalizedBatch =
    batch?.trim().toUpperCase();

  const product =
    findMedicine(normalizedIdentifier);

  if (!product) {
    return {
      status: "NOT_COVERED",
      product: null,
      scannedCode: normalizedIdentifier,
      scannedBatch: normalizedBatch,
      offline,
      mismatchField: null,
    };
  }

  if (offline && !product.cached) {
    return {
      status: "NOT_COVERED",
      product,
      scannedCode: normalizedIdentifier,
      scannedBatch: normalizedBatch,
      offline: true,
      mismatchField: null,
    };
  }

  if (product.coverageStatus !== "ENROLLED") {
    return {
      status: "NOT_COVERED",
      product,
      scannedCode: normalizedIdentifier,
      scannedBatch: normalizedBatch,
      offline,
      mismatchField: null,
    };
  }

  if (
    normalizedBatch &&
    normalizedBatch !== product.batch.toUpperCase()
  ) {
    return {
      status: "NO_MATCH",
      product,
      scannedCode: normalizedIdentifier,
      scannedBatch: normalizedBatch,
      registeredBatch: product.batch,
      offline,
      mismatchField: "batch",
    };
  }

  return {
    status: "MATCH",
    product,
    scannedCode: normalizedIdentifier,
    scannedBatch:
      normalizedBatch || product.batch,
    offline,
    mismatchField: null,
  };
}

function downloadCsv(filename, rows) {
  if (!rows.length) {
    return;
  }

  const headers = Object.keys(rows[0]);

  const escapeValue = (value) => {
    const text =
      value === null || value === undefined
        ? ""
        : String(value);

    return `"${text.replaceAll('"', '""')}"`;
  };

  const csv = [
    headers.map(escapeValue).join(","),
    ...rows.map((row) =>
      headers
        .map((header) =>
          escapeValue(row[header])
        )
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);

  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
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

  const [currentUser, setCurrentUser] =
    useState(null);

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

  const [resetSent, setResetSent] =
    useState(false);

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

  const [reportRef, setReportRef] =
    useState("");

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
    useState(initialAdminReports);

  const [
    reportOrigin,
    setReportOrigin,
  ] = useState("result");

  const [
    selectedAdminReport,
    setSelectedAdminReport,
  ] = useState(null);

  const [
    selectedInvestigation,
    setSelectedInvestigation,
  ] = useState(null);

  const [
    auditEvents,
    setAuditEvents,
  ] = useState(
    initialAuditEvents
  );

  const [
    adminSearch,
    setAdminSearch,
  ] = useState("");

  const [
    reportStatusFilter,
    setReportStatusFilter,
  ] = useState("ALL");

  const [
    scanResultFilter,
    setScanResultFilter,
  ] = useState("ALL");

  const [
    auditSearch,
    setAuditSearch,
  ] = useState("");

  const [
    mapFilter,
    setMapFilter,
  ] = useState("ALL");

  const activeRecalls =
    useMemo(
      () => getActiveRecalls(),
      []
    );

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

  const adminSummary =
    useMemo(() => {
      const openReports =
        reports.filter(
          (report) =>
            report.status ===
            "NEW"
        ).length;

      const underReview =
        reports.filter(
          (report) =>
            report.status ===
            "UNDER_REVIEW"
        ).length;

      const noMatch =
        pharmacistEvents.filter(
          (event) =>
            event.result ===
            "NO_MATCH"
        ).length;

      const unable =
        pharmacistEvents.filter(
          (event) =>
            event.result ===
            "NOT_COVERED"
        ).length;

      return {
        openReports,
        underReview,
        noMatch,
        unable,
        recalls:
          activeRecalls.length,
      };
    }, [
      reports,
      pharmacistEvents,
      activeRecalls,
    ]);

  const filteredReports =
    useMemo(() => {
      const search =
        adminSearch
          .trim()
          .toLowerCase();

      return reports.filter(
        (report) => {
          const matchesStatus =
            reportStatusFilter ===
              "ALL" ||
            report.status ===
              reportStatusFilter;

          const haystack = [
            report.id,
            report.medicine,
            report.productId,
            report.batch,
            report.region,
            report.reporterType,
          ]
            .join(" ")
            .toLowerCase();

          return (
            matchesStatus &&
            (!search ||
              haystack.includes(
                search
              ))
          );
        }
      );
    }, [
      reports,
      adminSearch,
      reportStatusFilter,
    ]);

  const filteredScanEvents =
    useMemo(() => {
      const search =
        adminSearch
          .trim()
          .toLowerCase();

      return pharmacistEvents.filter(
        (event) => {
          const resultMatches =
            scanResultFilter ===
              "ALL" ||
            event.result ===
              scanResultFilter;

          const haystack = [
            event.id,
            event.medicine,
            event.productId,
            event.batch,
            event.region,
            event.channel,
          ]
            .join(" ")
            .toLowerCase();

          return (
            resultMatches &&
            (!search ||
              haystack.includes(
                search
              ))
          );
        }
      );
    }, [
      pharmacistEvents,
      adminSearch,
      scanResultFilter,
    ]);

  const regionSummary =
    useMemo(() => {
      const groups = {};

      pharmacistEvents.forEach(
        (event) => {
          const region =
            event.region ||
            "Unknown Region";

          if (!groups[region]) {
            groups[region] = {
              region,
              total: 0,
              match: 0,
              noMatch: 0,
              unable: 0,
              reports: 0,
            };
          }

          groups[region].total +=
            1;

          if (
            event.result ===
            "MATCH"
          ) {
            groups[region].match +=
              1;
          }

          if (
            event.result ===
            "NO_MATCH"
          ) {
            groups[
              region
            ].noMatch += 1;
          }

          if (
            event.result ===
            "NOT_COVERED"
          ) {
            groups[
              region
            ].unable += 1;
          }
        }
      );

      reports.forEach(
        (report) => {
          const region =
            report.region ||
            report.location ||
            "Unknown Region";

          if (!groups[region]) {
            groups[region] = {
              region,
              total: 0,
              match: 0,
              noMatch: 0,
              unable: 0,
              reports: 0,
            };
          }

          groups[
            region
          ].reports += 1;
        }
      );

      return Object.values(
        groups
      );
    }, [
      pharmacistEvents,
      reports,
    ]);

  const filteredRegions =
    useMemo(() => {
      if (
        mapFilter === "ALL"
      ) {
        return regionSummary;
      }

      return regionSummary.filter(
        (region) => {
          if (
            mapFilter === "MATCH"
          ) {
            return (
              region.match > 0
            );
          }

          if (
            mapFilter ===
            "NO_MATCH"
          ) {
            return (
              region.noMatch > 0
            );
          }

          if (
            mapFilter ===
            "NOT_COVERED"
          ) {
            return (
              region.unable > 0
            );
          }

          if (
            mapFilter ===
            "REPORTED"
          ) {
            return (
              region.reports > 0
            );
          }

          return true;
        }
      );
    }, [
      regionSummary,
      mapFilter,
    ]);

  const suspectClusters =
    useMemo(() => {
      const batches = {};

      pharmacistEvents.forEach(
        (event) => {
          if (!batches[event.batch]) {
            batches[
              event.batch
            ] = {
              batch: event.batch,
              region:
                event.region ||
                "Unknown",
              scans: 0,
              noMatch: 0,
              reports: 0,
            };
          }

          batches[
            event.batch
          ].scans += 1;

          if (
            event.result ===
            "NO_MATCH"
          ) {
            batches[
              event.batch
            ].noMatch += 1;
          }
        }
      );

      reports.forEach(
        (report) => {
          if (
            batches[
              report.batch
            ]
          ) {
            batches[
              report.batch
            ].reports += 1;
          }
        }
      );

      return Object.values(
        batches
      )
        .filter(
          (item) =>
            item.noMatch > 0 ||
            item.reports > 0
        )
        .sort(
          (a, b) =>
            b.noMatch -
            a.noMatch
        );
    }, [
      pharmacistEvents,
      reports,
    ]);

  const filteredAudit =
    useMemo(() => {
      const search =
        auditSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return auditEvents;
      }

      return auditEvents.filter(
        (event) =>
          [
            event.id,
            event.actor,
            event.action,
            event.recordType,
            event.recordId,
            event.previousState,
            event.newState,
          ]
            .join(" ")
            .toLowerCase()
            .includes(search)
      );
    }, [
      auditEvents,
      auditSearch,
    ]);

  const handleNetworkToggle =
    () => {
      if (!offline) {
        setOffline(true);
        return;
      }

      setOffline(false);

      if (pendingSync > 0) {
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

            setAuditEvents(
              (current) => [
                {
                  id:
                    `AUD-${Date.now()}`,
                  timestamp:
                    new Date().toISOString(),
                  actor:
                    currentUser
                      ?.fullName ||
                    "System",
                  action:
                    "Offline event synced",
                  recordType:
                    "Verification Event",
                  recordId:
                    "SYNC",
                  previousState:
                    "PENDING",
                  newState:
                    "SYNCED",
                },
                ...current,
              ]
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
            "adminOverview"
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

  const runVerification =
    (
      nextCode = code,
      nextBatch = batch
    ) => {
      setScreen("checking");

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

          const eventId =
            `VE-${Date.now()}`;

          const event = {
            id: eventId,

            timestamp:
              new Date().toISOString(),

            code:
              product?.code ||
              nextCode
                ?.trim()
                .toUpperCase(),

            productId:
              product?.productId ||
              nextCode,

            medicine:
              product
                ?.medicineName ||
              "Unknown medicine",

            batch:
              nextBatch
                ?.trim()
                .toUpperCase() ||
              product?.batch ||
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

          setAuditEvents(
            (current) => [
              {
                id:
                  `AUD-${Date.now()}`,
                timestamp:
                  new Date().toISOString(),
                actor:
                  role ===
                  "pharmacist"
                    ? "Pharmacist"
                    : "Consumer",
                action:
                  "Verification completed",
                recordType:
                  "Verification Event",
                recordId:
                  eventId,
                previousState:
                  "—",
                newState:
                  verification.status,
              },
              ...current,
            ]
          );

          if (offline) {
            setPendingSync(
              (current) =>
                current + 1
            );
          }

          setScreen("result");
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

      if (!normalizedBatch) {
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

  const submitReport = () => {
    const reference =
      `MA-2026-${Math.floor(
        10000 +
          Math.random() *
            89999
      )}`;

    const event =
      pharmacistEvents[0];

    const newReport = {
      id: reference,

      eventId:
        event?.id || "",

      code:
        result?.product?.code ||
        code,

      productId:
        result?.product
          ?.productId ||
        code,

      medicine:
        result?.product
          ?.medicineName ||
        "Unknown medicine",

      batch:
        result?.scannedBatch ||
        batch,

      verificationResult:
        result?.status || "",

      comment:
        reportComment,

      region:
        reportLocation ||
        result?.product
          ?.coarseRegion ||
        "",

      reporterType:
        role ===
        "pharmacist"
          ? "Pharmacist"
          : "Consumer",

      imageName:
        reportImageName,

      createdAt:
        new Date().toISOString(),

      status: "NEW",

      escalated: false,
    };

    setReportRef(reference);

    setReports(
      (current) => [
        newReport,
        ...current,
      ]
    );

    setAuditEvents(
      (current) => [
        {
          id:
            `AUD-${Date.now()}`,
          timestamp:
            new Date().toISOString(),
          actor:
            role ===
            "pharmacist"
              ? "Pharmacist"
              : "Consumer",
          action:
            "Report created",
          recordType:
            "Suspicious Report",
          recordId:
            reference,
          previousState:
            "—",
          newState:
            "NEW",
        },
        ...current,
      ]
    );

    setScreen(
      "confirmation"
    );
  };

  const updateReportStatus =
    (
      reportId,
      nextStatus
    ) => {
      const report =
        reports.find(
          (item) =>
            item.id === reportId
        );

      if (!report) {
        return;
      }

      const previous =
        report.status;

      setReports(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              reportId
                ? {
                    ...item,
                    status:
                      nextStatus,
                  }
                : item
          )
      );

      setSelectedAdminReport(
        (current) =>
          current?.id ===
          reportId
            ? {
                ...current,
                status:
                  nextStatus,
              }
            : current
      );

      setAuditEvents(
        (current) => [
          {
            id:
              `AUD-${Date.now()}`,
            timestamp:
              new Date().toISOString(),
            actor:
              currentUser
                ?.fullName ||
              "Admin",
            action:
              "Report status changed",
            recordType:
              "Suspicious Report",
            recordId:
              reportId,
            previousState:
              previous,
            newState:
              nextStatus,
          },
          ...current,
        ]
      );
    };

  const toggleEscalation =
    (reportId) => {
      const report =
        reports.find(
          (item) =>
            item.id === reportId
        );

      if (!report) {
        return;
      }

      const next =
        !report.escalated;

      setReports(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              reportId
                ? {
                    ...item,
                    escalated:
                      next,
                  }
                : item
          )
      );

      setSelectedAdminReport(
        (current) =>
          current?.id ===
          reportId
            ? {
                ...current,
                escalated:
                  next,
              }
            : current
      );

      setAuditEvents(
        (current) => [
          {
            id:
              `AUD-${Date.now()}`,
            timestamp:
              new Date().toISOString(),
            actor:
              currentUser
                ?.fullName ||
              "Admin",
            action:
              next
                ? "Report escalated"
                : "Escalation removed",
            recordType:
              "Suspicious Report",
            recordId:
              reportId,
            previousState:
              String(
                report.escalated
              ),
            newState:
              String(next),
          },
          ...current,
        ]
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

    setResetEmail("");
    setResetSent(false);

    setBatchSearch("");
    setBatchProductCode("");
    setBatchResult(null);

    setSelectedRecall(null);
    setSelectedAdminReport(null);
    setSelectedInvestigation(null);
  };

  const isAdminScreen =
    screen.startsWith(
      "admin"
    );

  if (
    role === "admin" &&
    isAdminScreen
  ) {
    return (
      <div
        className="admin-app-shell"
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
        <AdminWorkspace
          screen={screen}
          setScreen={setScreen}
          currentUser={currentUser}
          search={adminSearch}
          setSearch={setAdminSearch}
          reports={reports}
          filteredReports={
            filteredReports
          }
          reportStatusFilter={
            reportStatusFilter
          }
          setReportStatusFilter={
            setReportStatusFilter
          }
          selectedReport={
            selectedAdminReport
          }
          setSelectedReport={
            setSelectedAdminReport
          }
          updateReportStatus={
            updateReportStatus
          }
          toggleEscalation={
            toggleEscalation
          }
          scanEvents={
            filteredScanEvents
          }
          scanResultFilter={
            scanResultFilter
          }
          setScanResultFilter={
            setScanResultFilter
          }
          summary={adminSummary}
          regions={
            filteredRegions
          }
          mapFilter={
            mapFilter
          }
          setMapFilter={
            setMapFilter
          }
          clusters={
            suspectClusters
          }
          selectedInvestigation={
            selectedInvestigation
          }
          setSelectedInvestigation={
            setSelectedInvestigation
          }
          auditEvents={
            filteredAudit
          }
          auditSearch={
            auditSearch
          }
          setAuditSearch={
            setAuditSearch
          }
          offline={offline}
          syncing={syncing}
          handleNetworkToggle={
            handleNetworkToggle
          }
          activeRecalls={
            activeRecalls
          }
          onExport={(
            type
          ) => {
            if (
              type ===
              "events"
            ) {
              downloadCsv(
                "medauth-verification-events.csv",
                pharmacistEvents
              );
            }

            if (
              type ===
              "reports"
            ) {
              downloadCsv(
                "medauth-suspicious-reports.csv",
                reports
              );
            }

            if (
              type ===
              "audit"
            ) {
              downloadCsv(
                "medauth-audit-trail.csv",
                auditEvents
              );
            }

            if (
              type ===
              "investigation"
            ) {
              downloadCsv(
                "medauth-investigation.csv",
                suspectClusters
              );
            }
          }}
          onSignOut={reset}
        />
      </div>
    );
  }

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
              <span>or</span>
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
                  onChange={(event) => {
                    setEmail(
                      event.target
                        .value
                    );

                    setLoginError("");
                  }}
                  placeholder="e.g. pharmacist@medauth.com"
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
                        event.target
                          .value
                      );

                      setLoginError("");
                    }}
                    placeholder="••••••••"
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
                        event.target
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
                    setResetEmail(email);
                    setResetSent(false);
                    setScreen(
                      "forgotPassword"
                    );
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {loginError && (
                <div className="login-error">
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
                Protected by AES-256 encryption · TLS 1.3 · ISO 27001
              </span>
            </div>

          </section>
        )}

        {screen === "forgotPassword" && (
          <section className="screen">

            <BackButton
              onClick={() =>
                setScreen("home")
              }
            />

            <div className="eyebrow">
              Account recovery
            </div>

            <h1>
              Forgot password?
            </h1>

            {!resetSent ? (
              <form
                onSubmit={
                  handleForgotPassword
                }
              >
                <label className="field">
                  Email address

                  <input
                    type="email"
                    value={
                      resetEmail
                    }
                    onChange={(
                      event
                    ) =>
                      setResetEmail(
                        event.target
                          .value
                      )
                    }
                    required
                  />
                </label>

                <PrimaryButton type="submit">
                  Send Reset Instructions
                </PrimaryButton>
              </form>
            ) : (
              <div className="panel">
                <h3>
                  Check your email
                </h3>

                <p>
                  Reset instructions have been requested for {resetEmail}.
                </p>
              </div>
            )}

          </section>
        )}

        {screen === "scan" && (
          <section className="screen">

            <BackButton
              onClick={() =>
                setScreen(
                  role ===
                    "pharmacist"
                    ? "pharmacistDashboard"
                    : "home"
                )
              }
            />

            <div className="eyebrow">
              Pharmacist verification
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
              <button
                type="button"
                onClick={() =>
                  runVerification(
                    "MED-001",
                    "B1001"
                  )
                }
              >
                MED-001 / B1001 — Match
              </button>

              <button
                type="button"
                onClick={() =>
                  runVerification(
                    "MED-002",
                    "B2045"
                  )
                }
              >
                MED-002 / B2045 — No Match
              </button>

              <button
                type="button"
                onClick={() =>
                  runVerification(
                    "MED-003",
                    "B9912"
                  )
                }
              >
                MED-003 — Unable to Verify
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

        {screen === "manual" && (
          <section className="screen">

            <BackButton
              onClick={() =>
                setScreen("scan")
              }
            />

            <h1>
              Enter medicine code
            </h1>

            <label className="field">
              Product identifier

              <input
                value={code}
                onChange={(
                  event
                ) =>
                  setCode(
                    event.target
                      .value
                  )
                }
              />
            </label>

            <label className="field">
              Batch

              <input
                value={batch}
                onChange={(
                  event
                ) =>
                  setBatch(
                    event.target
                      .value
                  )
                }
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

        {screen === "checking" && (
          <section className="screen center-screen">
            <div className="loader" />

            <h1>
              Checking medicine…
            </h1>
          </section>
        )}

        {screen === "result" &&
          result && (
            <section className="screen">

              <BackButton
                onClick={() =>
                  setScreen(
                    role ===
                      "pharmacist"
                      ? "pharmacistDashboard"
                      : "home"
                  )
                }
              />

              <StatusCard
                status={
                  result.status
                }
                title={
                  result.status ===
                  "MATCH"
                    ? "Data match found"
                    : result.status ===
                      "NO_MATCH"
                    ? "No Match"
                    : "Unable to Verify"
                }
                text={
                  result.status ===
                  "MATCH"
                    ? "The scanned code and batch match information registered in MedAuth."
                    : result.status ===
                      "NO_MATCH"
                    ? "The scanned information does not fully match the registered prototype record."
                    : "MedAuth does not currently have enough prototype information to verify this medicine."
                }
              />

              {result.status ===
                "NO_MATCH" && (
                <div className="verification-warning-box">
                  A No Match result does not confirm that this medicine is counterfeit.
                </div>
              )}

              <SupplyChainSnapshot
                product={
                  result.product
                }
                result={result}
              />

              <div className="action-stack">

                {result.status ===
                  "NO_MATCH" && (
                  <>
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
                        setScreen(
                          "pharmacistBatchLookup"
                        );
                      }}
                    >
                      Check Batch / Recall
                    </PrimaryButton>

                    <SecondaryButton
                      onClick={() =>
                        setScreen(
                          "report"
                        )
                      }
                    >
                      Report Concern
                    </SecondaryButton>
                  </>
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

            </section>
          )}

        {screen === "report" && (
          <section className="screen">

            <BackButton
              onClick={() =>
                setScreen("result")
              }
            />

            <h1>
              Report a concern
            </h1>

            <label className="field">
              Comment

              <textarea
                rows="4"
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
              />
            </label>

            <label className="field">
              Coarse location

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
              Reference:{" "}
              <strong>
                {reportRef}
              </strong>
            </p>

            <PrimaryButton
              onClick={() =>
                setScreen(
                  role ===
                    "pharmacist"
                    ? "pharmacistDashboard"
                    : "home"
                )
              }
            >
              Continue
            </PrimaryButton>

          </section>
        )}

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
                    Hi, Marie
                  </h1>

                  <p>
                    Registered Pharmacist
                  </p>
                </div>
              </div>

              <div className="pharmacist-profile-actions">
                <button
                  className="profile-icon-button"
                  onClick={() =>
                    setScreen(
                      "pharmacistProfile"
                    )
                  }
                >
                  <ProfileIcon />
                </button>

                <button
                  className="profile-icon-button"
                  onClick={() =>
                    setScreen(
                      "pharmacistSettings"
                    )
                  }
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
              <strong>
                {offline
                  ? "Offline Mode — Cached Data"
                  : "System Online"}
              </strong>

              <NetworkBadge
                offline={offline}
                onToggle={
                  handleNetworkToggle
                }
              />
            </div>

            <button
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
                  Scan or enter a medicine code
                </span>
              </div>

              <span>→</span>
            </button>

            <div className="pharmacist-action-grid">

              <button
                className="pharmacist-action-card"
                onClick={() =>
                  setScreen(
                    "pharmacistBatchLookup"
                  )
                }
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
                className="pharmacist-action-card"
                onClick={() =>
                  setScreen("report")
                }
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
                      key={
                        event.id
                      }
                      className="recent-event-row"
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

          </section>
        )}

        {screen ===
          "pharmacistBatchLookup" && (
          <section className="screen">

            <BackButton
              onClick={() =>
                setScreen(
                  "pharmacistDashboard"
                )
              }
            />

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
                      event.target
                        .value
                    )
                  }
                />
              </label>

              <PrimaryButton type="submit">
                Search Batch
              </PrimaryButton>
            </form>

            {batchResult && (
              <div className="batch-result-card">
                <strong>
                  {batchResult.recall
                    ? "Active Recall"
                    : "No Active Recall"}
                </strong>
              </div>
            )}

          </section>
        )}

        {screen ===
          "pharmacistRecalls" && (
          <section className="screen">

            <BackButton
              onClick={() =>
                setScreen(
                  "pharmacistDashboard"
                )
              }
            />

            <h1>
              Recalls & Alerts
            </h1>

            {activeRecalls.map(
              (recall) => (
                <button
                  key={recall.id}
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
                  {
                    recall.medicineName
                  }
                </button>
              )
            )}

          </section>
        )}

        {screen ===
          "pharmacistShortages" && (
          <section className="screen">

            <BackButton
              onClick={() =>
                setScreen(
                  "pharmacistDashboard"
                )
              }
            />

            <h1>
              Shortages
            </h1>

            {shortageData.map(
              (item) => (
                <div
                  className="shortage-card"
                  key={item.id}
                >
                  <strong>
                    {
                      item.medicineName
                    }
                  </strong>

                  <span>
                    {
                      item.availability
                    }
                  </span>
                </div>
              )
            )}

          </section>
        )}

        {screen ===
          "pharmacistHistory" && (
          <section className="screen">

            <BackButton
              onClick={() =>
                setScreen(
                  "pharmacistDashboard"
                )
              }
            />

            <h1>
              Verification History
            </h1>

            {pharmacistEvents.map(
              (event) => (
                <div
                  className="history-card"
                  key={event.id}
                >
                  <strong>
                    {
                      event.medicine
                    }
                  </strong>

                  <Row
                    label="Result"
                    value={resultLabel(
                      event.result
                    )}
                  />

                  <Row
                    label="Batch"
                    value={
                      event.batch
                    }
                  />
                </div>
              )
            )}

          </section>
        )}

      </main>
    </div>
  );
}

function AdminWorkspace({
  screen,
  setScreen,
  currentUser,
  search,
  setSearch,
  reports,
  filteredReports,
  reportStatusFilter,
  setReportStatusFilter,
  selectedReport,
  setSelectedReport,
  updateReportStatus,
  toggleEscalation,
  scanEvents,
  scanResultFilter,
  setScanResultFilter,
  summary,
  regions,
  mapFilter,
  setMapFilter,
  clusters,
  selectedInvestigation,
  setSelectedInvestigation,
  auditEvents,
  auditSearch,
  setAuditSearch,
  offline,
  syncing,
  handleNetworkToggle,
  activeRecalls,
  onExport,
  onSignOut,
}) {
  const [exportOpen, setExportOpen] =
    useState(false);

  return (
    <div className="admin-desktop">

      <aside className="admin-sidebar">

        <div className="admin-sidebar-brand">
          <img
            src={`${import.meta.env.BASE_URL}medauth-logo.png`}
            alt="MedAuth"
          />

          <div>
            <strong>
              MedAuth
            </strong>

            <span>
              Admin
            </span>
          </div>
        </div>

        <nav className="admin-nav">

          <AdminNavButton
            label="Overview"
            active={
              screen ===
              "adminOverview"
            }
            onClick={() =>
              setScreen(
                "adminOverview"
              )
            }
          />

          <AdminNavButton
            label="Reports"
            active={
              screen ===
              "adminReports"
            }
            onClick={() =>
              setScreen(
                "adminReports"
              )
            }
          />

          <AdminNavButton
            label="Scan Monitor"
            active={
              screen ===
              "adminScanMonitor"
            }
            onClick={() =>
              setScreen(
                "adminScanMonitor"
              )
            }
          />

          <AdminNavButton
            label="Investigation"
            active={
              screen ===
              "adminInvestigation"
            }
            onClick={() =>
              setScreen(
                "adminInvestigation"
              )
            }
          />

          <AdminNavButton
            label="Audit Trail"
            active={
              screen ===
              "adminAudit"
            }
            onClick={() =>
              setScreen(
                "adminAudit"
              )
            }
          />

          <AdminNavButton
            label="Users & Access"
            active={
              screen ===
              "adminUsers"
            }
            onClick={() =>
              setScreen(
                "adminUsers"
              )
            }
          />

        </nav>

        <div className="admin-sidebar-footer">

          <div className="admin-profile-mini">
            <img
              src={`${import.meta.env.BASE_URL}admin-luna.png`}
              alt="Luna"
            />

            <div>
              <strong>
                {currentUser
                  ?.name ||
                  "Luna"}
              </strong>

              <span>
                Admin / Regulator
              </span>
            </div>
          </div>

          <button
            type="button"
            className="admin-signout"
            onClick={
              onSignOut
            }
          >
            Sign Out
          </button>

        </div>

      </aside>

      <div className="admin-main">

        <header className="admin-toolbar">

          <div className="admin-search-box">
            <SearchIcon />

            <input
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search product, barcode, batch, report ID..."
            />
          </div>

          <div className="admin-toolbar-actions">

            <NetworkBadge
              offline={offline}
              onToggle={
                handleNetworkToggle
              }
            />

            <div className="admin-export-wrap">

              <button
                type="button"
                className="admin-export-button"
                onClick={() =>
                  setExportOpen(
                    (current) =>
                      !current
                  )
                }
              >
                Export Data
              </button>

              {exportOpen && (
                <div className="admin-export-menu">

                  <button
                    onClick={() =>
                      onExport(
                        "events"
                      )
                    }
                  >
                    Verification Events CSV
                  </button>

                  <button
                    onClick={() =>
                      onExport(
                        "reports"
                      )
                    }
                  >
                    Suspicious Reports CSV
                  </button>

                  <button
                    onClick={() =>
                      onExport(
                        "audit"
                      )
                    }
                  >
                    Audit Trail CSV
                  </button>

                  <button
                    onClick={() =>
                      onExport(
                        "investigation"
                      )
                    }
                  >
                    Filtered Investigation CSV
                  </button>

                </div>
              )}

            </div>

            <button
              type="button"
              className="admin-avatar-button"
              onClick={() =>
                setScreen(
                  "adminUsers"
                )
              }
            >
              <img
                src={`${import.meta.env.BASE_URL}admin-luna.png`}
                alt="Luna"
              />
            </button>

          </div>

        </header>

        <main className="admin-content">

          {screen ===
            "adminOverview" && (
            <>
              <AdminPageHeader
                eyebrow="Admin Monitoring"
                title="Investigation Overview"
                subtitle="Review suspicious medicine activity, verification provenance, and investigation status"
              />

              <div className="admin-summary-strip">
                <AdminSummary
                  label="Open Reports"
                  value={
                    summary.openReports
                  }
                />

                <AdminSummary
                  label="Under Review"
                  value={
                    summary.underReview
                  }
                />

                <AdminSummary
                  label="No Match Events"
                  value={
                    summary.noMatch
                  }
                />

                <AdminSummary
                  label="Unable to Verify"
                  value={
                    summary.unable
                  }
                />

                <AdminSummary
                  label="Active Recall Matches"
                  value={
                    summary.recalls
                  }
                />
              </div>

              <div className="admin-overview-grid">

                <section className="admin-panel admin-panel-large">

                  <div className="admin-section-head">
                    <div>
                      <h2>
                        Suspicious Reports
                      </h2>

                      <p>
                        Recent reports requiring investigation.
                      </p>
                    </div>

                    <button
                      className="admin-link-button"
                      onClick={() =>
                        setScreen(
                          "adminReports"
                        )
                      }
                    >
                      View all
                    </button>
                  </div>

                  <ReportsTable
                    reports={
                      filteredReports.slice(
                        0,
                        5
                      )
                    }
                    onOpen={(
                      report
                    ) => {
                      setSelectedReport(
                        report
                      );

                      setScreen(
                        "adminReportDetail"
                      );
                    }}
                  />

                </section>

                <aside className="admin-panel">

                  <div className="admin-section-head">
                    <div>
                      <h2>
                        Suspect Activity
                      </h2>

                      <p>
                        Prototype clusters requiring review.
                      </p>
                    </div>
                  </div>

                  <div className="suspect-list">

                    {clusters
                      .slice(0, 5)
                      .map(
                        (cluster) => (
                          <button
                            key={
                              cluster.batch
                            }
                            className="suspect-item"
                            onClick={() => {
                              setSelectedInvestigation(
                                cluster
                              );

                              setScreen(
                                "adminInvestigation"
                              );
                            }}
                          >
                            <div>
                              <strong>
                                Batch{" "}
                                {
                                  cluster.batch
                                }
                              </strong>

                              <span>
                                {
                                  cluster.region
                                }
                              </span>
                            </div>

                            <div>
                              <strong>
                                {
                                  cluster.noMatch
                                }{" "}
                                No Match
                              </strong>

                              <span>
                                Review recommended
                              </span>
                            </div>
                          </button>
                        )
                      )}

                  </div>

                </aside>

              </div>

              <section className="admin-panel">

                <div className="admin-section-head">
                  <div>
                    <h2>
                      Verification Activity Map
                    </h2>

                    <p>
                      Coarse prototype regions only.
                    </p>
                  </div>

                  <MapFilters
                    value={
                      mapFilter
                    }
                    onChange={
                      setMapFilter
                    }
                  />
                </div>

                <RegionMap
                  regions={
                    regions
                  }
                />

              </section>
            </>
          )}

          {screen ===
            "adminReports" && (
            <>
              <AdminPageHeader
                eyebrow="Reports"
                title="Suspicious Medicine Reports"
                subtitle="Review submitted reports and manage investigation status"
              />

              <div className="admin-filter-row">

                <select
                  value={
                    reportStatusFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setReportStatusFilter(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="ALL">
                    All statuses
                  </option>

                  <option value="NEW">
                    New
                  </option>

                  <option value="UNDER_REVIEW">
                    Under Review
                  </option>

                  <option value="RESOLVED">
                    Resolved
                  </option>
                </select>

              </div>

              <section className="admin-panel">

                <ReportsTable
                  reports={
                    filteredReports
                  }
                  onOpen={(
                    report
                  ) => {
                    setSelectedReport(
                      report
                    );

                    setScreen(
                      "adminReportDetail"
                    );
                  }}
                />

              </section>
            </>
          )}

          {screen ===
            "adminReportDetail" &&
            selectedReport && (
            <>
              <AdminPageHeader
                eyebrow="Report Review"
                title={
                  selectedReport.id
                }
                subtitle="Connected report, verification and investigation context"
                backAction={() =>
                  setScreen(
                    "adminReports"
                  )
                }
              />

              <div className="admin-detail-grid">

                <section className="admin-panel">

                  <h2>
                    Report Information
                  </h2>

                  <AdminDetailRow
                    label="Medicine"
                    value={
                      selectedReport.medicine
                    }
                  />

                  <AdminDetailRow
                    label="Product ID"
                    value={
                      selectedReport.productId
                    }
                  />

                  <AdminDetailRow
                    label="Batch"
                    value={
                      selectedReport.batch
                    }
                  />

                  <AdminDetailRow
                    label="Reporter"
                    value={
                      selectedReport.reporterType
                    }
                  />

                  <AdminDetailRow
                    label="Region"
                    value={
                      selectedReport.region ||
                      "—"
                    }
                  />

                  <AdminDetailRow
                    label="Submitted"
                    value={formatEventTime(
                      selectedReport.createdAt
                    )}
                  />

                  <div className="admin-comment-box">
                    {
                      selectedReport.comment ||
                      "No comment supplied."
                    }
                  </div>

                </section>

                <section className="admin-panel">

                  <h2>
                    Verification Context
                  </h2>

                  <AdminDetailRow
                    label="Result"
                    value={resultLabel(
                      selectedReport.verificationResult
                    )}
                  />

                  <AdminDetailRow
                    label="Event ID"
                    value={
                      selectedReport.eventId ||
                      "—"
                    }
                  />

                  <AdminDetailRow
                    label="Status"
                    value={
                      selectedReport.status
                    }
                  />

                  <div className="admin-status-actions">

                    <button
                      onClick={() =>
                        updateReportStatus(
                          selectedReport.id,
                          "NEW"
                        )
                      }
                    >
                      New
                    </button>

                    <button
                      onClick={() =>
                        updateReportStatus(
                          selectedReport.id,
                          "UNDER_REVIEW"
                        )
                      }
                    >
                      Under Review
                    </button>

                    <button
                      onClick={() =>
                        updateReportStatus(
                          selectedReport.id,
                          "RESOLVED"
                        )
                      }
                    >
                      Resolved
                    </button>

                  </div>

                  <label className="admin-escalate-toggle">

                    <input
                      type="checkbox"
                      checked={
                        selectedReport.escalated
                      }
                      onChange={() =>
                        toggleEscalation(
                          selectedReport.id
                        )
                      }
                    />

                    <span>
                      Escalate for Investigation
                    </span>

                  </label>

                </section>

              </div>
            </>
          )}

          {screen ===
            "adminScanMonitor" && (
            <>
              <AdminPageHeader
                eyebrow="Scan Provenance"
                title="Scan Monitor"
                subtitle="Review where prototype verification activity came from"
              />

              <div className="admin-filter-row">

                <select
                  value={
                    scanResultFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setScanResultFilter(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="ALL">
                    All results
                  </option>

                  <option value="MATCH">
                    Match
                  </option>

                  <option value="NO_MATCH">
                    No Match
                  </option>

                  <option value="NOT_COVERED">
                    Unable to Verify
                  </option>
                </select>

              </div>

              <section className="admin-panel">

                <ScanTable
                  events={
                    scanEvents
                  }
                  reports={
                    reports
                  }
                />

              </section>

              <section className="admin-panel">

                <div className="admin-section-head">
                  <div>
                    <h2>
                      Verification Activity Map
                    </h2>
                  </div>

                  <MapFilters
                    value={
                      mapFilter
                    }
                    onChange={
                      setMapFilter
                    }
                  />
                </div>

                <RegionMap
                  regions={
                    regions
                  }
                />

              </section>
            </>
          )}

          {screen ===
            "adminInvestigation" && (
            <>
              <AdminPageHeader
                eyebrow="Investigation"
                title={
                  selectedInvestigation
                    ? `Investigation — Batch ${selectedInvestigation.batch}`
                    : "Suspect Activity"
                }
                subtitle="Review verification provenance and related prototype activity"
              />

              <div className="admin-investigation-grid">

                <section className="admin-panel">

                  <h2>
                    Suspect Activity
                  </h2>

                  <div className="admin-table-wrap">

                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>
                            Batch
                          </th>
                          <th>
                            Region
                          </th>
                          <th>
                            Scans
                          </th>
                          <th>
                            No Match
                          </th>
                          <th>
                            Reports
                          </th>
                          <th>
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>

                        {clusters.map(
                          (cluster) => (
                            <tr
                              key={
                                cluster.batch
                              }
                              onClick={() =>
                                setSelectedInvestigation(
                                  cluster
                                )
                              }
                            >
                              <td>
                                {
                                  cluster.batch
                                }
                              </td>

                              <td>
                                {
                                  cluster.region
                                }
                              </td>

                              <td>
                                {
                                  cluster.scans
                                }
                              </td>

                              <td>
                                {
                                  cluster.noMatch
                                }
                              </td>

                              <td>
                                {
                                  cluster.reports
                                }
                              </td>

                              <td>
                                <span className="admin-status warning">
                                  Review Recommended
                                </span>
                              </td>
                            </tr>
                          )
                        )}

                      </tbody>
                    </table>

                  </div>

                </section>

                <section className="admin-panel">

                  <h2>
                    Investigation Timeline
                  </h2>

                  {!selectedInvestigation ? (
                    <p className="admin-muted">
                      Select a suspect batch to view its timeline.
                    </p>
                  ) : (
                    <InvestigationTimeline
                      batch={
                        selectedInvestigation.batch
                      }
                      events={
                        scanEvents
                      }
                      reports={
                        reports
                      }
                      audits={
                        auditEvents
                      }
                    />
                  )}

                </section>

              </div>
            </>
          )}

          {screen ===
            "adminAudit" && (
            <>
              <AdminPageHeader
                eyebrow="Audit Trail"
                title="Administrative Audit Trail"
                subtitle="Prototype audit history for verification, reports and administrative actions"
              />

              <div className="admin-filter-row">

                <input
                  value={
                    auditSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setAuditSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Search action, actor or record ID..."
                />

              </div>

              <section className="admin-panel">

                <AuditTable
                  events={
                    auditEvents
                  }
                />

              </section>
            </>
          )}

          {screen ===
            "adminUsers" && (
            <>
              <AdminPageHeader
                eyebrow="Role-Based Access"
                title="Users & Access"
                subtitle="Demo identities and role permissions"
              />

              <section className="admin-panel">

                <div className="admin-table-wrap">

                  <table className="admin-table">

                    <thead>
                      <tr>
                        <th>
                          Name
                        </th>
                        <th>
                          Email
                        </th>
                        <th>
                          Role
                        </th>
                        <th>
                          MFA
                        </th>
                        <th>
                          Last Active
                        </th>
                        <th>
                          Status
                        </th>
                        <th>
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {Object.values(
                        demoUsers
                      ).map(
                        (user) => (
                          <tr
                            key={
                              user.email
                            }
                          >
                            <td>
                              {
                                user.fullName
                              }
                            </td>

                            <td>
                              {
                                user.email
                              }
                            </td>

                            <td>
                              {
                                user.role
                              }
                            </td>

                            <td>
                              Enabled
                            </td>

                            <td>
                              Today
                            </td>

                            <td>
                              <span className="admin-status success">
                                Active
                              </span>
                            </td>

                            <td>
                              <button className="admin-table-action">
                                View
                              </button>
                            </td>
                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </section>
            </>
          )}

        </main>

      </div>

    </div>
  );
}

function ReportsTable({
  reports,
  onOpen,
}) {
  return (
    <div className="admin-table-wrap">

      <table className="admin-table">

        <thead>
          <tr>
            <th>
              Report ID
            </th>
            <th>
              Medicine
            </th>
            <th>
              Product ID
            </th>
            <th>
              Batch
            </th>
            <th>
              Result
            </th>
            <th>
              Region
            </th>
            <th>
              Reporter
            </th>
            <th>
              Submitted
            </th>
            <th>
              Status
            </th>
            <th>
              Action
            </th>
          </tr>
        </thead>

        <tbody>

          {reports.map(
            (report) => (
              <tr key={report.id}>
                <td>
                  {
                    report.id
                  }
                </td>

                <td>
                  {
                    report.medicine
                  }
                </td>

                <td>
                  {
                    report.productId
                  }
                </td>

                <td>
                  {
                    report.batch
                  }
                </td>

                <td>
                  {resultLabel(
                    report.verificationResult
                  )}
                </td>

                <td>
                  {
                    report.region ||
                    "—"
                  }
                </td>

                <td>
                  {
                    report.reporterType
                  }
                </td>

                <td>
                  {formatEventTime(
                    report.createdAt
                  )}
                </td>

                <td>
                  <span
                    className={`admin-status ${
                      report.status ===
                      "NEW"
                        ? "warning"
                        : report.status ===
                          "UNDER_REVIEW"
                        ? "info"
                        : "success"
                    }`}
                  >
                    {
                      report.status.replaceAll(
                        "_",
                        " "
                      )
                    }
                  </span>
                </td>

                <td>
                  <button
                    className="admin-table-action"
                    onClick={() =>
                      onOpen(
                        report
                      )
                    }
                  >
                    View
                  </button>
                </td>
              </tr>
            )
          )}

        </tbody>

      </table>

    </div>
  );
}

function ScanTable({
  events,
  reports,
}) {
  return (
    <div className="admin-table-wrap">

      <table className="admin-table">

        <thead>
          <tr>
            <th>
              Event ID
            </th>
            <th>
              Timestamp
            </th>
            <th>
              Medicine
            </th>
            <th>
              Product ID
            </th>
            <th>
              Batch
            </th>
            <th>
              Result
            </th>
            <th>
              Channel
            </th>
            <th>
              Region
            </th>
            <th>
              Connection
            </th>
            <th>
              Report Linked?
            </th>
          </tr>
        </thead>

        <tbody>

          {events.map(
            (event) => (
              <tr key={event.id}>

                <td>
                  {
                    event.id
                  }
                </td>

                <td>
                  {formatEventTime(
                    event.timestamp
                  )}
                </td>

                <td>
                  {
                    event.medicine
                  }
                </td>

                <td>
                  {
                    event.productId ||
                    event.code
                  }
                </td>

                <td>
                  {
                    event.batch
                  }
                </td>

                <td>
                  {resultLabel(
                    event.result
                  )}
                </td>

                <td>
                  {
                    event.channel
                  }
                </td>

                <td>
                  {
                    event.region ||
                    "—"
                  }
                </td>

                <td>
                  {event.offline
                    ? "Offline"
                    : "Online"}
                </td>

                <td>
                  {reports.some(
                    (report) =>
                      report.eventId ===
                        event.id ||
                      report.batch ===
                        event.batch
                  )
                    ? "Yes"
                    : "No"}
                </td>

              </tr>
            )
          )}

        </tbody>

      </table>

    </div>
  );
}

function AuditTable({
  events,
}) {
  return (
    <div className="admin-table-wrap">

      <table className="admin-table">

        <thead>
          <tr>
            <th>
              Audit ID
            </th>
            <th>
              Timestamp
            </th>
            <th>
              Actor / Role
            </th>
            <th>
              Action
            </th>
            <th>
              Record Type
            </th>
            <th>
              Record ID
            </th>
            <th>
              Previous State
            </th>
            <th>
              New State
            </th>
          </tr>
        </thead>

        <tbody>

          {events.map(
            (event) => (
              <tr key={event.id}>

                <td>
                  {
                    event.id
                  }
                </td>

                <td>
                  {formatEventTime(
                    event.timestamp
                  )}
                </td>

                <td>
                  {
                    event.actor
                  }
                </td>

                <td>
                  {
                    event.action
                  }
                </td>

                <td>
                  {
                    event.recordType
                  }
                </td>

                <td>
                  {
                    event.recordId
                  }
                </td>

                <td>
                  {
                    event.previousState
                  }
                </td>

                <td>
                  {
                    event.newState
                  }
                </td>

              </tr>
            )
          )}

        </tbody>

      </table>

    </div>
  );
}

function RegionMap({
  regions,
}) {
  return (
    <div className="admin-region-map">

      <div className="australia-map-shape">

        {regions.map(
          (region, index) => {
            const positions = [
              {
                left: "72%",
                top: "56%",
              },
              {
                left: "65%",
                top: "73%",
              },
              {
                left: "48%",
                top: "68%",
              },
              {
                left: "76%",
                top: "40%",
              },
              {
                left: "22%",
                top: "65%",
              },
            ];

            const position =
              positions[
                index %
                  positions.length
              ];

            return (
              <button
                type="button"
                key={
                  region.region
                }
                className="map-region-marker"
                style={
                  position
                }
              >
                <span className="map-marker-dot">
                  {
                    region.total
                  }
                </span>

                <strong>
                  {
                    region.region
                  }
                </strong>

                <small>
                  {region.noMatch} No Match · {region.reports} reports
                </small>
              </button>
            );
          }
        )}

      </div>

    </div>
  );
}

function MapFilters({
  value,
  onChange,
}) {
  const options = [
    ["ALL", "All"],
    ["MATCH", "Match"],
    [
      "NO_MATCH",
      "No Match",
    ],
    [
      "NOT_COVERED",
      "Unable to Verify",
    ],
    [
      "REPORTED",
      "Reported",
    ],
  ];

  return (
    <div className="admin-filter-pills">

      {options.map(
        ([key, label]) => (
          <button
            type="button"
            key={key}
            className={
              value === key
                ? "active"
                : ""
            }
            onClick={() =>
              onChange(key)
            }
          >
            {label}
          </button>
        )
      )}

    </div>
  );
}

function InvestigationTimeline({
  batch,
  events,
  reports,
  audits,
}) {
  const items = [
    ...events
      .filter(
        (event) =>
          event.batch ===
          batch
      )
      .map((event) => ({
        id: event.id,
        timestamp:
          event.timestamp,
        title:
          resultLabel(
            event.result
          ),
        text: `${event.channel} verification · ${event.region || "Unknown region"}`,
      })),

    ...reports
      .filter(
        (report) =>
          report.batch ===
          batch
      )
      .map((report) => ({
        id: report.id,
        timestamp:
          report.createdAt,
        title:
          "Suspicious report submitted",
        text: report.id,
      })),

    ...audits
      .filter(
        (audit) =>
          reports.some(
            (report) =>
              report.batch ===
                batch &&
              report.id ===
                audit.recordId
          )
      )
      .map((audit) => ({
        id: audit.id,
        timestamp:
          audit.timestamp,
        title:
          audit.action,
        text: `${audit.previousState} → ${audit.newState}`,
      })),
  ].sort(
    (a, b) =>
      new Date(
        b.timestamp
      ).getTime() -
      new Date(
        a.timestamp
      ).getTime()
  );

  return (
    <div className="investigation-timeline">

      {items.map(
        (item) => (
          <div
            className="timeline-item"
            key={item.id}
          >
            <div className="timeline-dot" />

            <div>
              <span>
                {formatEventTime(
                  item.timestamp
                )}
              </span>

              <strong>
                {
                  item.title
                }
              </strong>

              <p>
                {
                  item.text
                }
              </p>
            </div>
          </div>
        )
      )}

    </div>
  );
}

function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  backAction,
}) {
  return (
    <div className="admin-page-header">

      <div>
        {backAction && (
          <button
            className="admin-back-link"
            onClick={
              backAction
            }
          >
            ← Back
          </button>
        )}

        <span className="admin-eyebrow">
          {eyebrow}
        </span>

        <h1>
          {title}
        </h1>

        <p>
          {subtitle}
        </p>
      </div>

      <span className="admin-access-badge">
        Admin Access
      </span>

    </div>
  );
}

function AdminSummary({
  label,
  value,
}) {
  return (
    <div className="admin-summary-card">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function AdminDetailRow({
  label,
  value,
}) {
  return (
    <div className="admin-detail-row">

      <span>
        {label}
      </span>

      <strong>
        {value || "—"}
      </strong>

    </div>
  );
}

function AdminNavButton({
  label,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`admin-nav-button ${
        active
          ? "active"
          : ""
      }`}
      onClick={onClick}
    >
      {label}
    </button>
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

        <h3>
          Supply Chain Snapshot
        </h3>

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
            Supply-chain history
          </span>

          <strong>
            Not Yet Covered
          </strong>
        </div>

      </div>
    );
  }

  return (
    <div className="supply-chain-card">

      <h3>
        Supply Chain Snapshot
      </h3>

      {product.supplyChain.map(
        (stage) => (
          <div
            key={stage.id}
            className="supply-chain-stage"
          >
            <div className="supply-stage-marker">
              ✓
            </div>

            <div>
              <strong>
                {stage.stage}
              </strong>

              <small>
                {
                  stage.organisation
                }
              </small>
            </div>
          </div>
        )
      )}

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
        {value || "—"}
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

function ScanIcon() {
  return (
    <svg
      className="home-scan-icon"
      viewBox="0 0 24 24"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M16 3h3a2 2 0 0 1 2 2v3" />
      <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle
        cx="11"
        cy="11"
        r="7"
      />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function BatchLookupIcon() {
  return (
    <SearchIcon />
  );
}

function RecallIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M6 10a6 6 0 0 1 12 0v4l2 3H4l2-3v-4Z" />
    </svg>
  );
}

function ShortagesIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect
        x="6"
        y="3"
        width="12"
        height="18"
        rx="2"
      />
    </svg>
  );
}

function EscalateIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 3 3 20h18L12 3Z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24">
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
    <svg viewBox="0 0 24 24">
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
    <svg viewBox="0 0 24 24">
      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="m3 3 18 18" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="security-lock"
      viewBox="0 0 24 24"
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
