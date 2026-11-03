"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-12 rounded-2xl bg-stone-900 px-5 text-base font-semibold text-white hover:bg-stone-700 print:hidden"
    >
      Imprimer ou enregistrer en PDF
    </button>
  );
}
