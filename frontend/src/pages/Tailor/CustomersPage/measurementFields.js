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

export const initialMeasurementState = ALL_FIELDS.reduce(
  (acc, f) => {
    acc[f] = "";
    return acc;
  },
  { remarks: "" },
);

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
  shalwarLength: "شلوار لمبائی",
  shalwarWaist: "شلوار کمر",
  shalwarHip: "شلوار کولہ",
  thigh: "ران",
  knee: "گھٹنا",
  bottom: "دھرا",
};

export const labelWithUrdu = (field) => {
  const english = field.replace(/([A-Z])/g, " $1");
  const urdu = URDU_LABELS[field] || "";
  return { english, urdu };
};
