import type { ArtworkCurrency } from "../types";

export const currencyFormatters: Record<ArtworkCurrency, Intl.NumberFormat> = {
  NGN: new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  USD: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
};

export const formatCurrency = (
  value: number,
  currency: ArtworkCurrency,
): string => currencyFormatters[currency].format(value);

export const formatNaira = (value: number): string =>
  formatCurrency(value, "NGN");

export const getCurrencyIncrement = (currency: ArtworkCurrency): number =>
  currency === "USD" ? 10 : 10000;

export const getCurrencyLabel = (currency: ArtworkCurrency): string =>
  currency === "USD" ? "USD" : "NGN";
