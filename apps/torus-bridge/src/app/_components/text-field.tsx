import { Input } from "@torus-ts/ui/components/input";
import type { FieldAttributes } from "formik";
import { Field } from "formik";
import type { ChangeEvent, InputHTMLAttributes, Ref } from "react";
import { forwardRef } from "react";

export function TextField({ ...props }: FieldAttributes<unknown>) {
  return (
    <Field
      {...props}
      className="rounded-radius border-border bg-dark w-full border p-[0.3em] pl-2"
    />
  );
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  onChange: (v: string) => void;
};

export const TextInput = forwardRef(function _TextInput(
  { onChange, ...props }: InputProps,
  ref: Ref<HTMLInputElement>,
) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value || "");
  };
  return (
    <Input
      ref={ref}
      type="text"
      autoComplete="off"
      onChange={handleChange}
      {...props}
    />
  );
});
