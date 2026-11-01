export enum RentalPeriod {
  YEAR = 'YEAR',
  MONTH = 'MONTH',
  WEEK = 'WEEK',
  DAY = 'DAY',
  NIGHT = 'NIGHT',
}

export const RENTAL_PERIOD_LABELS: Record<RentalPeriod, string> = {
  [RentalPeriod.YEAR]: 'Per year',
  [RentalPeriod.MONTH]: 'Per month',
  [RentalPeriod.WEEK]: 'Per week',
  [RentalPeriod.DAY]: 'Per day',
  [RentalPeriod.NIGHT]: 'Per night',
};
