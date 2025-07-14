import { useState } from "react";

import { FolderUp } from "lucide-react";
import Image from "next/image";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { DropzoneState } from "shadcn-dropzone";
import Dropzone from "shadcn-dropzone";

import { smallFilename } from "@torus-network/torus-utils/files";
import type { CID } from "@torus-network/torus-utils/ipfs";
import { cidToIpfsUri } from "@torus-network/torus-utils/ipfs";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { useToast } from "@torus-ts/ui/hooks/use-toast";

import type { RegisterAgentFormData } from "./register-agent-schema";
import { pinFile } from "./register-agent-utils";

interface RegisterAgentIconFieldProps {
  control: Control<RegisterAgentFormData>;
  onIconPinned?: (cid: CID) => void;
}

export function RegisterAgentIconField({
  control,
  onIconPinned,
}: RegisterAgentIconFieldProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [pinnedCid, setPinnedCid] = useState<CID | null>(null);

  const handleFileDrop = async (file: File) => {
    setUploading(true);
    
    const [error, result] = await tryAsync(pinFile(file));
    
    if (error !== undefined) {
      setUploading(false);
      toast.error(error.message || "Error uploading icon");
      return null;
    }
    
    setUploading(false);
    setPinnedCid(result.cid);
    onIconPinned?.(result.cid);
    
    return file;
  };

  return (
    <FormField
      control={control}
      name="icon"
      render={({ field: controllerField }) => (
        <FormItem className="relative">
          <FormControl>
            <Controller
              control={control}
              name="icon"
              render={({ field }) => (
                <Dropzone
                  containerClassName="flex h-20 w-full bg-dark cursor-pointer flex-col items-center rounded-md justify-center gap-2 border-none px-4"
                  dropZoneClassName="border-none"
                  onFileDialogOpen={() => {
                    field.onChange(undefined);
                    setPinnedCid(null);
                  }}
                  onDrop={async (acceptedFiles) => {
                    if (acceptedFiles[0]) {
                      const file = await handleFileDrop(acceptedFiles[0]);
                      if (file) {
                        field.onChange(file);
                      }
                    }
                  }}
                  multiple={false}
                  disabled={uploading}
                  maxSize={512000}
                  maxFiles={1}
                  accept={{
                    "image/png": [".png"],
                    "image/jpeg": [".jpg", ".jpeg"],
                    "image/gif": [".gif"],
                    "image/webp": [".webp"],
                  }}
                >
                  {(dropzone: DropzoneState) => (
                    <div className="px-12">
                      {dropzone.isDragAccept && (
                        <div className="text-sm font-medium">
                          Drop your file here!
                        </div>
                      )}
                      {!controllerField.value &&
                        !dropzone.isDragAccept &&
                        dropzone.fileRejections.length === 0 && (
                          <div className="flex flex-col items-center gap-1 text-sm font-medium">
                            <span className="flex gap-2 text-nowrap">
                              <FolderUp className="h-4 w-4" />
                              Upload Agent Icon
                            </span>
                            <span className="text-center text-gray-400">
                              Square Image (Max 512x512)
                            </span>
                          </div>
                        )}
                      {controllerField.value &&
                        dropzone.fileRejections.length === 0 && (
                          <div className="flex flex-col items-center gap-1 text-sm font-medium">
                            <span className="flex gap-2 text-nowrap">
                              <FolderUp className="h-4 w-4" />
                              Click to change Icon
                            </span>
                            <span className="text-xs font-medium">
                              {smallFilename(controllerField.value.name)}
                            </span>
                            <span className="text-xs font-medium">
                              {(controllerField.value.size / 1000).toFixed(1)}{" "}
                              KB
                            </span>
                            {pinnedCid && (
                              <span className="text-xs font-medium text-green-500">
                                ✓ Uploaded to IPFS
                              </span>
                            )}
                            {uploading && (
                              <span className="text-xs font-medium text-yellow-500">
                                Uploading...
                              </span>
                            )}
                            <Image
                              className="absolute inset-0 h-full w-full object-cover opacity-20"
                              src={URL.createObjectURL(controllerField.value)}
                              alt={controllerField.value.name}
                              width={100}
                              height={100}
                            />
                          </div>
                        )}
                      {dropzone.fileRejections.map((fileRej, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col items-center gap-1 text-sm font-medium"
                        >
                          <span className="flex gap-1.5 text-nowrap">
                            Rejected file: {smallFilename(fileRej.file.name)}
                          </span>
                          {fileRej.errors.map((err, idx) => (
                            <span
                              key={idx}
                              className="text-xs font-medium text-red-500"
                            >
                              {err.message}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </Dropzone>
              )}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Export a utility function to get the icon IPFS URI
export function getIconIpfsUri(cid: CID | null): string | undefined {
  return cid ? cidToIpfsUri(cid) : undefined;
}