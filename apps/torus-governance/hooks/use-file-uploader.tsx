"use client";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { useState } from "react";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { BasicLogger } from "@torus-network/torus-utils/logger";

// Create a dedicated logger for file upload operations
const log = new BasicLogger({ name: "file-uploader-torus-governance" });

interface FileUploadOptions {
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
  onUploadError?: (error: Error) => void;
  errorMessage?: string;
  setTransactionStatus?: (status: TransactionResult) => void;
}

interface UploadResult {
  success: boolean;
  cid?: string;
  error?: Error;
}

export function useFileUploader() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (
    file: File,
    options: FileUploadOptions = {},
  ): Promise<UploadResult> => {
    const {
      onUploadStart,
      onUploadComplete,
      onUploadError,
      errorMessage = "Error uploading file",
      setTransactionStatus,
    } = options;

    // Log the start of the upload with file details
    log.info(
      `Starting file upload: ${file.name} (${file.size} bytes, ${file.type})`,
    );

    // Signal start of upload
    setUploading(true);
    onUploadStart?.();

    // Create form data
    const data = new FormData();
    data.set("file", file);

    // Upload file
    const [fetchError, res] = await tryAsync(
      fetch("/api/files", {
        method: "POST",
        body: data,
      }),
    );

    if (fetchError !== undefined) {
      // Log the fetch error with details
      log.error(`File upload fetch error: ${fetchError.message}`, fetchError);

      setUploading(false);
      toast.error(fetchError.message || errorMessage);

      if (setTransactionStatus) {
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: "Error uploading file",
        });
      }

      onUploadError?.(fetchError);
      onUploadComplete?.();
      return { success: false, error: fetchError };
    }

    // Check HTTP status
    if (!res.ok) {
      const statusError = new Error(
        `HTTP Error: ${res.status} ${res.statusText}`,
      );

      log.error(`File upload HTTP error: ${res.status} ${res.statusText}`);

      setUploading(false);
      toast.error(`Server error: ${res.status}`);

      if (setTransactionStatus) {
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: `HTTP Error: ${res.status}`,
        });
      }

      onUploadError?.(statusError);
      onUploadComplete?.();
      return { success: false, error: statusError };
    }

    // Parse response
    const [jsonError, responseData] = await tryAsync<{ cid: string }>(
      res.json(),
    );

    // Signal end of upload
    setUploading(false);
    onUploadComplete?.();

    if (jsonError !== undefined) {
      log.error(
        `File upload JSON parsing error: ${jsonError.message}`,
        jsonError,
      );

      toast.error("Error parsing response data");

      if (setTransactionStatus) {
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: "Error parsing response",
        });
      }

      onUploadError?.(jsonError);
      return { success: false, error: jsonError };
    }

    // Validate CID
    if (!responseData.cid || responseData.cid === "undefined") {
      const error = new Error("Invalid CID received");

      log.error("File upload invalid CID received", responseData);

      toast.error("Error uploading file");

      if (setTransactionStatus) {
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: "Failed to get valid file CID",
        });
      }

      onUploadError?.(error);
      return { success: false, error };
    }

    // Log successful upload
    log.info(`File upload successful: ${file.name}, CID: ${responseData.cid}`);

    return { success: true, cid: responseData.cid };
  };

  return { uploadFile, uploading };
}
