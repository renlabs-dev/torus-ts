import {
  isValidNamespaceSegment,
  namespacePathParser,
} from "@torus-network/sdk/types";
import { z } from "zod";

export const HTTP_METHODS = [
  "get",
  "post",
  "patch",
  "delete",
  "put",
  "custom",
  "none",
] as const;

export const REGISTER_CAPABILITY_SCHEMA = z
  .object({
    path: z
      .string()
      .max(35, "Path must be 35 characters or less")
      .refine(
        (val) => {
          if (val === "") return true;
          const pathResult = namespacePathParser().safeParse(val);
          return pathResult.success;
        },
        {
          message: "Must be a valid capability path or empty",
        },
      ),
    method: z.enum([...HTTP_METHODS, "custom"]),
    customMethod: z
      .string()
      .max(35, "Custom method must be 35 characters or less")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.method === "custom") {
        if (!data.customMethod || data.customMethod.trim().length === 0) {
          return false;
        }
        return isValidNamespaceSegment(data.customMethod);
      }
      return true;
    },
    {
      message:
        "Custom method is required and must be a valid capability permission segment",
      path: ["customMethod"],
    },
  )
  .refine(
    (data) => {
      if (data.method === "none") {
        return data.path.trim().length > 0;
      }
      return true;
    },
    {
      message: "Path is required when no REST method is selected",
      path: ["path"],
    },
  );
