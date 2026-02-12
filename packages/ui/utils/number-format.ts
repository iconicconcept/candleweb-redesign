const formatCash = (n: any) => {
  if (n < 1e3) return n;
  if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(2) + "K";
  if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(2) + "M";
  if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(2) + "B";
  if (n >= 1e12) return +(n / 1e12).toFixed(2) + "T";
};

export const numberFormat = (num: any) => {
  if (num < 0) {
    return "-" + formatCash(-1 * num);
  } else {
    return formatCash(num);
  }
};
export const dollarFormat = (
  amount: number | null | undefined,
  decimal?: number
): string => {
  // Check if the input amount is null, undefined, or NaN, and return "$0.00" in that case
  if (amount == null || isNaN(amount)) {
    return "$0.00";
  }
  // Set the number of decimal places; default is 2 if not provided
  const decimals = decimal ?? 2;

  // Round the entire amount to the specified number of decimals
  const roundedAmount = amount.toFixed(decimals);

  // Split the rounded amount into integer and decimal parts
  const [integerPart, decimalPart] = roundedAmount.split(".");

  // Convert the integer part to a string and split it into an array of characters
  const integerPartArray = integerPart.split("");

  // Keep track of how many characters we've processed
  let count = 0;

  // Loop through the array of characters in reverse order and insert commas every 3 characters for the integer part
  for (let i = integerPartArray.length - 1; i >= 0; i--) {
    count++;
    if (count === 3 && i !== 0) {
      integerPartArray.splice(i, 0, ",");
      count = 0;
    }
  }

  // Combine the formatted integer part with the decimal part and return the formatted dollar amount with a dollar sign prefix
  return "$" + integerPartArray.join("") + "." + (decimalPart || "00");
};
