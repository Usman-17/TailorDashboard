export const KAMEEZ_FIELDS = [
  "length",
  "shoulder",
  "chest",
  "waist",
  "ghera",
  "neck",
  "collar",
  "ban",
  "armHole",
  "bicep",
  "cuff",
];

export const SHALWAR_FIELDS = [
  "shalwarLength",
  "shalwarWaist",
  "shalwarHip",
  "shalwarGhera",
  "aasan",
  "thigh",
  "knee",
  "bottom",
];

export const TROUSER_FIELDS = [
  "trouserLength",
  "trouserWaist",
  "trouserHip",
  "trouserGhera",
  "trouserAasan",
  "trouserThigh",
  "trouserKnee",
  "trouserBottom",
];

export const ALL_FIELDS = [
  ...KAMEEZ_FIELDS,
  ...SHALWAR_FIELDS,
  ...TROUSER_FIELDS,
];

export const LOWER_TYPES = [
  { value: "shalwar", label: "Shalwar" },
  { value: "trouser", label: "Trouser" },
];

export const initialMeasurementState = {
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
  ghera: "گھیرا",
  hip: "کولہ",
  neck: "گردن",
  collar: "کالر",
  ban: "بین",
  sleeveLength: "آستین",
  armHole: "بازو کا سوراخ",
  bicep: "بازو",
  cuff: "کف",
  shalwarLength: "لمبائی",
  shalwarWaist: "کمر",
  shalwarHip: "کولہ",
  shalwarGhera: "گھیرا",
  aasan: "آسن",
  thigh: "ران",
  knee: "گھٹنا",
  bottom: "پانچہ",
  trouserLength: "لمبائی",
  trouserWaist: "کمر",
  trouserHip: "کولہ",
  trouserGhera: "گھیرا",
  trouserAasan: "آسن",
  trouserThigh: "ران",
  trouserKnee: "گھٹنا",
  trouserBottom: "دھرا",
};

const LOWER_LABELS = {
  shalwarLength: "Length",
  shalwarWaist: "Waist",
  shalwarHip: "Hip",
  trouserLength: "Length",
  trouserWaist: "Waist",
  trouserHip: "Hip",
};

const SHALWAR_LABELS = {
  thigh: "Thigh",
  knee: "Knee",
  bottom: "Pancha",
};

const TROUSER_LABELS = {
  trouserThigh: "Thigh",
  trouserKnee: "Knee",
  trouserBottom: "Pancha",
};

export const labelWithUrdu = (field, lowerType = "shalwar") => {
  const isLowerField = [...SHALWAR_FIELDS, ...TROUSER_FIELDS].includes(field);

  let english;
  if (isLowerField) {
    if (lowerType === "trouser") {
      english =
        TROUSER_LABELS[field] ||
        LOWER_LABELS[field] ||
        field.replace(/([A-Z])/g, " $1");
    } else {
      english =
        SHALWAR_LABELS[field] ||
        LOWER_LABELS[field] ||
        field.replace(/([A-Z])/g, " $1");
    }
  } else {
    english = field.replace(/([A-Z])/g, " $1");
  }

  const urdu = URDU_LABELS[field] || "";
  return { english, urdu };
};

export const lowerFieldTitle = (field) => {
  const map = {
    shalwarLength: "Length",
    shalwarWaist: "Waist",
    shalwarHip: "Hip",
    shalwarGhera: "Ghera",
    aasan: "Aasan",
    thigh: "Thigh",
    knee: "Knee",
    bottom: "Pancha",
    trouserLength: "Length",
    trouserWaist: "Waist",
    trouserHip: "Hip",
    trouserGhera: "Ghera",
    trouserAasan: "Aasan",
    trouserThigh: "Thigh",
    trouserKnee: "Knee",
    trouserBottom: "Pancha",
  };
  return map[field] || field.replace(/([A-Z])/g, " $1");
};
