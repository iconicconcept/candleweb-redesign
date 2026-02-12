import { dollarFormat } from "ui";
import { TradeProp, YearlyProfitAnalysisProp } from "../types/trade";

/**
 * Finds the object with the highest percent value in an array of YearlyProfitAnalysisProp objects.
 *
 * @param {YearlyProfitAnalysisProp[]} data - The array of YearlyProfitAnalysisProp objects to search through.
 * @returns {YearlyProfitAnalysisProp | null} The object with the highest percent value, or null if the array is empty.
 */
export function findHighestPercent(
  data: YearlyProfitAnalysisProp[]
): YearlyProfitAnalysisProp | null {
  // Return null if the array is empty
  if (data.length === 0) {
    return null;
  }

  // Initialize the highestPercentObj with the first object in the array
  let highestPercentObj = data[0];

  // Iterate through the array to find the object with the highest percent value
  for (const obj of data) {
    // Check if the 'percent' property is defined and if the current object's percent is higher
    if (obj.percent !== undefined && obj.percent > highestPercentObj.percent!) {
      highestPercentObj = obj;
    }
  }

  // Return the object with the highest percent value
  return highestPercentObj;
}

/**
 * Groups and aggregates profit_loss_difference values by pair from a list of trades.
 *
 * @param {TradeProp[]} tradeList - The list of trades to process.
 * @param {number} amt - The constant amount value.
 * @returns {Object[]} - An array of objects containing pair-wise aggregated data.
 */
export function aggregateProfitLossByPair(
  tradeList: TradeProp[],
  amt: number
): any[] {
  const pairGroup: { [key: string]: number } = {};

  // Loop through the tradeList
  tradeList.forEach((trade) => {
    const pair = trade.pair;
    const profitLoss = parseFloat(trade.amount!) || 0;

    if (pair && typeof profitLoss === "number") {
      if (!pairGroup.hasOwnProperty(pair)) {
        pairGroup[pair] = profitLoss;
      } else {
        pairGroup[pair] += profitLoss;
      }
    }
  });

  const data = [
    {
      name: "Page A",
      ...pairGroup,
      amt: amt,
    },
  ];

  return data;
}

export const convertObjectToArray = (obj: Record<string, number>): string[] => {
  const resultArray = Object.entries(obj).map(
    ([key, value]) => `${key}: ${dollarFormat(value)}`
  );
  return resultArray;
};
