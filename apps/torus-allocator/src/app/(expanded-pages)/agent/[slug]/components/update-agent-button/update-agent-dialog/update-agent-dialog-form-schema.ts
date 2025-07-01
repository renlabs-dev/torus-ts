import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";

const validateUrl = (domains: string[]) => (val: string) => {
  if (!val) return true;

  return new RegExp(
    `^(https?:\\/\\/)(${domains
      .map((d) => `(?:${d.replace(".", "\\.")})`)
      .join("|")})\\/.+$`,
  ).test(val);
};

const ensureHttpsProtocol = (val: string | undefined): string => {
  if (!val) return "";

  const cleanedVal = val.trim().replace(/^\/+|\/+$/g, "");

  if (cleanedVal.startsWith("http://")) {
    return cleanedVal.replace("http://", "https://");
  }

  if (cleanedVal.startsWith("https://")) {
    return cleanedVal;
  }

  return `https://${cleanedVal}`;
};

export const MAX_FILE_SIZE = 512000; // 512KB
export const ACCEPTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

export const updateAgentSocialsSchema = z.object({
  twitter: z
    .string()
    .trim()
    .optional()
    .transform(ensureHttpsProtocol)
    .refine(validateUrl(["twitter.com", "x.com"]), {
      message: "Twitter URL must be https://twitter.com/* or https://x.com/*",
    }),
  github: z
    .string()
    .trim()
    .optional()
    .transform(ensureHttpsProtocol)
    .refine(validateUrl(["github.com"]), {
      message: "GitHub URL must be https://github.com/*",
    }),
  telegram: z
    .string()
    .trim()
    .optional()
    .transform(ensureHttpsProtocol)
    .refine(validateUrl(["t.me"]), {
      message: "Telegram URL must be https://t.me/*",
    }),
  discord: z
    .string()
    .trim()
    .optional()
    .transform(ensureHttpsProtocol)
    .refine(validateUrl(["discord.gg"]), {
      message: "Discord URL must be https://discord.gg/*",
    }),
});

export const updateAgentSchema = z.object({
  name: z
    .string()
    .trim()
    .optional()
    .describe("Agent name (immutable, cannot be changed)"),
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),
  shortDescription: z
    .string()
    .trim()
    .min(1, "Short description is required")
    .max(200, "Short description cannot exceed 200 characters"),
  description: z.string().trim().min(1, "Description is required"),
  website: z
    .string()
    .trim()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: "Must be a valid URL",
    })
    .optional(),
  apiUrl: z
    .string()
    .trim()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: "Must be a valid URL",
    })
    .optional(),
  imageFile: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `File size must be less than ${(MAX_FILE_SIZE / 1000).toFixed(0)}KB`,
    })
    .refine((file) => ACCEPTED_FILE_TYPES.includes(file.type), {
      message: "File must be PNG, JPEG, GIF, or WebP format",
    })
    .optional(),
  socials: updateAgentSocialsSchema,
});

export const updateAgentError = {
  AgentDoesNotExist: "Agent does not exist",
};

export type UpdateAgentFormData = z.infer<typeof updateAgentSchema>;

export interface AgentType {
  name?: string | null;
  apiUrl?: string | null;
}

export interface MetadataType {
  title?: string;
  short_description?: string;
  description?: string;
  website?: string;
  socials?: Record<string, string>;
  image_url?: string;
}

export interface UpdateAgentMutation {
  isPending: boolean;
  mutate: (data: UpdateAgentFormData) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export type UpdateAgentForm = UseFormReturn<UpdateAgentFormData>;
