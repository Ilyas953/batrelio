"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { FormError, SelectField, TextField } from "@/components/ui/form";
import { REGION_LABELS, TRADE_LABELS, normalizeSiret } from "@/lib/company/details";
import { LEGAL_FORM_LABELS, hasShareCapital, isLegalForm, toVatNumber } from "@/lib/company/legal";
import { readProfileValues, type ProfileValues } from "@/lib/company/profile-form";
import { lookupSiret, saveCompanyProfile, type SiretLookupResult } from "./actions";

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const LEGAL_FORM_OPTIONS = toOptions(LEGAL_FORM_LABELS);
const TRADE_OPTIONS = toOptions(TRADE_LABELS);
const REGION_OPTIONS = toOptions(REGION_LABELS);

const LOOKUP_TONE_CLASSES = {
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-900",
  error: "bg-red-50 text-red-700",
} as const;

// The register is authoritative for legal details, but the name and trade
// the artisan chose at signup are kept.
function mergeRegistryValues(current: ProfileValues, found: Partial<ProfileValues>): ProfileValues {
  const merged = { ...current };
  for (const [field, value] of Object.entries(found) as [keyof ProfileValues, string | undefined][]) {
    if (!value) continue;
    if ((field === "name" || field === "trade") && current[field]) continue;
    merged[field] = value;
  }
  return merged;
}

function suggestVatNumber(siret: string): string {
  const digits = normalizeSiret(siret);
  return /^[0-9]{14}$/.test(digits) ? toVatNumber(digits.slice(0, 9)) : "FR12 345678901";
}

export function CompanyProfileForm({ initialValues }: { initialValues: ProfileValues }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(initialValues);
  // Remounts the fields with new default values after a SIRET lookup.
  const [fieldsKey, setFieldsKey] = useState(0);
  const [legalForm, setLegalForm] = useState(initialValues.legalForm);
  const [vatRegime, setVatRegime] = useState(initialValues.vatRegime);
  const [lookupResult, setLookupResult] = useState<SiretLookupResult | null>(null);
  const [saveError, setSaveError] = useState<string>();
  const [isLookingUp, startLookup] = useTransition();
  const [isSaving, startSaving] = useTransition();

  function readCurrentValues(): ProfileValues {
    return formRef.current ? readProfileValues(new FormData(formRef.current)) : values;
  }

  function handleLookup() {
    const current = readCurrentValues();
    startLookup(async () => {
      const result = await lookupSiret(current.siret);
      setLookupResult(result);
      if (!result.values) return;

      const merged = mergeRegistryValues(current, result.values);
      setValues(merged);
      setLegalForm(merged.legalForm);
      setVatRegime(merged.vatRegime);
      setFieldsKey((key) => key + 1);
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaveError(undefined);
    startSaving(async () => {
      // Redirects to the dashboard on success.
      const result = await saveCompanyProfile(formData);
      setSaveError(result.error);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div key={fieldsKey} className="space-y-6">
        <Fieldset title="Votre numéro SIRET" description="On remplit le reste pour vous.">
          <TextField
            label="SIRET"
            name="siret"
            inputMode="numeric"
            autoComplete="off"
            defaultValue={values.siret}
            placeholder="123 456 789 00012"
            hint="14 chiffres. Vous le trouvez sur votre extrait Kbis ou sur annuaire-entreprises.data.gouv.fr."
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={isLookingUp}
            className="min-h-14 w-full rounded-2xl bg-stone-900 px-5 text-lg font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
          >
            {isLookingUp ? "Recherche…" : "Remplir avec mon SIRET"}
          </button>
          {lookupResult && (
            <p role="status" className={`rounded-2xl px-4 py-3 text-base font-medium ${LOOKUP_TONE_CLASSES[lookupResult.tone]}`}>
              {lookupResult.message}
            </p>
          )}
        </Fieldset>

        <Fieldset title="Votre entreprise">
          <input type="hidden" name="nafCode" value={values.nafCode} />
          <TextField label="Nom affiché à vos clients" name="name" required defaultValue={values.name} />
          <TextField
            label="Nom d'expéditeur des SMS"
            name="smsSenderName"
            required
            maxLength={11}
            defaultValue={values.smsSenderName}
            hint="Ce que vos clients voient comme expéditeur. 11 caractères max, sans accents."
          />
          <TextField
            label="Raison sociale"
            name="legalName"
            defaultValue={values.legalName}
            hint="Le nom officiel. Pour une entreprise individuelle, c'est votre prénom et votre nom."
          />
          <SelectField
            label="Forme juridique"
            name="legalForm"
            options={LEGAL_FORM_OPTIONS}
            placeholder="Choisir"
            defaultValue={values.legalForm}
            onChange={setLegalForm}
          />
          {hasShareCapital(isLegalForm(legalForm) ? legalForm : "") && (
            <TextField
              label="Capital social (€)"
              name="shareCapital"
              inputMode="decimal"
              defaultValue={values.shareCapital}
              placeholder="1 000"
            />
          )}
          <SelectField
            label="Métier"
            name="trade"
            options={TRADE_OPTIONS}
            placeholder="Choisir un métier"
            defaultValue={values.trade}
          />
          <TextField label="Adresse" name="addressLine" autoComplete="street-address" defaultValue={values.addressLine} />
          <div className="grid grid-cols-[8rem_1fr] gap-3">
            <TextField
              label="Code postal"
              name="postalCode"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              defaultValue={values.postalCode}
            />
            <TextField label="Ville" name="city" autoComplete="address-level2" defaultValue={values.city} />
          </div>
          <SelectField
            label="Région"
            name="region"
            options={REGION_OPTIONS}
            placeholder="Choisir une région"
            defaultValue={values.region}
          />
        </Fieldset>

        <Fieldset title="TVA">
          <div className="space-y-3">
            <VatRegimeOption
              value="subject"
              checked={vatRegime === "subject"}
              onSelect={setVatRegime}
              label="Je facture la TVA"
            />
            <VatRegimeOption
              value="franchise"
              checked={vatRegime === "franchise"}
              onSelect={setVatRegime}
              label="Je ne facture pas la TVA"
              detail="Micro-entreprise en franchise. Vos devis indiqueront « TVA non applicable, art. 293 B du CGI »."
            />
          </div>
          {vatRegime === "subject" && (
            <TextField
              label="Numéro de TVA intracommunautaire"
              name="vatNumber"
              autoComplete="off"
              defaultValue={values.vatNumber}
              placeholder={suggestVatNumber(values.siret)}
            />
          )}
        </Fieldset>

        <Fieldset
          title="Assurance professionnelle"
          description="Obligatoire sur vos devis. Tout est écrit sur votre attestation d'assurance (décennale)."
        >
          <TextField label="Assureur" name="insurerName" defaultValue={values.insurerName} placeholder="Nom de l'assureur" />
          <TextField label="Adresse de l'assureur" name="insurerAddress" defaultValue={values.insurerAddress} />
          <TextField label="Numéro de contrat" name="insurancePolicyNumber" defaultValue={values.insurancePolicyNumber} />
          <TextField
            label="Zone couverte"
            name="insuranceCoverageArea"
            defaultValue={values.insuranceCoverageArea}
            placeholder="France métropolitaine"
          />
        </Fieldset>

        <Fieldset
          title="Médiateur de la consommation"
          description="Obligatoire si vous travaillez pour des particuliers. Votre fédération professionnelle peut vous en indiquer un."
        >
          <TextField label="Nom du médiateur" name="mediatorName" defaultValue={values.mediatorName} />
          <TextField
            label="Site internet du médiateur"
            name="mediatorWebsite"
            inputMode="url"
            defaultValue={values.mediatorWebsite}
            placeholder="www.exemple-mediateur.fr"
          />
        </Fieldset>

        <Fieldset title="Contact affiché sur vos devis">
          <TextField
            label="Téléphone"
            name="contactPhone"
            type="text"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={values.contactPhone}
            placeholder="06 12 34 56 78"
          />
          <TextField
            label="E-mail"
            name="contactEmail"
            type="email"
            autoComplete="email"
            defaultValue={values.contactEmail}
          />
        </Fieldset>
      </div>

      <FormError message={saveError} />
      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-600 px-7 text-lg font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
      >
        {isSaving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

type FieldsetProps = { title: string; description?: string; children: React.ReactNode };

function Fieldset({ title, description, children }: FieldsetProps) {
  return (
    <fieldset className="space-y-5 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <legend className="sr-only">{title}</legend>
      <div>
        <h2 className="text-xl font-bold text-stone-900">{title}</h2>
        {description && <p className="mt-1 text-base text-stone-600">{description}</p>}
      </div>
      {children}
    </fieldset>
  );
}

type VatRegimeOptionProps = {
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  label: string;
  detail?: string;
};

function VatRegimeOption({ value, checked, onSelect, label, detail }: VatRegimeOptionProps) {
  return (
    <label
      className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 ${checked ? "border-orange-500 bg-orange-50" : "border-stone-200"}`}
    >
      <input
        type="radio"
        name="vatRegime"
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="mt-1 size-5 accent-orange-600"
      />
      <span>
        <span className="block text-lg font-semibold text-stone-900">{label}</span>
        {detail && <span className="mt-1 block text-sm text-stone-600">{detail}</span>}
      </span>
    </label>
  );
}
