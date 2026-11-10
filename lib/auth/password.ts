// Rules shared by sign-up, "mot de passe oublié" and "changer mon mot de passe".
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;

export function findNewPasswordError(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Choisissez un mot de passe d'au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  if (password.length > MAX_PASSWORD_LENGTH) return `Votre mot de passe est trop long (${MAX_PASSWORD_LENGTH} caractères au plus).`;
  return null;
}

// Links sent by e-mail: what they open once the one-time code is checked.
export const EMAIL_LINK_TARGETS = {
  recovery: "/espace/mot-de-passe",
  email: "/espace/demarrage",
  signup: "/espace/demarrage",
} as const;

export type EmailLinkType = keyof typeof EMAIL_LINK_TARGETS;

export function isEmailLinkType(value: unknown): value is EmailLinkType {
  return typeof value === "string" && Object.hasOwn(EMAIL_LINK_TARGETS, value);
}

// Same answer whether the account exists or not: nobody can test which e-mails are customers.
export const PASSWORD_RESET_SENT =
  "Si un compte existe avec cette adresse, vous allez recevoir un e-mail avec un lien. Pensez à regarder dans les courriers indésirables.";
