"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { FormError, TextField } from "@/components/ui/form";
import { startTestCall } from "./actions";

const CHECK_EVERY_MS = 4000;
const CHECK_FOR_MS = 120_000;

// One tap: Batrelio calls, the artisan lets it ring, the guide ticks itself once the call comes back.
export function TestCallPanel({ defaultPhone }: { defaultPhone: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState(defaultPhone);
  const [error, setError] = useState<string>();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [isStarting, startStarting] = useTransition();

  // While waiting, re-reads the guide: the step turns green as soon as the call arrives.
  useEffect(() => {
    if (startedAt === null) return;
    const timer = window.setInterval(() => {
      if (Date.now() - startedAt > CHECK_FOR_MS) {
        window.clearInterval(timer);
        setStartedAt(null);
        setError("Aucun appel n'est revenu. Vérifiez le code de renvoi (étape 3), puis relancez l'essai.");
        return;
      }
      router.refresh();
    }, CHECK_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [startedAt, router]);

  function launch() {
    setError(undefined);
    startStarting(async () => {
      const result = await startTestCall(phone);
      if ("error" in result) return setError(result.error);
      setStartedAt(Date.now());
    });
  }

  if (startedAt !== null) {
    return (
      <div role="status" className="space-y-2 rounded-2xl bg-orange-50 p-4 text-orange-950">
        <p className="text-lg font-bold">📞 Votre téléphone va sonner : ne décrochez pas.</p>
        <p className="text-base">Laissez sonner jusqu&apos;au bout. Cette étape se cochera toute seule dans une trentaine de secondes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <TextField
        label="Le numéro que vos clients appellent"
        name="testPhone"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="06 12 34 56 78"
      />
      <FormError message={error} />
      <button
        type="button"
        onClick={launch}
        disabled={isStarting}
        className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-600 px-5 text-lg font-semibold text-white hover:bg-orange-700 disabled:opacity-70"
      >
        {isStarting ? "Appel en cours…" : "Lancer l'essai"}
      </button>
    </div>
  );
}
