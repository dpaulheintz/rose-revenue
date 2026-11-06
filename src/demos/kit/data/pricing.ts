// Quote math shared by the quote calculators. Margin is a share of the price;
// markup is a share of the cost (30% markup ≈ 23% margin).

/** Price that leaves `margin` (0..1) of the price as profit. */
export const withMargin = (cost: number, margin: number) => cost / (1 - margin);
/** Cost plus `markup` (0..1) of the cost. */
export const withMarkup = (cost: number, markup: number) => cost * (1 + markup);
/** Gross margin of a price, 0..1. */
export const marginOf = (price: number, cost: number) => (price > 0 ? (price - cost) / price : 0);
/** Shop-rate labor: hours at an hourly rate. */
export const laborCost = (hours: number, rate: number) => hours * rate;
