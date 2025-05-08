"use client";

import type { FieldPath, FieldValues, Path } from "react-hook-form";

// Helper function to make type-safe paths from path strings
export function makeFieldPath<TFieldValues extends FieldValues>(
  path: string,
  suffix?: string,
): Path<TFieldValues> {
  // Using type assertion since we know the path will be valid
  return (suffix ? `${path}.${suffix}` : path) as Path<TFieldValues>;
}

// Helper function for use with dynamic paths in Controller
export function makeDynamicFieldPath<TFieldValues extends FieldValues>(
  path: string,
  suffix?: string,
): FieldPath<TFieldValues> {
  // Using type assertion to convert string path to FieldPath
  return (suffix ? `${path}.${suffix}` : path) as FieldPath<TFieldValues>;
}
