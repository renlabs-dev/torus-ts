import { z } from "zod";

const validateUrl = (domains: string[], errorMessage: string) => {
  return (val: string) => {
    if (val === "") return true;
    const prefixes = domains.map((domain) => `https://${domain}`);
    return prefixes.some((prefix) => val.startsWith(prefix))
      ? true
      : errorMessage;
  };
};

const updateAgentSocialsSchema = z.object({
  twitter: z
    .string()
    .trim()
    .refine(
      validateUrl(
        ["twitter.com/", "x.com/"],
        "Twitter URL must start with https://twitter.com/ or https://x.com/",
      ),
    )
    .optional()
    .or(z.literal("")),
  github: z
    .string()
    .trim()
    .refine(
      validateUrl(
        ["github.com/"],
        "GitHub URL must start with https://github.com/",
      ),
    )
    .optional()
    .or(z.literal("")),
  telegram: z
    .string()
    .trim()
    .refine(
      validateUrl(["t.me/"], "Telegram URL must start with https://t.me/"),
    )
    .optional()
    .or(z.literal("")),
  discord: z
    .string()
    .trim()
    .refine(
      validateUrl(
        ["discord.gg/", "discord.com/"],
        "Discord URL must start with https://discord.gg/ or https://discord.com/",
      ),
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