import type { Metadata } from "next";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié · Batrelio",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-sm sm:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Mot de passe oublié</h1>
          <p className="mb-8 mt-2 text-lg text-stone-600">
            Indiquez votre adresse e-mail : vous recevez un lien pour choisir un nouveau mot de passe.
          </p>
          <ForgotPasswordForm />
        </div>
      </main>
      <footer className="border-t border-stone-200">
        <LegalLinks className="mx-auto max-w-5xl px-4 py-6 sm:px-6" />
      </footer>
    </>
  );
}
