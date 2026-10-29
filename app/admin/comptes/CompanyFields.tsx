"use client";

import { useState } from "react";
import { SelectField, TextField } from "@/components/ui/form";
import { toSmsSenderName } from "@/lib/company/sms-sender";
import { REGION_LABELS, TRADE_LABELS, formatSiret } from "@/lib/company/details";
import type { CompanyValues } from "@/lib/admin/company-form";

const TRADE_OPTIONS = Object.entries(TRADE_LABELS).map(([value, label]) => ({ value, label }));
const REGION_OPTIONS = Object.entries(REGION_LABELS).map(([value, label]) => ({ value, label }));

export function CompanyFields({ defaults }: { defaults?: Partial<CompanyValues> }) {
  const [companyName, setCompanyName] = useState(defaults?.companyName ?? "");

  return (
    <>
      <TextField
        label="Nom de l'entreprise"
        name="companyName"
        required
        value={companyName}
        onChange={(event) => setCompanyName(event.target.value)}
        placeholder="Dupont Toiture"
      />
      <TextField
        label="Nom d'expéditeur SMS (optionnel)"
        name="smsSenderName"
        maxLength={11}
        defaultValue={defaults?.smsSenderName}
        placeholder={toSmsSenderName(companyName) || "DUPONTTOIT"}
        hint="11 caractères max. Laissez vide pour utiliser la suggestion."
      />
      <SelectField
        label="Métier (optionnel)"
        name="trade"
        options={TRADE_OPTIONS}
        placeholder="Choisir un métier"
        defaultValue={defaults?.trade}
      />
      <SelectField
        label="Région (optionnel)"
        name="region"
        options={REGION_OPTIONS}
        placeholder="Choisir une région"
        defaultValue={defaults?.region}
      />
      <TextField
        label="SIRET (optionnel)"
        name="siret"
        inputMode="numeric"
        autoComplete="off"
        defaultValue={defaults?.siret ? formatSiret(defaults.siret) : undefined}
        placeholder="123 456 789 00012"
        hint="14 chiffres, les espaces sont acceptés."
      />
    </>
  );
}
