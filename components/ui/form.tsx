"use client";

import { useFormStatus } from "react-dom";

type TextFieldProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "name">;

export function TextField({ label, name, type = "text", hint, ...inputProps }: TextFieldProps) {
  const hintId = hint ? `${name}-hint` : undefined;

  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-base font-semibold text-stone-800">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        aria-describedby={hintId}
        className="block min-h-14 w-full rounded-2xl border-2 border-stone-200 bg-white px-4 text-lg text-stone-900 outline-none placeholder:text-stone-400 focus:border-orange-500"
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="mt-2 text-sm text-stone-500">
          {hint}
        </p>
      )}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-base font-medium text-red-700">
      {message}
    </p>
  );
}

export function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-600 px-7 text-lg font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
