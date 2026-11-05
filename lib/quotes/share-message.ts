// The text the artisan sends with a quote link, from their own phone (SMS, WhatsApp…).

export const MAX_QUOTE_MESSAGE_LENGTH = 300;

export function defaultQuoteMessage(companyName: string): string {
  return `Bonjour, voici votre devis de ${companyName} :`;
}

// The link is always appended, so a personalised message can never lose it.
export function quoteShareText(company: { name: string; quote_message: string | null }, url: string): string {
  const message = company.quote_message?.trim() || defaultQuoteMessage(company.name);
  return `${message} ${url}`;
}
