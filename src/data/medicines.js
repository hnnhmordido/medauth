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
    lastUpdated: "2026-08-10T08:00:00",
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
    lastUpdated: "2026-08-10T08:00:00",
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
    lastUpdated: "2026-08-10T08:00:00",
  },
};

export const demoEvents = [
  { id: "VE-0001", code: "MED-001", batch: "B1001", result: "MATCH", region: "Adelaide SA" },
  { id: "VE-0002", code: "MED-002", batch: "B2045", result: "NO_MATCH", region: "Adelaide SA" },
  { id: "VE-0003", code: "MED-003", batch: "B9912", result: "NOT_COVERED", region: "Melbourne VIC" },
];
