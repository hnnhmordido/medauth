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
    name: "Ron",
    fullName: "Ron",
    title: "Consumer",
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
    comment:
      "Batch information does not match the prototype record.",
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

function findMedicine(identifier) {
  const value = identifier?.trim().toUpperCase();

  if (!value) {
    return null;
  }

  if (medicines[value]) {
    return medicines[value];
  }

  return (
    Object.values(medicines).find(
      (item) =>
        item.code?.toUpperCase() === value ||
        item.productId?.toUpperCase() === value
    ) || null
  );
}

function findMedicineByBatch(batch) {
  const value = batch?.trim().toUpperCase();

  if (!value) {
    return null;
  }

  return (
    Object.values(medicines).find(
      (item) =>
        item.batch?.toUpperCase() === value
    ) || null
  );
}

function getActiveRecalls() {
  return Object.values(medicines)
    .filter((item) => item.recall?.active)
    .map((item, index) => ({
      id:
        item.recall.id ||
        `RECALL-${index + 1}`,

      medicineName: item.medicineName,
      productId: item.productId,
      batch: item.batch,

      recallDate:
        item.recall.recallDate ||
        "2026-08-01",

      severity:
        item.recall.severity ||
        "Moderate",

      status:
        item.recall.status ||
        "Active Recall",

      reason:
        item.recall.reason ||
        "Prototype recall notice for demonstration purposes.",
    }));
}

function normaliseEvent(event, index = 0) {
  const timestamp =
    event.timestamp ||
    event.dateTime ||
    event.date ||
    new Date().toISOString();

  const product = findMedicine(
    event.code || event.productId
  );

  return {
    id:
      event.id ||
      `EVENT-${index}-${timestamp}`,

    code:
      event.code ||
      event.productCode ||
      product?.code ||
      "",

    productId:
      event.productId ||
      product?.productId ||
      "",

    medicine:
      event.medicine ||
      event.medicineName ||
      event.productName ||
      product?.medicineName ||
      "Medicine",

    batch:
      event.batch ||
      event.batchNumber ||
      product?.batch ||
      "—",

    result:
      event.result ||
      event.status ||
      "NOT_COVERED",

    timestamp,

    offline: Boolean(
      event.offline || event.cached
    ),

    pendingSync: Boolean(
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
    identifier?.trim().toUpperCase();

  const normalizedBatch =
    batch?.trim().toUpperCase();

  const product = findMedicine(
    normalizedIdentifier
  );

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

  if (
    offline &&
    product.cached === false
  ) {
    return {
      status: "NOT_COVERED",
      product,
      scannedCode: normalizedIdentifier,
      scannedBatch: normalizedBatch,
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
      scannedCode: normalizedIdentifier,
      scannedBatch: normalizedBatch,
      offline,
      mismatchField: null,
    };
  }

  if (
    normalizedBatch &&
    normalizedBatch !==
      product.batch?.toUpperCase()
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
      normalizedBatch ||
      product.batch,
    offline,
    mismatchField: null,
  };
}

function downloadCsv(filename, rows) {
  if (!rows.length) {
    return;
  }

  const headers =
    Object.keys(rows[0]);

  const escapeValue = (value) => {
    const text =
      value === null ||
      value === undefined
        ? ""
        : String(value);

    return `"${text.replaceAll(
      '"',
      '""'
    )}"`;
  };

  const csv = [
    headers
      .map(escapeValue)
      .join(","),

    ...rows.map((row) =>
      headers
        .map((header) =>
          escapeValue(
            row[header]
          )
        )
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url =
    URL.createObjectURL(blob);

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
    reportOrigin,
    setReportOrigin,
  ] = useState("result");

  const [reports, setReports] =
    useState(
      initialAdminReports
    );

  const [
    adminMode,
    setAdminMode,
  ] = useState("");

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
    useMemo(
      () => ({
        openReports:
          reports.filter(
            (report) =>
              report.status ===
              "NEW"
          ).length,

        underReview:
          reports.filter(
            (report) =>
              report.status ===
              "UNDER_REVIEW"
          ).length,

        noMatch:
          pharmacistEvents.filter(
            (event) =>
              event.result ===
              "NO_MATCH"
          ).length,

        unable:
          pharmacistEvents.filter(
            (event) =>
              event.result ===
              "NOT_COVERED"
          ).length,

        recalls:
          activeRecalls.length,
      }),
      [
        reports,
        pharmacistEvents,
        activeRecalls,
      ]
    );

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
            return region.match > 0;
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
          if (
            !batches[event.batch]
          ) {
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
            !batches[
              report.batch
            ]
          ) {
            batches[
              report.batch
            ] = {
              batch:
                report.batch,
              region:
                report.region ||
                "Unknown",
              scans: 0,
              noMatch: 0,
              reports: 0,
            };
          }

          batches[
            report.batch
          ].reports += 1;
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
          setAdminMode("");
          setScreen(
            "adminModeChoice"
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

          const newEvent = {
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
                : role ===
                  "admin"
                ? "ADMIN"
                : "CONSUMER",

            offline,

            pendingSync:
              offline,

            region:
              product
                ?.coarseRegion ||
              (role ===
              "pharmacist"
                ? "Adelaide SA"
                : ""),

            type:
              "verification",
          };

          setVerificationEvents(
            (current) => [
              newEvent,
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
                    : role ===
                      "admin"
                    ? "Admin"
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
        "Adelaide SA",

      reporterType:
        role ===
        "pharmacist"
          ? "Pharmacist"
          : role ===
            "admin"
          ? "Admin"
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
              : role ===
                "admin"
              ? "Admin"
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

    if (offline) {
      setPendingSync(
        (current) =>
          current + 1
      );
    }

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
    setAdminMode("");

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
    setBatchProductCode("");
    setBatchResult(null);

    setSelectedRecall(null);
    setSelectedAdminReport(null);
    setSelectedInvestigation(null);
  };

  const goBack = () => {
    switch (screen) {
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
        } else if (
          role === "admin"
        ) {
          setScreen(
            adminMode ===
            "mobile"
              ? "adminMobileDashboard"
              : "adminModeChoice"
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

      case "adminMobileReports":
      case "adminMobileScanMonitor":
      case "adminMobileInvestigation":
      case "adminMobileAudit":
      case "adminMobileProfile":
      case "adminMobileSettings":
        setScreen(
          "adminMobileDashboard"
        );
        break;

      case "adminMobileReportDetail":
        setScreen(
          "adminMobileReports"
        );
        break;

      case "forgotPassword":
        if (
          role === "admin"
        ) {
          setScreen(
            adminMode ===
            "mobile"
              ? "adminMobileSettings"
              : "adminModeChoice"
          );
        } else if (
          role ===
          "pharmacist"
        ) {
          setScreen(
            "pharmacistSettings"
          );
        } else if (
          role ===
          "consumer"
        ) {
          setScreen(
            "consumerSettings"
          );
        } else {
          setScreen("home");
        }

        break;

      case "consumerProfile":
      case "consumerSettings":
        setScreen(
          "consumerDashboard"
        );
        break;

      case "manufacturerDashboard":
      case "consumerDashboard":
      case "pharmacistDashboard":
        setScreen("home");
        break;

      default:
        setScreen("home");
        break;
    }
  };

  const isAdminWebScreen =
    role === "admin" &&
    adminMode === "web" &&
    screen.startsWith(
      "admin"
    ) &&
    !screen.startsWith(
      "adminMobile"
    ) &&
    screen !==
      "adminModeChoice";

  if (isAdminWebScreen) {
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
          currentUser={
            currentUser
          }
          search={adminSearch}
          setSearch={
            setAdminSearch
          }
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
          summary={
            adminSummary
          }
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
          handleNetworkToggle={
            handleNetworkToggle
          }
          onExport={(type) => {
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
          onSwitchMobile={() => {
            setAdminMode(
              "mobile"
            );

            setScreen(
              "adminMobileDashboard"
            );
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
                    value={password}
                    onChange={(
                      event
                    ) => {
                      setPassword(
                        event.target
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
                Protected by AES-256 encryption · TLS 1.3 · ISO 27001
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
                          event.target
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
                  onClick={goBack}
                >
                  Return
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

        {/* CHECKING */}

        {screen ===
          "checking" && (
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

        {/* RESULT */}

        {screen ===
          "result" &&
          result && (
          <section className="screen">

            <BackButton
              onClick={goBack}
            />

            <StatusCard
              status={
                result.status
              }
              title={
                result.status ===
                "MATCH"
                  ? result.offline
                    ? "Data match found — Offline"
                    : "Data match found"
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
                  ? "The scanned information does not fully match the product or batch information registered in MedAuth."
                  : "MedAuth does not currently have enough prototype information to verify this medicine."
              }
            />

            {result.product && (
              <MedicineResultDetails
                product={
                  result.product
                }
                scannedBatch={
                  result.scannedBatch
                }
              />
            )}

            {result.status ===
              "MATCH" && (
              <div className="verification-info-box">

                <strong>
                  What this means
                </strong>

                <p>
                  This result confirms that the scanned information matches the registered prototype record. It does not guarantee that the medicine is authentic or safe to use.
                </p>

              </div>
            )}

            {result.status ===
              "NO_MATCH" && (
              <div className="verification-warning-box">

                <strong>
                  Important
                </strong>

                <p>
                  A No Match result does not confirm that this medicine is counterfeit.
                </p>

              </div>
            )}

            {result.status ===
              "NOT_COVERED" && (
              <div className="verification-info-box">

                <strong>
                  What this means
                </strong>

                <p>
                  This does not mean the medicine is counterfeit.
                </p>

              </div>
            )}

            <SupplyChainSnapshot
              product={
                result.product
              }
              result={result}
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

              {result.status ===
                "NO_MATCH" && (
                <>
                  {role ===
                    "pharmacist" && (
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
                  )}

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
                </>
              )}

              {result.status ===
                "NOT_COVERED" && (
                <>
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
                    .source ||
                  "MedAuth prototype dataset"
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

        {/* REPORT */}

        {screen === "report" && (
          <section className="screen">

            <BackButton
              onClick={goBack}
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
                  result?.scannedBatch ||
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
            ) : role ===
              "admin" ? (
              <PrimaryButton
                onClick={() =>
                  setScreen(
                    adminMode ===
                    "mobile"
                      ? "adminMobileDashboard"
                      : "adminModeChoice"
                  )
                }
              >
                Back to Admin
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
          <section className="screen consumer-screen">

            <div className="consumer-profile-header">

              <div className="consumer-profile-main">

                <img
                  className="consumer-avatar"
                  src={`${import.meta.env.BASE_URL}consumer-ron.png`}
                  alt="Ron"
                />

                <div className="consumer-greeting">

                  <span className="consumer-welcome">
                    Welcome
                  </span>

                  <h1>
                    Hi, {currentUser?.name || "Ron"}
                  </h1>

                  <p>
                    Consumer
                  </p>

                </div>

              </div>

              <div className="consumer-profile-actions">

                <button
                  type="button"
                  className="profile-icon-button"
                  onClick={() =>
                    setScreen(
                      "consumerProfile"
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
                      "consumerSettings"
                    )
                  }
                  aria-label="Settings"
                >
                  <SettingsIcon />
                </button>

              </div>

            </div>

            <div
              className={`consumer-system-status ${
                offline
                  ? "is-offline"
                  : "is-online"
              }`}
            >

              <div>

                <strong>
                  {offline
                    ? "Offline — Using Cached Data"
                    : "System Online"}
                </strong>

                {pendingSync > 0 && (
                  <span>
                    Pending Sync: {pendingSync}
                  </span>
                )}

              </div>

              <NetworkBadge
                offline={offline}
                onToggle={handleNetworkToggle}
              />

            </div>

            <div className="consumer-welcome-card">

              <div className="consumer-welcome-icon">
                <ScanIcon />
              </div>

              <div>

                <h2>
                  Check your medicine
                </h2>

                <p>
                  Scan the package or enter the medicine code.
                </p>

              </div>

            </div>

            <button
              type="button"
              className="consumer-primary-action"
              onClick={() =>
                setScreen(
                  "scan"
                )
              }
            >

              <ScanIcon />

              <div>

                <strong>
                  Scan Medicine
                </strong>

                <span>
                  Scan a medicine package code
                </span>

              </div>

              <span aria-hidden="true">
                →
              </span>

            </button>

            <button
              type="button"
              className="consumer-enter-code"
              onClick={() =>
                setScreen(
                  "manual"
                )
              }
            >

              <div className="consumer-enter-code-icon">
                <CodeIcon />
              </div>

              <div>

                <strong>
                  Enter Code
                </strong>

                <span>
                  Type the medicine code manually
                </span>

              </div>

              <span className="consumer-enter-arrow" aria-hidden="true">
                →
              </span>

            </button>

            <div className="consumer-privacy-card">

              <div className="consumer-privacy-icon">
                <LockIcon />
              </div>

              <div>

                <strong>
                  Private and simple
                </strong>

                <span>
                  No account required to check a medicine
                </span>

                <span>
                  No health information needed
                </span>

              </div>

            </div>

            <div className="consumer-prototype-note">
              MedAuth compares medicine information with prototype records. A match does not guarantee that a medicine is authentic or safe.
            </div>

            <button
              type="button"
              className="consumer-signout-link"
              onClick={reset}
            >
              Sign Out
            </button>

          </section>
        )}

        {/* CONSUMER PROFILE */}

        {screen ===
          "consumerProfile" && (
          <section className="screen consumer-profile-page">

            <BackButton
              onClick={() =>
                setScreen(
                  "consumerDashboard"
                )
              }
            />

            <div className="consumer-profile-page-header">

              <img
                className="consumer-profile-page-avatar"
                src={`${import.meta.env.BASE_URL}consumer-ron.png`}
                alt="Ron"
              />

              <h1>
                {currentUser?.fullName || "Ron"}
              </h1>

              <p>
                Consumer
              </p>

              <span className="consumer-status-badge">
                Demo Profile
              </span>

            </div>

            <div className="profile-information-card">

              <ProfileRow
                label="Name"
                value={currentUser?.fullName || "Ron"}
              />

              <ProfileRow
                label="Role"
                value="Consumer"
              />

              <ProfileRow
                label="Email"
                value={
                  currentUser?.email ||
                  "consumer@medauth.com"
                }
              />

            </div>

            <div className="profile-note">

              <LockIcon />

              <span>
                This demo profile is optional. Medicine verification does not require personal health information.
              </span>

            </div>

          </section>
        )}

        {/* CONSUMER SETTINGS */}

        {screen ===
          "consumerSettings" && (
          <section className="screen">

            <BackButton
              onClick={() =>
                setScreen(
                  "consumerDashboard"
                )
              }
            />

            <div className="eyebrow">
              Consumer
            </div>

            <h1>
              Settings
            </h1>

            <div className="settings-card">

              <div className="settings-row">

                <div>

                  <strong>
                    Connection
                  </strong>

                  <span>
                    {offline
                      ? "Offline — cached data"
                      : "System Online"}
                  </span>

                </div>

                <NetworkBadge
                  offline={offline}
                  onToggle={handleNetworkToggle}
                />

              </div>

              <div className="settings-row">

                <div>

                  <strong>
                    Pending Sync
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
                    Keep your demo preference
                  </span>

                </div>

                <input
                  className="settings-checkbox"
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(event) =>
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
                    "consumerProfile"
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
                    "consumer@medauth.com"
                  );

                  setResetSent(false);

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

              <span>→</span>

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
                className="pharmacist-action-card"
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
              screen={screen}
              setScreen={
                setScreen
              }
            />

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

            {batchProductCode && (
              <div className="notice">
                Product:{" "}
                <strong>
                  {
                    batchProductCode
                  }
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
                  label="Scanned batch"
                  value={
                    batchResult.batch
                  }
                />

                <Row
                  label="Medicine"
                  value={
                    batchResult.medicine
                      ? batchResult
                          .medicine
                          .medicineName
                      : "No prototype medicine found"
                  }
                />

                {batchResult.medicine && (
                  <Row
                    label="Registered batch"
                    value={
                      batchResult
                        .medicine
                        .batch
                    }
                  />
                )}

                {batchResult.recall && (
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

              {activeRecalls.length ===
              0 ? (
                <div className="panel">

                  <h3>
                    No active prototype recalls
                  </h3>

                  <p>
                    Add recall data to a medicine record to display it here.
                  </p>

                </div>
              ) : (
                activeRecalls.map(
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

        {/* SHORTAGES */}

        {screen ===
          "pharmacistShortages" && (
          <section className="screen">

            <BackButton
              onClick={goBack}
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
              screen={screen}
              setScreen={
                setScreen
              }
            />

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
                      value={formatEventTime(
                        event.timestamp
                      )}
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
              screen={screen}
              setScreen={
                setScreen
              }
            />

          </section>
        )}

        {/* PHARMACIST PROFILE */}

        {screen ===
          "pharmacistProfile" && (
          <section className="screen">

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

        {/* PHARMACIST SETTINGS */}

        {screen ===
          "pharmacistSettings" && (
          <section className="screen">

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
                    Activity waiting to synchronise
                  </span>
                </div>

                <span className="settings-value">
                  {
                    pendingSync
                  }
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

                <span>→</span>
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

                <span>→</span>
              </button>

            </div>

            <SecondaryButton
              onClick={reset}
            >
              Sign Out
            </SecondaryButton>

          </section>
        )}

        {/* ADMIN CHOICE */}

        {screen ===
          "adminModeChoice" && (
          <section className="screen admin-mode-choice-screen">

            <div className="admin-mobile-choice-profile">

              <img
                className="admin-mobile-choice-avatar"
                src={`${import.meta.env.BASE_URL}admin-luna.png`}
                alt="Luna"
              />

              <span className="admin-mobile-choice-welcome">
                Welcome back
              </span>

              <h1>
                Hi, Luna
              </h1>

              <p>
                MedAuth Administrator
              </p>

            </div>

            <div className="admin-choice-copy">

              <h2>
                Choose Admin Experience
              </h2>

              <p>
                Select the layout you want to use. Both versions use the same MedAuth prototype data.
              </p>

            </div>

            <div className="admin-mode-choice-grid">

              <button
                type="button"
                className="admin-mode-choice-card"
                onClick={() => {
                  setAdminMode(
                    "mobile"
                  );

                  setScreen(
                    "adminMobileDashboard"
                  );
                }}
              >

                <div className="admin-mode-choice-icon">
                  <MobileAdminIcon />
                </div>

                <div>
                  <strong>
                    Mobile Admin
                  </strong>

                  <span>
                    Compact administration dashboard designed for a phone.
                  </span>
                </div>

                <span className="admin-mode-arrow">
                  →
                </span>

              </button>

              <button
                type="button"
                className="admin-mode-choice-card web"
                onClick={() => {
                  setAdminMode(
                    "web"
                  );

                  setScreen(
                    "adminOverview"
                  );
                }}
              >

                <div className="admin-mode-choice-icon">
                  <DesktopAdminIcon />
                </div>

                <div>
                  <strong>
                    Web Dashboard
                  </strong>

                  <span>
                    Full investigation workspace designed for desktop.
                  </span>
                </div>

                <span className="admin-mode-arrow">
                  →
                </span>

              </button>

            </div>

            <div className="admin-choice-note">
              You can change between Mobile and Web later from Settings.
            </div>

            <SecondaryButton
              onClick={reset}
            >
              Sign Out
            </SecondaryButton>

          </section>
        )}

        {/* ADMIN MOBILE DASHBOARD */}

        {screen ===
          "adminMobileDashboard" && (
          <section className="screen admin-mobile-screen">

            <div className="admin-mobile-profile-header">

              <div className="admin-mobile-profile-main">

                <img
                  className="admin-mobile-avatar"
                  src={`${import.meta.env.BASE_URL}admin-luna.png`}
                  alt="Luna"
                />

                <div className="admin-mobile-greeting">

                  <span>
                    Welcome back
                  </span>

                  <h1>
                    Hi, Luna
                  </h1>

                  <p>
                    MedAuth Administrator
                  </p>

                </div>

              </div>

              <div className="admin-mobile-profile-actions">

                <button
                  type="button"
                  className="profile-icon-button"
                  onClick={() =>
                    setScreen(
                      "adminMobileProfile"
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
                      "adminMobileSettings"
                    )
                  }
                  aria-label="Settings"
                >
                  <SettingsIcon />
                </button>

              </div>

            </div>

            <div className="admin-mobile-access-row">

              <span className="admin-access-badge">
                Admin Access
              </span>

              <NetworkBadge
                offline={offline}
                onToggle={
                  handleNetworkToggle
                }
              />

            </div>

            <div className="admin-mobile-summary">

              <AdminMobileMetric
                label="Open Reports"
                value={
                  adminSummary
                    .openReports
                }
              />

              <AdminMobileMetric
                label="Under Review"
                value={
                  adminSummary
                    .underReview
                }
              />

              <AdminMobileMetric
                label="No Match"
                value={
                  adminSummary
                    .noMatch
                }
              />

              <AdminMobileMetric
                label="Unable"
                value={
                  adminSummary
                    .unable
                }
              />

            </div>

            <div className="admin-mobile-action-grid">

              <button
                type="button"
                className="admin-mobile-action-card primary"
                onClick={() =>
                  setScreen(
                    "adminMobileReports"
                  )
                }
              >
                <AdminReportIcon />

                <div>
                  <strong>
                    Reports
                  </strong>

                  <span>
                    Review suspicious medicine reports
                  </span>
                </div>
              </button>

              <button
                type="button"
                className="admin-mobile-action-card"
                onClick={() =>
                  setScreen(
                    "adminMobileScanMonitor"
                  )
                }
              >
                <ScanIcon />

                <div>
                  <strong>
                    Scan Monitor
                  </strong>

                  <span>
                    Review verification activity
                  </span>
                </div>
              </button>

              <button
                type="button"
                className="admin-mobile-action-card"
                onClick={() =>
                  setScreen(
                    "adminMobileInvestigation"
                  )
                }
              >
                <InvestigationIcon />

                <div>
                  <strong>
                    Investigation
                  </strong>

                  <span>
                    Review suspect activity
                  </span>
                </div>
              </button>

              <button
                type="button"
                className="admin-mobile-action-card"
                onClick={() =>
                  setScreen(
                    "adminMobileAudit"
                  )
                }
              >
                <AuditIcon />

                <div>
                  <strong>
                    Audit Trail
                  </strong>

                  <span>
                    Review administrative actions
                  </span>
                </div>
              </button>

            </div>

            <div className="admin-mobile-recent">

              <div className="section-heading-row">

                <h3>
                  Recent Reports
                </h3>

                <button
                  type="button"
                  className="text-action"
                  onClick={() =>
                    setScreen(
                      "adminMobileReports"
                    )
                  }
                >
                  View All
                </button>

              </div>

              {reports
                .slice(0, 3)
                .map(
                  (report) => (
                    <button
                      type="button"
                      className="admin-mobile-report-row"
                      key={
                        report.id
                      }
                      onClick={() => {
                        setSelectedAdminReport(
                          report
                        );

                        setScreen(
                          "adminMobileReportDetail"
                        );
                      }}
                    >

                      <div>

                        <strong>
                          {
                            report.medicine
                          }
                        </strong>

                        <span>
                          {report.id} · Batch{" "}
                          {
                            report.batch
                          }
                        </span>

                      </div>

                      <span
                        className={`admin-mobile-status ${
                          report.status ===
                          "NEW"
                            ? "warning"
                            : report.status ===
                              "UNDER_REVIEW"
                            ? "info"
                            : "success"
                        }`}
                      >
                        {report.status.replaceAll(
                          "_",
                          " "
                        )}
                      </span>

                    </button>
                  )
                )}

            </div>

            <AdminMobileNav
              screen={screen}
              setScreen={
                setScreen
              }
            />

          </section>
        )}

        {/* ADMIN MOBILE REPORTS */}

        {screen ===
          "adminMobileReports" && (
          <section className="screen admin-mobile-sub-screen">

            <BackButton
              onClick={goBack}
            />

            <div className="eyebrow">
              Admin
            </div>

            <h1>
              Reports
            </h1>

            <div className="admin-mobile-filter-row">

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

            <div className="admin-mobile-list">

              {filteredReports.map(
                (report) => (
                  <button
                    type="button"
                    className="admin-mobile-list-card"
                    key={
                      report.id
                    }
                    onClick={() => {
                      setSelectedAdminReport(
                        report
                      );

                      setScreen(
                        "adminMobileReportDetail"
                      );
                    }}
                  >

                    <div className="admin-mobile-list-card-head">

                      <strong>
                        {
                          report.medicine
                        }
                      </strong>

                      <span
                        className={`admin-mobile-status ${
                          report.status ===
                          "NEW"
                            ? "warning"
                            : report.status ===
                              "UNDER_REVIEW"
                            ? "info"
                            : "success"
                        }`}
                      >
                        {report.status.replaceAll(
                          "_",
                          " "
                        )}
                      </span>

                    </div>

                    <span>
                      {report.id}
                    </span>

                    <span>
                      Batch{" "}
                      {report.batch}
                    </span>

                    <span>
                      {resultLabel(
                        report.verificationResult
                      )}{" "}
                      ·{" "}
                      {report.region ||
                        "No region"}
                    </span>

                  </button>
                )
              )}

            </div>

            <AdminMobileNav
              screen={screen}
              setScreen={
                setScreen
              }
            />

          </section>
        )}

        {/* ADMIN MOBILE REPORT DETAIL */}

        {screen ===
          "adminMobileReportDetail" &&
          selectedAdminReport && (
          <section className="screen admin-mobile-sub-screen">

            <BackButton
              onClick={goBack}
            />

            <div className="eyebrow">
              Report review
            </div>

            <h1>
              {
                selectedAdminReport.id
              }
            </h1>

            <div className="admin-mobile-detail-card">

              <Row
                label="Medicine"
                value={
                  selectedAdminReport
                    .medicine
                }
              />

              <Row
                label="Product"
                value={
                  selectedAdminReport
                    .productId
                }
              />

              <Row
                label="Batch"
                value={
                  selectedAdminReport
                    .batch
                }
              />

              <Row
                label="Result"
                value={resultLabel(
                  selectedAdminReport
                    .verificationResult
                )}
              />

              <Row
                label="Reporter"
                value={
                  selectedAdminReport
                    .reporterType
                }
              />

              <Row
                label="Region"
                value={
                  selectedAdminReport
                    .region ||
                  "—"
                }
              />

            </div>

            <div className="admin-mobile-comment">

              <strong>
                Report comment
              </strong>

              <p>
                {selectedAdminReport
                  .comment ||
                  "No comment supplied."}
              </p>

            </div>

            <div className="admin-mobile-status-actions">

              <button
                type="button"
                onClick={() =>
                  updateReportStatus(
                    selectedAdminReport
                      .id,
                    "NEW"
                  )
                }
              >
                New
              </button>

              <button
                type="button"
                onClick={() =>
                  updateReportStatus(
                    selectedAdminReport
                      .id,
                    "UNDER_REVIEW"
                  )
                }
              >
                Under Review
              </button>

              <button
                type="button"
                onClick={() =>
                  updateReportStatus(
                    selectedAdminReport
                      .id,
                    "RESOLVED"
                  )
                }
              >
                Resolved
              </button>

            </div>

            <label className="admin-mobile-escalate">

              <input
                type="checkbox"
                checked={
                  selectedAdminReport
                    .escalated
                }
                onChange={() =>
                  toggleEscalation(
                    selectedAdminReport
                      .id
                  )
                }
              />

              <span>
                Escalate for Investigation
              </span>

            </label>

          </section>
        )}

        {/* ADMIN MOBILE SCANS */}

        {screen ===
          "adminMobileScanMonitor" && (
          <section className="screen admin-mobile-sub-screen">

            <BackButton
              onClick={goBack}
            />

            <div className="eyebrow">
              Admin monitoring
            </div>

            <h1>
              Scan Monitor
            </h1>

            <div className="admin-mobile-filter-row">

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

            <div className="admin-mobile-list">

              {filteredScanEvents.map(
                (event) => (
                  <div
                    className="admin-mobile-list-card"
                    key={
                      event.id
                    }
                  >

                    <div className="admin-mobile-list-card-head">

                      <strong>
                        {
                          event.medicine
                        }
                      </strong>

                      <span
                        className={`admin-mobile-result ${event.result.toLowerCase()}`}
                      >
                        {resultLabel(
                          event.result
                        )}
                      </span>

                    </div>

                    <span>
                      {event.id}
                    </span>

                    <span>
                      Batch{" "}
                      {
                        event.batch
                      }
                    </span>

                    <span>
                      {
                        event.channel
                      }{" "}
                      ·{" "}
                      {event.region ||
                        "Unknown region"}
                    </span>

                    <span>
                      {event.offline
                        ? "Offline"
                        : "Online"}{" "}
                      ·{" "}
                      {formatEventTime(
                        event.timestamp
                      )}
                    </span>

                  </div>
                )
              )}

            </div>

            <AdminMobileNav
              screen={screen}
              setScreen={
                setScreen
              }
            />

          </section>
        )}

        {/* ADMIN MOBILE INVESTIGATION */}

        {screen ===
          "adminMobileInvestigation" && (
          <section className="screen admin-mobile-sub-screen">

            <BackButton
              onClick={goBack}
            />

            <div className="eyebrow">
              Admin investigation
            </div>

            <h1>
              Investigation
            </h1>

            <div className="admin-mobile-list">

              {suspectClusters.map(
                (cluster) => (
                  <button
                    type="button"
                    className="admin-mobile-list-card"
                    key={
                      cluster.batch
                    }
                    onClick={() =>
                      setSelectedInvestigation(
                        cluster
                      )
                    }
                  >

                    <div className="admin-mobile-list-card-head">

                      <strong>
                        Batch{" "}
                        {
                          cluster.batch
                        }
                      </strong>

                      <span className="admin-mobile-status warning">
                        Review
                      </span>

                    </div>

                    <span>
                      {
                        cluster.region
                      }
                    </span>

                    <span>
                      {cluster.scans} scans ·{" "}
                      {cluster.noMatch} No Match
                    </span>

                    <span>
                      {cluster.reports} linked reports
                    </span>

                  </button>
                )
              )}

            </div>

            {selectedInvestigation && (
              <div className="admin-mobile-investigation-selected">

                <h3>
                  Selected Investigation
                </h3>

                <Row
                  label="Batch"
                  value={
                    selectedInvestigation
                      .batch
                  }
                />

                <Row
                  label="Region"
                  value={
                    selectedInvestigation
                      .region
                  }
                />

                <Row
                  label="No Match"
                  value={
                    selectedInvestigation
                      .noMatch
                  }
                />

                <Row
                  label="Reports"
                  value={
                    selectedInvestigation
                      .reports
                  }
                />

              </div>
            )}

            <AdminMobileNav
              screen={screen}
              setScreen={
                setScreen
              }
            />

          </section>
        )}

        {/* ADMIN MOBILE AUDIT */}

        {screen ===
          "adminMobileAudit" && (
          <section className="screen admin-mobile-sub-screen">

            <BackButton
              onClick={goBack}
            />

            <div className="eyebrow">
              Administration
            </div>

            <h1>
              Audit Trail
            </h1>

            <div className="admin-mobile-list">

              {filteredAudit.map(
                (event) => (
                  <div
                    className="admin-mobile-list-card"
                    key={
                      event.id
                    }
                  >

                    <strong>
                      {
                        event.action
                      }
                    </strong>

                    <span>
                      {event.id}
                    </span>

                    <span>
                      {
                        event.actor
                      }{" "}
                      ·{" "}
                      {
                        event.recordType
                      }
                    </span>

                    <span>
                      {
                        event.previousState
                      }{" "}
                      →{" "}
                      {
                        event.newState
                      }
                    </span>

                    <span>
                      {formatEventTime(
                        event.timestamp
                      )}
                    </span>

                  </div>
                )
              )}

            </div>

            <AdminMobileNav
              screen={screen}
              setScreen={
                setScreen
              }
            />

          </section>
        )}

        {/* ADMIN MOBILE PROFILE */}

        {screen ===
          "adminMobileProfile" && (
          <section className="screen admin-mobile-sub-screen">

            <BackButton
              onClick={goBack}
            />

            <div className="profile-page-header">

              <img
                className="profile-page-avatar"
                src={`${import.meta.env.BASE_URL}admin-luna.png`}
                alt="Luna"
              />

              <h1>
                {currentUser
                  ?.fullName ||
                  "Luna Chen"}
              </h1>

              <p>
                {currentUser
                  ?.title ||
                  "MedAuth Administrator"}
              </p>

              <span className="admin-access-badge">
                Admin / Regulator
              </span>

            </div>

            <div className="profile-information-card">

              <ProfileRow
                label="Name"
                value={
                  currentUser
                    ?.fullName ||
                  "Luna Chen"
                }
              />

              <ProfileRow
                label="Role"
                value="Admin / Regulator"
              />

              <ProfileRow
                label="Email"
                value={
                  currentUser
                    ?.email ||
                  "admin@medauth.com"
                }
              />

              <ProfileRow
                label="Organisation"
                value={
                  currentUser
                    ?.organisation ||
                  "MedAuth Administration"
                }
              />

            </div>

            <div className="profile-note">

              <LockIcon />

              <span>
                Authorised MedAuth prototype administrator account.
              </span>

            </div>

          </section>
        )}

        {/* ADMIN MOBILE SETTINGS */}

        {screen ===
          "adminMobileSettings" && (
          <section className="screen admin-mobile-sub-screen">

            <BackButton
              onClick={goBack}
            />

            <div className="eyebrow">
              Admin account
            </div>

            <h1>
              Settings
            </h1>

            <div className="settings-card">

              <div className="settings-row">

                <div>
                  <strong>
                    Admin experience
                  </strong>

                  <span>
                    Currently using Mobile Admin
                  </span>
                </div>

                <span className="settings-value">
                  Mobile
                </span>

              </div>

              <div className="settings-row">

                <div>
                  <strong>
                    Connection
                  </strong>

                  <span>
                    {offline
                      ? "Offline"
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

            <button
              type="button"
              className="admin-switch-web-button"
              onClick={() => {
                setAdminMode(
                  "web"
                );

                setScreen(
                  "adminOverview"
                );
              }}
            >

              <DesktopAdminIcon />

              <div>
                <strong>
                  Switch to Web Dashboard
                </strong>

                <span>
                  Open the full desktop investigation workspace.
                </span>
              </div>

              <span>→</span>

            </button>

            <SecondaryButton
              onClick={() => {
                setAdminMode(
                  ""
                );

                setScreen(
                  "adminModeChoice"
                );
              }}
            >
              Choose Admin Experience
            </SecondaryButton>

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

/* =========================================================
   ADMIN WEB
========================================================= */

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
  handleNetworkToggle,
  onExport,
  onSwitchMobile,
  onSignOut,
}) {
  const [
    exportOpen,
    setExportOpen,
  ] = useState(false);

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
            className="admin-switch-mobile-button"
            onClick={
              onSwitchMobile
            }
          >
            Switch to Mobile Admin
          </button>

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
                    (
                      current
                    ) =>
                      !current
                  )
                }
              >
                Export Data
              </button>

              {exportOpen && (
                <div className="admin-export-menu">

                  <button
                    type="button"
                    onClick={() =>
                      onExport(
                        "events"
                      )
                    }
                  >
                    Verification Events CSV
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onExport(
                        "reports"
                      )
                    }
                  >
                    Suspicious Reports CSV
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onExport(
                        "audit"
                      )
                    }
                  >
                    Audit Trail CSV
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onExport(
                        "investigation"
                      )
                    }
                  >
                    Investigation CSV
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
                  label="Recall Matches"
                  value={
                    summary.recalls
                  }
                />

              </div>

              <div className="admin-overview-grid">

                <section className="admin-panel">

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
                        (
                          cluster
                        ) => (
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
                    {selectedReport.comment ||
                      "No comment supplied."}
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

              <section className="admin-panel admin-map-panel">

                <div className="admin-section-head">

                  <h2>
                    Verification Activity Map
                  </h2>

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
                          (
                            cluster
                          ) => (
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
                    <p>
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

/* =========================================================
   HELPERS
========================================================= */

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
                  {report.id}
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
                  {report.region ||
                    "—"}
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
                    {report.status.replaceAll(
                      "_",
                      " "
                    )}
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
                  {event.productId ||
                    event.code}
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
                  {event.region ||
                    "—"}
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
          (
            region,
            index
          ) => {
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
    [
      "ALL",
      "All",
    ],

    [
      "MATCH",
      "Match",
    ],

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
        ([
          key,
          label,
        ]) => (
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
      .map(
        (event) => ({
          id: event.id,

          timestamp:
            event.timestamp,

          title:
            resultLabel(
              event.result
            ),

          text:
            `${event.channel} verification · ${
              event.region ||
              "Unknown region"
            }`,
        })
      ),

    ...reports
      .filter(
        (report) =>
          report.batch ===
          batch
      )
      .map(
        (report) => ({
          id:
            report.id,

          timestamp:
            report.createdAt,

          title:
            "Suspicious report submitted",

          text:
            report.id,
        })
      ),

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
      .map(
        (audit) => ({
          id:
            audit.id,

          timestamp:
            audit.timestamp,

          title:
            audit.action,

          text:
            `${audit.previousState} → ${audit.newState}`,
        })
      ),
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
                {item.title}
              </strong>

              <p>
                {item.text}
              </p>

            </div>

          </div>
        )
      )}

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
          product.lastUpdated?.replace(
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
                key={stage.id}
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
                          : stage.status?.toLowerCase()
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

function AdminMobileMetric({
  label,
  value,
}) {
  return (
    <div className="admin-mobile-metric">

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

function AdminMobileNav({
  screen,
  setScreen,
}) {
  const items = [
    {
      label:
        "Home",

      screen:
        "adminMobileDashboard",
    },

    {
      label:
        "Reports",

      screen:
        "adminMobileReports",
    },

    {
      label:
        "Scans",

      screen:
        "adminMobileScanMonitor",
    },

    {
      label:
        "Investigate",

      screen:
        "adminMobileInvestigation",
    },

    {
      label:
        "Audit",

      screen:
        "adminMobileAudit",
    },
  ];

  return (
    <nav className="admin-mobile-nav">

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
        {value || "—"}
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

        <p>
          TestMed 5mg — not yet covered
        </p>

      </div>
    </>
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

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
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
  return <SearchIcon />;
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

function CodeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M8 9 5 12l3 3" />
      <path d="m16 9 3 3-3 3" />
      <path d="m14 5-4 14" />
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

function MobileAdminIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="7"
        y="2"
        width="10"
        height="20"
        rx="2"
      />

      <path d="M10 18h4" />
    </svg>
  );
}

function DesktopAdminIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="12"
        rx="2"
      />

      <path d="M8 21h8" />

      <path d="M12 16v5" />
    </svg>
  );
}

function AdminReportIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M7 3h10l3 3v15H4V3h3Z" />

      <path d="M8 10h8" />

      <path d="M8 14h8" />
    </svg>
  );
}

function InvestigationIcon() {
  return <SearchIcon />;
}

function AuditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="3"
        width="14"
        height="18"
        rx="2"
      />

      <path d="M8 8h8" />

      <path d="M8 12h8" />

      <path d="M8 16h5" />
    </svg>
  );
}
