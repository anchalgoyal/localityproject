export const LOC_COLORS: Record<string, string> = {
  "surplus present": "#22c55e",
  "demand gap": "#ef4444",
  "conversion issue": "#eab308",
  "demand + conversion issue": "#f97316",
};

export const PROJ_COLORS: Record<string, string> = {
  surplus: "#22c55e",
  "demand gap": "#ef4444",
  "conversion issue": "#eab308",
  "demand + conversion issue": "#f97316",
  "data not present": "#64748b",
};

export const LOC_STATUS_LABELS: Record<string, string> = {
  "surplus present": "Surplus",
  "demand gap": "Demand Gap",
  "conversion issue": "Conversion Issue",
  "demand + conversion issue": "Demand + Conv. Issue",
};

export const PROJ_STATUS_LABELS: Record<string, string> = {
  surplus: "Surplus",
  "demand gap": "Demand Gap",
  "conversion issue": "Conversion Issue",
  "demand + conversion issue": "Demand + Conv. Issue",
  "data not present": "No Data",
};

export const ALL_LOCALITY_STATUSES = [
  "surplus present",
  "demand gap",
  "conversion issue",
  "demand + conversion issue",
];

export const ALL_PROJECT_STATUSES = [
  "surplus",
  "demand gap",
  "conversion issue",
  "demand + conversion issue",
  "data not present",
];
