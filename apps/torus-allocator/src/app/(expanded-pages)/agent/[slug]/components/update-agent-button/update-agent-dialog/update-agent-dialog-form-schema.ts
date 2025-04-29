import { z } from "zod";

const validateUrl = (domains: string[], errorMessage: string) => {
  return (val: string) => {
    if (!val) return true;
    try {
      const url = new URL(val);
      return domains.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`))
        ? true
        : errorMessage;
    } catch {
      return errorMessage;
    }
  };
};

const updateAgentSocialsSchema = z.object({
  twitter: z
    .string()
    .trim()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const url = new URL(val);
          
          // Valid Twitter URL patterns:
          // https://twitter.com/*
          // https://x.com/*
          
          if (url.hostname === "twitter.com") return true;
          if (url.hostname === "x.com") return true;
          
          return "Twitter URL must be https://twitter.com/* or https://x.com/*";
        } catch {
          return "Twitter URL must be https://twitter.com/* or https://x.com/*";
        }
      },
    )
    .optional()
    .or(z.literal("")),
  github: z
    .string()
    .trim()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const url = new URL(val);
          
          // Valid GitHub URL pattern:
          // https://github.com/*
          
          if (url.hostname === "github.com") return true;
          
          return "GitHub URL must be https://github.com/*";
        } catch {
          return "GitHub URL must be https://github.com/*";
        }
      },
    )
    .optional()
    .or(z.literal("")),
  telegram: z
    .string()
    .trim()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const url = new URL(val);
          
          // Valid Telegram URL pattern:
          // https://t.me/*
          
          if (url.hostname === "t.me") return true;
          
          return "Telegram URL must be https://t.me/*";
        } catch {
          return "Telegram URL must be https://t.me/*";
        }
      },
    )
    .optional()
    .or(z.literal("")),
  discord: z
    .string()
    .trim()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const url = new URL(val);
          
          // Valid Discord URL patterns:
          // https://discord.gg/*
          // https://discord.com/invite/*
          
          if (url.hostname === "discord.gg") return true;
          if (url.hostname === "discord.com" && url.pathname.startsWith("/invite/")) return true;
          
          return "Discord URL must be https://discord.gg/* or https://discord.com/invite/*";
        } catch {
          return "Discord URL must be https://discord.gg/* or https://discord.com/invite/*";
        }
      },
    )
    .optional()
    .or(z.literal("")),
});

export const updateAgentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(50, "Name cannot exceed 50 characters"),
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
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(5000, "Description cannot exceed 5000 characters"),
  website: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  apiUrl: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  imageUrl: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
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
  handleImageChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
