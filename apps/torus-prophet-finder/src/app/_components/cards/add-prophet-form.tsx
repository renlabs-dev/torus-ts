"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { HandleInputSchema } from "~/lib/handles/validate-handle";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface Props {
  onAdd: (rawHandle: string) => string | null; // returns error or null
  suppressErrorMessage?: (msg: string) => boolean;
}

const FormSchema = z.object({
  handle: HandleInputSchema, // accepts @handle, URL, or core; outputs core
});
type FormValues = z.infer<typeof FormSchema>;

export default function AddProphetForm({ onAdd, suppressErrorMessage }: Props) {
  const [adding, setAdding] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setFocus,
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { handle: "" },
  });

  const onSubmit = React.useCallback(
    (values: FormValues) => {
      setServerError(null);
      // values.handle is the normalized core username per HandleInputSchema
      const err = onAdd(values.handle);
      if (err) {
        setServerError(err);
        return;
      }
      setAdding(false);
      reset();
    },
    [onAdd, reset],
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => {
          setAdding((s) => {
            const next = !s;
            if (next) {
              // focus input when opening
              setTimeout(() => setFocus("handle"), 0);
            } else {
              reset();
              setServerError(null);
            }
            return next;
          });
        }}
        className="inline-flex items-center justify-center rounded-none border border-white/15 bg-[#090e15] px-3.5 py-2.5 text-sm text-white/90 shadow-[0_0_18px_rgba(255,255,255,0.05)] transition-colors hover:border-white/25 hover:bg-[#0b111b] hover:shadow-[0_0_28px_rgba(255,255,255,0.09)]"
        aria-expanded={adding}
        aria-controls="add-prophet-form"
      >
        + Add Prophet
      </button>

      {adding && (
        <form
          id="add-prophet-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="min-w-[220px] flex-1">
            <label htmlFor="prophet-handle" className="sr-only">
              X/Twitter @username
            </label>
            <input
              id="prophet-handle"
              type="text"
              placeholder="Add X/Twitter @username or URL"
              className="w-full rounded-none border border-white/15 bg-[#090e15] px-4 py-2.5 text-sm text-white placeholder-white/50 shadow-[0_0_24px_rgba(255,255,255,0.04)] outline-none focus:border-white/35 focus:ring-0"
              aria-invalid={errors.handle ? "true" : "false"}
              {...register("handle")}
            />
            {errors.handle?.message && (
              <p className="mt-1 text-xs text-red-300/90">
                {errors.handle.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-none border border-white/15 bg-[#090e15] px-3.5 py-2.5 text-sm text-white shadow-[0_0_18px_rgba(255,255,255,0.05)] transition-colors hover:border-white/25 hover:bg-[#0b111b] hover:shadow-[0_0_28px_rgba(255,255,255,0.09)] disabled:opacity-60"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                reset();
                setServerError(null);
              }}
              className="inline-flex items-center justify-center rounded-none border border-white/15 bg-[#090e15] px-3.5 py-2.5 text-sm text-white/80 transition-colors hover:border-white/25 hover:bg-[#0b111b]"
            >
              Cancel
            </button>
          </div>
          {serverError && !suppressErrorMessage?.(serverError) && (
            <p className="w-full text-xs text-red-300/90">{serverError}</p>
          )}
        </form>
      )}
    </div>
  );
}
