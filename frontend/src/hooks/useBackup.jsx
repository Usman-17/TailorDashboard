import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  downloadBackupApi,
  restoreBackupApi,
  validateBackupFile,
} from "../api/backupApi";
// Imports End----

export const useDownloadBackup = (options = {}) => {
  return useMutation({
    mutationFn: downloadBackupApi,
    onSuccess: (data) => {
      toast.success(`Backup downloaded successfully: ${data.filename}`);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to download backup");
      options.onError?.(error);
    },
  });
};

export const useRestoreBackup = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file }) => restoreBackupApi(file),
    onSuccess: (data) => {
      toast.success(data.message || "Backup restored successfully!");

      queryClient.refetchQueries({ type: "active" });

      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to restore backup file");
      options.onError?.(error);
    },
  });
};

export const useBackup = (options = {}) => {
  const downloadMutation = useDownloadBackup(options.downloadOptions);
  const restoreMutation = useRestoreBackup(options.restoreOptions);

  return {
    downloadBackup: downloadMutation.mutate,
    downloadBackupAsync: downloadMutation.mutateAsync,
    isDownloading: downloadMutation.isPending,

    restoreBackup: restoreMutation.mutate,
    restoreBackupAsync: restoreMutation.mutateAsync,
    isRestoring: restoreMutation.isPending,

    validateBackupFile,
    downloadMutation,
    restoreMutation,
  };
};

export default useBackup;
