import { Input } from "@torus-ts/ui";
import clsx from "clsx";
import type { FieldAttributes } from "formik";
import { Field } from "formik";
import type { ChangeEvent, InputHTMLAttributes, Ref } from "react";
import { forwardRef } from "react";

export function TextField({ className, ...props }: FieldAttributes<unknown>) {
  return <Field className={clsx(className)} {...props} />;
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
