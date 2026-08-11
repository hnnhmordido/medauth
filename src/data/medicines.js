export const medicines = {
  "MED-001": {
    productId: "09312345678901",
    code: "MED-001",
    medicineName: "SampleMed 10mg",
    manufacturer: "ABC Pharmaceuticals",
    batch: "B1001",
    expiry: "2027-12",
    countryOfOrigin: "Australia",
    coverageStatus: "ENROLLED",
    cached: true,
    source: "MedAuth prototype registry",
    lastUpdated: "2026-08-10T08:00:00",
    pharmacy: "MedAuth Community Pharmacy",
    coarseRegion: "Adelaide SA",

    recall: {
      active: false,
      status: "No Active Recall",
      recallDate: null,
      severity: null,
      reason: null,
    },

    supplyChain: [
      {
        id: "SC-001-1",
        stage: "Manufactured",
        status: "VERIFIED",
        organisation: "ABC Pharmaceuticals",
        date: "2026-06-02",
      },
      {
        id: "SC-001-2",
        stage: "Quality Control",
        status: "VERIFIED",
        organisation: "ABC Quality Laboratory",
        date: "2026-06-04",
      },
      {
        id: "SC-001-3",
        stage: "Barcode Registered",
        status: "VERIFIED",
        organisation: "MedAuth Prototype Registry",
        date: "2026-06-05",
        detail: "09312345678901",
      },
      {
        id: "SC-001-4",
        stage: "Distributed",
        status: "VERIFIED",
        organisation: "Southern Health Distribution",
        date: "2026-06-10",
      },
      {
        id: "SC-001-5",
        stage: "At Pharmacy",
        status: "CURRENT",
        organisation: "MedAuth Community Pharmacy",
        date: "2026-06-14",
      },
      {
        id: "SC-001-6",
        stage: "Consumer / Dispensation",
        status: "PENDING",
        organisation: null,
        date: null,
      },
    ],
  },

  "MED-002": {
    productId: "09312345678902",
    code: "MED-002",
    medicineName: "HealthMed 20mg",
    manufacturer: "Health Labs",
    batch: "B2000",
    expiry: "2027-08",
    countryOfOrigin: "Australia",
    coverageStatus: "ENROLLED",
    cached: true,
    source: "MedAuth prototype registry",
    lastUpdated: "2026-08-10T08:00:00",
    pharmacy: "MedAuth Community Pharmacy",
    coarseRegion: "Adelaide SA",

    recall: {
      active: true,
      status: "Active Recall",
      recallDate: "2026-08-01",
      severity: "High",
      reason:
        "Prototype recall notice for registered batch B2000.",
    },

    supplyChain: [
      {
        id: "SC-002-1",
        stage: "Manufactured",
        status: "VERIFIED",
        organisation: "Health Labs",
        date: "2026-05-18",
      },
      {
        id: "SC-002-2",
        stage: "Quality Control",
        status: "VERIFIED",
        organisation: "Health Labs Quality Unit",
        date: "2026-05-20",
      },
      {
        id: "SC-002-3",
        stage: "Barcode Registered",
        status: "VERIFIED",
        organisation: "MedAuth Prototype Registry",
        date: "2026-05-21",
        detail: "09312345678902",
      },
      {
        id: "SC-002-4",
        stage: "Distributed",
        status: "VERIFIED",
        organisation: "Southern Health Distribution",
        date: "2026-05-26",
      },
      {
        id: "SC-002-5",
        stage: "At Pharmacy",
        status: "CURRENT",
        organisation: "MedAuth Community Pharmacy",
        date: "2026-05-30",
      },
      {
        id: "SC-002-6",
        stage: "Consumer / Dispensation",
        status: "PENDING",
        organisation: null,
        date: null,
      },
    ],
  },

  "MED-003": {
    productId: "09312345678903",
    code: "MED-003",
    medicineName: "TestMed 5mg",
    manufacturer: "Demo Pharma",
    batch: "B9912",
    expiry: "2028-02",
    countryOfOrigin: "Australia",
    coverageStatus: "NOT_COVERED",
    cached: false,
    source: "MedAuth prototype dataset",
    lastUpdated: "2026-08-10T08:00:00",
    pharmacy: null,
    coarseRegion: "Melbourne VIC",
    recall: null,
    supplyChain: null,
  },
};

export const demoEvents = [
  {
    id: "VE-0001",
    timestamp: "2026-08-11T10:20:00",
    code: "MED-001",
    productId: "09312345678901",
    medicine: "SampleMed 10mg",
    batch: "B1001",
    result: "MATCH",
    channel: "PHARMACIST",
    offline: false,
    pendingSync: false,
    region: "Adelaide SA",
    type: "verification",
  },
  {
    id: "VE-0002",
    timestamp: "2026-08-11T10:08:00",
    code: "MED-002",
    productId: "09312345678902",
    medicine: "HealthMed 20mg",
    batch: "B2045",
    result: "NO_MATCH",
    channel: "PHARMACIST",
    offline: false,
    pendingSync: false,
    region: "Adelaide SA",
    type: "verification",
  },
  {
    id: "VE-0003",
    timestamp: "2026-08-11T09:52:00",
    code: "MED-003",
    productId: "09312345678903",
    medicine: "TestMed 5mg",
    batch: "B9912",
    result: "NOT_COVERED",
    channel: "PHARMACIST",
    offline: false,
    pendingSync: false,
    region: "Melbourne VIC",
    type: "verification",
  },
];

export function findMedicine(identifier) {
  if (!identifier) {
    return null;
  }

  const normalized = identifier
    .trim()
    .toUpperCase();

  if (medicines[normalized]) {
    return medicines[normalized];
  }

  return (
    Object.values(medicines).find(
      (medicine) =>
        medicine.code?.toUpperCase() === normalized ||
        medicine.productId === normalized
    ) || null
  );
}

export function findMedicineByBatch(batch) {
  if (!batch) {
    return null;
  }

  const normalizedBatch = batch
    .trim()
    .toUpperCase();

  return (
    Object.values(medicines).find(
      (medicine) =>
        medicine.batch?.toUpperCase() ===
        normalizedBatch
    ) || null
  );
}

export function getActiveRecalls() {
  return Object.values(medicines)
    .filter(
      (medicine) =>
        medicine.recall?.active
    )
    .map((medicine) => ({
      id: `RECALL-${medicine.code}`,
      code: medicine.code,
      productId: medicine.productId,
      medicineName: medicine.medicineName,
      manufacturer: medicine.manufacturer,
      batch: medicine.batch,
      recallDate:
        medicine.recall.recallDate,
      severity:
        medicine.recall.severity,
      status:
        medicine.recall.status,
      reason:
        medicine.recall.reason,
    }));
}
