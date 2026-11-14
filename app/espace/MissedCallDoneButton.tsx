"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckIcon } from "@/components/landing/icons";
import { markMissedCallsDone } from "./demandes/[id]/actions";

// The artisan called back (or it was nothing): the call leaves the list.
export function MissedCallDoneButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await markMissedCallsDone(requestId);
            if (result.error) setError(result.error);
            else router.refresh();
          })
        }
        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-base font-semibold text-stone-800 ring-2 ring-stone-200 hover:ring-stone-400 disabled:opacity-60"
      >
        <CheckIcon className="size-5 text-emerald-600" />
        {isPending ? "…" : "C'est fait"}
      </button>
      {error && (
        <p role="alert" className="col-span-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </>
  );
}
