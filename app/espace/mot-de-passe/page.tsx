import type { Metadata } from "next";
import { BackLink } from "@/components/espace/BackLink";
import { PageTitle } from "@/components/espace/places";
import { NewPasswordForm } from "./NewPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe · Batrelio",
  robots: { index: false },
};

// Opened from the "mot de passe oublié" e-mail (already signed in by the link) or from Réglages.
export default function NewPasswordPage() {
  return (
    <>
      <BackLink href="/espace/reglages" label="Réglages" />
      <PageTitle place="password" intro="Choisissez votre nouveau mot de passe : vous restez connecté." />
      <NewPasswordForm />
    </>
  );
}
