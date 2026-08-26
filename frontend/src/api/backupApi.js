export const triggerBrowserDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.style.display = "none";
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }, 100);
};

export const getFilenameFromHeader = (contentDisposition, fallbackFilename) => {
  if (!contentDisposition) return fallbackFilename;
  const match = contentDisposition.match(/filename=["']?([^"';]+)["']?/i);
  return match && match[1] ? match[1].trim() : fallbackFilename;
};

export const validateBackupFile = (file) => {
  if (!file) {
    return { valid: false, error: "Please select a backup file to upload." };
  }

  const isJsonExt = file.name.toLowerCase().endsWith(".json");
  const isJsonMime = file.type === "application/json" || file.type === "";

  if (!isJsonExt && !isJsonMime) {
    return {
      valid: false,
      error: "Invalid file type. Only JSON backup files (.json) are allowed.",
    };
  }

  if (file.size === 0) {
    return { valid: false, error: "Selected file is empty." };
  }

  return { valid: true };
};

export const downloadBackupApi = async () => {
  const res = await fetch("/api/backup/download", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    let errorMsg = "Failed to download backup";
    try {
      const errData = await res.json();
      errorMsg = errData.message || errData.error || errorMsg;
    } catch {
      // Ignore JSON parsing errors and use the default error message
    }
    throw new Error(errorMsg);
  }

  const contentDisposition = res.headers.get("content-disposition");
  const today = new Date().toISOString().split("T")[0];
  const defaultFilename = `tailor-backup-${today}.json`;
  const filename = getFilenameFromHeader(contentDisposition, defaultFilename);

  const blob = await res.blob();
  triggerBrowserDownload(blob, filename);

  return {
    success: true,
    filename,
  };
};

export const restoreBackupApi = async (file) => {
  const validation = validateBackupFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append("backupFile", file);

  const res = await fetch("/api/backup/restore", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to restore backup");
  }

  return data;
};

export default {
  downloadBackupApi,
  restoreBackupApi,
  validateBackupFile,
  triggerBrowserDownload,
};
