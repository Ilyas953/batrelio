// Realistic central estimates behind the revenue estimate, shown to the visitor.
// - newClientShare: in France, 53% of calls from unknown numbers are spam (Hiya 2024),
//   but an artisan listed online also gets many calls from new prospects.
// - formCompletionRate: the caller phoned a minute ago and the SMS carries the company
//   name, so they are far warmer than an SMS campaign (6-16% clicks, smsmode); ~31% of
//   mobile visitors who see a form submit it (Zuko).
// - lostWithoutReplyShare: only prospects who would have gone elsewhere count as a gain.
//   Midpoint between 21% who immediately call another business and 78% who have already
//   abandoned one after an unanswered call (CallRail 2025).
export const ROI_ASSUMPTIONS = {
  weeksPerMonth: 52 / 12,
  newClientShare: 0.4,
  formCompletionRate: 0.3,
  lostWithoutReplyShare: 0.5,
} as const;

export type RoiInput = {
  missedCallsPerWeek: number;
  averageJobValue: number;
  quoteSignRate: number;
};

export type RoiEstimate = {
  requestsPerYear: number;
  extraJobsPerYear: number;
  revenuePerMonth: number;
  revenuePerYear: number;
};

export function estimateRecoveredRevenue(input: RoiInput): RoiEstimate {
  const missedCallsPerYear = input.missedCallsPerWeek * ROI_ASSUMPTIONS.weeksPerMonth * 12;
  const requestsPerYear =
    missedCallsPerYear * ROI_ASSUMPTIONS.newClientShare * ROI_ASSUMPTIONS.formCompletionRate;
  const extraJobsPerYear =
    requestsPerYear * ROI_ASSUMPTIONS.lostWithoutReplyShare * input.quoteSignRate;
  const revenuePerYear = extraJobsPerYear * input.averageJobValue;

  return {
    requestsPerYear,
    extraJobsPerYear,
    revenuePerMonth: revenuePerYear / 12,
    revenuePerYear,
  };
}

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatEuros(amount: number): string {
  return euroFormatter.format(Math.round(amount));
}
