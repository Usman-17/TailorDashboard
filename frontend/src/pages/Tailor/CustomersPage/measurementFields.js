export const KAMEEZ_FIELDS = [
  "length",
  "shoulder",
  "chest",
  "waist",
  "hip",
  "neck",
  "sleeveLength",
  "armHole",
  "bicep",
  "cuff",
];

export const SHALWAR_FIELDS = [
  "shalwarLength",
  "shalwarWaist",
  "shalwarHip",
  "thigh",
  "knee",
  "bottom",
];

export const ALL_FIELDS = [...KAMEEZ_FIELDS, ...SHALWAR_FIELDS];

export const LOWER_TYPES = [
  { value: "shalwar", label: "Shalwar" },
  { value: "trouser", label: "Trouser" },
];

export const initialMeasurementState = {
  lowerType: "shalwar",
  ...ALL_FIELDS.reduce((acc, f) => {
    acc[f] = "";
    return acc;
  }, {}),
  remarks: "",
};

export const URDU_LABELS = {
  length: "لمبائی",
  shoulder: "تیرا",
  chest: "سینہ",
  waist: "کمر",
  hip: "کولہ",
  neck: "گردن",
  sleeveLength: "آستین",
  armHole: "بازو کا سوراخ",
  bicep: "بازو",
  cuff: "کف",
  shalwarLength: "لمبائی",
  shalwarWaist: "کمر",
  shalwarHip: "کولہ",
  thigh: "ران",
  knee: "گھٹنا",
  bottom: "دھرا",
};

const TROUSER_LABELS = {
  shalwarLength: "Length",
  shalwarWaist: "Waist",
  shalwarHip: "Hip",
};

const SHALWAR_LABELS = {
  shalwarLength: "Length",
  shalwarWaist: "Waist",
  shalwarHip: "Hip",
};

export const labelWithUrdu = (field, lowerType = "shalwar") => {
  const isLowerField = SHALWAR_FIELDS.includes(field);

  let english;
  if (isLowerField && lowerType === "trouser") {
    english = TROUSER_LABELS[field] || field.replace(/([A-Z])/g, " $1");
  } else if (isLowerField) {
    english = SHALWAR_LABELS[field] || field.replace(/([A-Z])/g, " $1");
  } else {
    english = field.replace(/([A-Z])/g, " $1");
  }

  const urdu = URDU_LABELS[field] || "";
  return { english, urdu };
};
