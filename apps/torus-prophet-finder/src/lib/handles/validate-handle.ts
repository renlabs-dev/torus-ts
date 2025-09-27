import { z } from "zod";

// Core constraints for a handle (no @, just username)
const HANDLE_CORE_SCHEMA = z
  .string()
  .regex(/^[A-Za-z0-9_]{1,15}$/, {
    message: "Only letters, numbers, and _ are allowed (1–15 chars)",
  })
  .refine((h) => !/^_+$/.test(h), {
    message: "Username must include letters or numbers",
  });

// @username -> username
const AT_HANDLE_SCHEMA = z
  .string()
  .regex(/^@[A-Za-z0-9_]{1,15}$/, {
    message: 'Handle must be "@username" (1–15, letters/numbers/_)',
  })
  .transform((v) => v.slice(1))
  .pipe(HANDLE_CORE_SCHEMA);

// https://x.com/username or https://twitter.com/username (optional www/m/mobile and trailing slash)
const PROFILE_URL_RE =
  /^https?:\/\/(?:www\.|m\.|mobile\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/?$/;
const PROFILE_URL_SCHEMA = z
  .string()
  .regex(PROFILE_URL_RE, {
    message:
      "Enter a direct X/Twitter profile URL (e.g., https://x.com/username)",
  })
  .transform((v) => v.match(PROFILE_URL_RE)![1])
  .pipe(HANDLE_CORE_SCHEMA);

// Accept core, @handle, or profile URL; always output core username
export const HandleInputSchema = z.union([
  HANDLE_CORE_SCHEMA,
  AT_HANDLE_SCHEMA,
  PROFILE_URL_SCHEMA,
]);

function firstIssueMessage(err: z.ZodError): string {
  const issue = err.issues[0];
  if (issue?.code === "invalid_union") {
    const ue = (issue as unknown as { unionErrors?: z.ZodError[] }).unionErrors;
    const msg = ue?.[0]?.issues?.[0]?.message;
    if (msg) return msg;
  }
  return issue?.message ?? "Invalid handle";
}

export function validateHandleInput(input: string): {
  core: string | null;
  error?: string;
} {
  const parsed = HandleInputSchema.safeParse(input);
  if (!parsed.success) return { core: null, error: firstIssueMessage(parsed.error) };
  return { core: parsed.data };
}

// (legacy overload removed) – validateHandleInput is defined above using HandleInputSchema
