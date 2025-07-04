import { Input } from "@torus-ts/ui/components/input";
import { useTransferFormContext } from "~/app/_components/transfer-token/_components/transfer-form-context";
import type { ChangeEvent, InputHTMLAttributes, Ref } from "react";
import { forwardRef } from "react";
import type { TransferFormValues } from "~/utils/types";

export function TextField({
  name,
  ...props
}: {
  name: keyof TransferFormValues;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name">) {
  const { register } = useTransferFormContext();

  return (
    <input
      {...register(name)}
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
