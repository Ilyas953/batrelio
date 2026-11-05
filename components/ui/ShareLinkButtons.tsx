"use client";

import { useState, useSyncExternalStore } from "react";

export type ShareableMessage = { shareText: string; customerPhone: string | null };
export type ShareableLink = ShareableMessage & { url: string };

const subscribeToNothing = () => () => {};

// The native share sheet exists on phones only, and never during server rendering.
function useCanShare(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => typeof navigator.share === "function",
    () => false,
  );
}

// sms:+33…?&body= works on both iOS and Android.
function toSmsHref(link: ShareableMessage): string {
  return `sms:${link.customerPhone ?? ""}?&body=${encodeURIComponent(link.shareText)}`;
}

function toWhatsAppHref(link: ShareableMessage): string {
  const recipient = link.customerPhone?.replace("+", "") ?? "";
  return `https://wa.me/${recipient}?text=${encodeURIComponent(link.shareText)}`;
}

export const SHARE_BUTTON_CLASSES =
  "flex min-h-14 w-full items-center justify-center rounded-2xl px-5 text-lg font-semibold";
const SECONDARY_SHARE_BUTTON = `${SHARE_BUTTON_CLASSES} border-2 border-stone-200 text-stone-900 hover:border-stone-900`;

// Native share, SMS, WhatsApp and copy: the artisan sends the link from their own phone.
export function ShareLinkButtons({ link }: { link: ShareableLink }) {
  const [copied, setCopied] = useState(false);
  const canShare = useCanShare();

  return (
    <div className="space-y-3">
      <p className="break-all rounded-2xl bg-stone-100 px-4 py-3 font-mono text-sm text-stone-800">{link.url}</p>
      {canShare && (
        <button
          type="button"
          onClick={() => navigator.share({ text: link.shareText }).catch(() => {})}
          className={`${SHARE_BUTTON_CLASSES} bg-orange-600 text-white hover:bg-orange-700`}
        >
          Partager le lien
        </button>
      )}
      <a href={toSmsHref(link)} className={SECONDARY_SHARE_BUTTON}>
        Envoyer par SMS
      </a>
      <a href={toWhatsAppHref(link)} target="_blank" rel="noopener noreferrer" className={SECONDARY_SHARE_BUTTON}>
        Envoyer par WhatsApp
      </a>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(link.url);
          setCopied(true);
        }}
        className={SECONDARY_SHARE_BUTTON}
      >
        {copied ? "Lien copié ✓" : "Copier le lien"}
      </button>
    </div>
  );
}

// A message without a link (e.g. a proposed visit): sent from the artisan's own phone to the customer.
export function ShareMessageButtons({ message }: { message: ShareableMessage }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-3">
      <p className="whitespace-pre-line rounded-2xl bg-stone-100 px-4 py-3 text-base text-stone-800">{message.shareText}</p>
      <a href={toSmsHref(message)} className={`${SHARE_BUTTON_CLASSES} bg-orange-600 text-white hover:bg-orange-700`}>
        Envoyer par SMS
      </a>
      <a href={toWhatsAppHref(message)} target="_blank" rel="noopener noreferrer" className={SECONDARY_SHARE_BUTTON}>
        Envoyer par WhatsApp
      </a>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(message.shareText);
          setCopied(true);
        }}
        className={SECONDARY_SHARE_BUTTON}
      >
        {copied ? "Message copié ✓" : "Copier le message"}
      </button>
    </div>
  );
}
