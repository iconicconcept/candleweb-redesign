/**
 * Represents a currency in the system.
 */
export interface Currency {
  /**
   * The primary key of the currency entry.
   */
  pk?: number;

  /**
   * The name of the currency.
   */
  name?: string;

  /**
   * The ticker symbol of the currency.
   */
  ticker?: string;

  /**
   * An array of currency pairs associated with this currency.
   */
  currency_pair?: CurrencyPair[];
}

/**
 * Represents a currency pair, defining the relationship between two currencies.
 */
export interface CurrencyPair {
  /**
   * The unique identifier of the currency pair entry.
   */
  id?: number;

  /**
   * The pair string representing the relationship between two currencies.
   * For example, "USD/EUR" represents the exchange rate between US Dollar (USD) and Euro (EUR).
   */
  pair?: string;

  /**
   * The photo/symbol of the currency pair.
   */
  photo?: number;
}
