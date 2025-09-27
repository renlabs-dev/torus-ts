"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@torus-ts/ui/components/button";
import { TickerSymbolSchema } from "~/lib/tickers/validate-symbol";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface Props {
  onAdd: (raw: string) => string | null; // returns error or null
  suppressErrorMessage?: (msg: string) => boolean;
}

const FormSchema = z.object({
  symbol: TickerSymbolSchema,
});
type FormValues = z.infer<typeof FormSchema>;

export default function AddTickerForm({ onAdd, suppressErrorMessage }: Props) {
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
    defaultValues: { symbol: "" },
  });

  const onSubmit = React.useCallback(
    (values: FormValues) => {
      setServerError(null);
      const err = onAdd(values.symbol);
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
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setAdding((s) => {
            const next = !s;
            if (next) {
              setTimeout(() => setFocus("symbol"), 0);
            } else {
              reset();
              setServerError(null);
            }
            return next;
          });
        }}
        aria-expanded={adding}
        aria-controls="add-ticker-form"
      >
        + Add Ticker
      </Button>

      {adding && (
        <form
          id="add-ticker-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="min-w-[220px] flex-1">
            <label htmlFor="ticker-symbol" className="sr-only">
              Ticker symbol (e.g., $BTC)
            </label>
            <input
              id="ticker-symbol"
              type="text"
              placeholder="Add ticker symbol (e.g., $BTC)"
              className="w-full rounded-none border border-white/15 bg-[#090e15] px-4 py-2.5 text-sm text-white placeholder-white/50 shadow-[0_0_24px_rgba(255,255,255,0.04)] outline-none focus:border-white/35 focus:ring-0"
              aria-invalid={errors.symbol ? "true" : "false"}
              {...register("symbol")}
            />
            {errors.symbol?.message && (
              <p className="mt-1 text-xs text-red-300/90">
                {errors.symbol.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="outline" disabled={isSubmitting}>
              Add
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAdding(false);
                reset();
                setServerError(null);
              }}
            >
              Cancel
            </Button>
          </div>
          {serverError && !suppressErrorMessage?.(serverError) && (
            <p className="w-full text-xs text-red-300/90">{serverError}</p>
          )}
        </form>
      )}
    </div>
  );
}
