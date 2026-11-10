import {
  BuildingIcon,
  CheckIcon,
  ClockIcon,
  CrossIcon,
  DocumentIcon,
  FlagIcon,
  FlaskIcon,
  InboxIcon,
  LockIcon,
  MessageIcon,
  PhoneMissedIcon,
  SettingsIcon,
  SignatureIcon,
  TagIcon,
} from "@/components/landing/icons";
import { IconTile, StatusPill, type Tone } from "./tones";

type Icon = typeof InboxIcon;
type Look = { label: string; tone: Tone; Icon: Icon };

// Each place keeps the same colour and icon everywhere: tab, row in Réglages, page title.
export const PLACES = {
  requests: { label: "Demandes", tone: "orange", Icon: InboxIcon },
  quotes: { label: "Devis", tone: "sky", Icon: DocumentIcon },
  settings: { label: "Réglages", tone: "violet", Icon: SettingsIcon },
  setup: { label: "Mise en place", tone: "amber", Icon: FlagIcon },
  company: { label: "Mon entreprise", tone: "sky", Icon: BuildingIcon },
  autoReply: { label: "Réponse automatique", tone: "emerald", Icon: PhoneMissedIcon },
  messages: { label: "Vos messages", tone: "violet", Icon: MessageIcon },
  simulator: { label: "Simulateur", tone: "stone", Icon: FlaskIcon },
  password: { label: "Mot de passe", tone: "stone", Icon: LockIcon },
  prices: { label: "Mes prix", tone: "emerald", Icon: TagIcon },
} satisfies Record<string, Look>;

export type Place = keyof typeof PLACES;

// Same colours for a quote wherever it is listed.
export const QUOTE_STATUS = {
  draft: { label: "Brouillon", tone: "amber", Icon: SignatureIcon },
  sent: { label: "Envoyé", tone: "sky", Icon: ClockIcon },
  signed: { label: "Signé", tone: "emerald", Icon: CheckIcon },
  declined: { label: "Refusé", tone: "stone", Icon: CrossIcon },
} satisfies Record<string, Look>;

export type QuoteStatus = keyof typeof QUOTE_STATUS;

export function QuoteStatusTile({ status, size }: { status: QuoteStatus; size?: "sm" | "md" }) {
  const { tone, Icon } = QUOTE_STATUS[status];
  return (
    <IconTile tone={tone} size={size}>
      <Icon />
    </IconTile>
  );
}

export function QuoteStatusPill({ status }: { status: QuoteStatus }) {
  const { label, tone, Icon } = QUOTE_STATUS[status];
  return (
    <StatusPill tone={tone}>
      <Icon className="size-3.5" />
      {label}
    </StatusPill>
  );
}

// Title of a page, with the colour and icon of its place.
export function PageTitle({ place, intro }: { place: Place; intro?: React.ReactNode }) {
  const { label, tone, Icon } = PLACES[place];
  return (
    <header className="mb-8 mt-4">
      <div className="flex items-center gap-3">
        <IconTile tone={tone}>
          <Icon />
        </IconTile>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">{label}</h1>
      </div>
      {intro && <p className="mt-3 text-lg text-stone-600">{intro}</p>}
    </header>
  );
}
