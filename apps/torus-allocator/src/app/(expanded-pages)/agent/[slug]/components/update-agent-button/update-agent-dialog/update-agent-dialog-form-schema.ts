import { z } from "zod";

const validateUrl = (domains: string[]) => (val: string) => {
  if (!val) return true;
  try {
    const { hostname, pathname } = new URL(val);
    return (
      domains.some((d) => hostname === d || hostname.startsWith(`${d}.`)) &&
      pathname.length > 1
    );
  } catch {
    return false;
  }
};

export const updateAgentSocialsSchema = z.object({
  twitter: z
    .string()
    .trim()
    .refine(validateUrl(["twitter.com", "x.com"]), {
      message: "Twitter URL must be https://twitter.com/* or https://x.com/*",
    })
    .optional(),
  github: z
    .string()
    .trim()
    .refine(validateUrl(["github.com"]), {
      message: "GitHub URL must be https://github.com/*",
    })
    .optional(),
  telegram: z
    .string()
    .trim()
    .refine(validateUrl(["t.me"]), {
      message: "Telegram URL must be https://t.me/*",
    })
    .optional(),
  discord: z
    .string()
    .trim()
    .refine(validateUrl(["discord.com"]), {
      message: "Discord URL must be https://discord.com/*",
    })
    .optional(),
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
  imageUrl: z
    .string()
    .trim()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: "Must be a valid URL",
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
  handleImageChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
