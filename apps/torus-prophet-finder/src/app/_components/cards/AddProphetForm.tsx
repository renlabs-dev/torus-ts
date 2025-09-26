"use client";

import * as React from "react";

interface Props {
  onAdd: (rawHandle: string) => string | null; // returns error or null
  suppressErrorMessage?: (msg: string) => boolean;
}

export default function AddProphetForm({ onAdd, suppressErrorMessage }: Props) {
  const [adding, setAdding] = React.useState(false);
  const [newHandle, setNewHandle] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = onAdd(newHandle);
    if (err) {
      setError(err);
      return;
    }
    setAdding(false);
    setNewHandle("");
    setError(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => {
          setAdding((s) => !s);
          setError(null);
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
          onSubmit={onSubmit}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="min-w-[220px] flex-1">
            <label htmlFor="prophet-handle" className="sr-only">
              X/Twitter @username
            </label>
            <input
              id="prophet-handle"
              type="text"
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              placeholder="Add X/Twitter @username or URL"
              className="w-full rounded-none border border-white/15 bg-[#090e15] px-4 py-2.5 text-sm text-white placeholder-white/50 shadow-[0_0_24px_rgba(255,255,255,0.04)] outline-none focus:border-white/35 focus:ring-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-none border border-white/15 bg-[#090e15] px-3.5 py-2.5 text-sm text-white shadow-[0_0_18px_rgba(255,255,255,0.05)] transition-colors hover:border-white/25 hover:bg-[#0b111b] hover:shadow-[0_0_28px_rgba(255,255,255,0.09)]"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewHandle("");
                setError(null);
              }}
              className="inline-flex items-center justify-center rounded-none border border-white/15 bg-[#090e15] px-3.5 py-2.5 text-sm text-white/80 transition-colors hover:border-white/25 hover:bg-[#0b111b]"
            >
              Cancel
            </button>
          </div>
          {error && !suppressErrorMessage?.(error) && (
            <p className="w-full text-xs text-red-300/90">{error}</p>
          )}
        </form>
      )}
    </div>
  );
}
