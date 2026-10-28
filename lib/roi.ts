// Conservative assumptions behind the revenue estimate, shown to the visitor.
export const ROI_ASSUMPTIONS = {
  weeksPerMonth: 52 / 12,
  newClientShare: 0.5,
  formCompletionRate: 0.5,
} as const;

export type RoiInput = {
  missedCallsPerWeek: number;
  averageJobValue: number;
  quoteSignRate: number;
};

export type RoiEstimate = {
  requestsPerMonth: number;
  jobsPerMonth: number;
  revenuePerMonth: number;
  revenuePerYear: number;
};

export function estimateRecoveredRevenue(input: RoiInput): RoiEstimate {
  const missedCallsPerMonth = input.missedCallsPerWeek * ROI_ASSUMPTIONS.weeksPerMonth;
  const requestsPerMonth =
    missedCallsPerMonth * ROI_ASSUMPTIONS.newClientShare * ROI_ASSUMPTIONS.formCompletionRate;
  const jobsPerMonth = requestsPerMonth * input.quoteSignRate;
  const revenuePerMonth = jobsPerMonth * input.averageJobValue;

  return {
    requestsPerMonth,
    jobsPerMonth,
    revenuePerMonth,
    revenuePerYear: revenuePerMonth * 12,
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
