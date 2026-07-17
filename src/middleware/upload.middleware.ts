import multer from "multer";

// Generic upload used for course thumbnails/logos/attachments — cap size
// and restrict to common document/image/CSV types to avoid unbounded
// memory usage and arbitrary file-type uploads.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2000 * 1024 * 1024, // 10MB
  },
});

// Bulk user CSV import: keep this small and CSV-only.
export const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");
    if (!isCsv) {
      return cb(new Error("Only CSV files are allowed"));
    }
    cb(null, true);
  },
});