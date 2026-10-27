/**
 * Represents an exchange property with essential information.
 */
export interface ExchangeProp {
  /**
   * The unique identifier of the exchange.
   */
  id: number;

  /**
   * The name of the exchange.
   */
  name: string;

  /**
   * Whether an admin currently offers this exchange.
   *
   * Optional because it is not certain every response carries it: an admin
   * turning an exchange off may remove it from `/exchange/list/` outright
   * rather than flag it. Both are handled — `isOffered` in
   * `lib/exchangeCatalog.ts` treats an absent row and `is_active: false` the
   * same way, so a deactivated exchange disappears under either behaviour.
   */
  is_active?: boolean;
}

/**
 * Represents a record for an exchange.
 */
export interface ExchangeRecord {
  /**
   * The unique identifier of the exchange record.
   */
  id?: number;

  /**
   * The supported exchange identifier.
   * This could be a string representing the exchange name or code.
   */
  supported_exchange_id?: string;

  /**
   * The API key used for authentication with the exchange (if applicable).
   */
  API_KEY?: string;

  /**
   * The API secret used for authentication with the exchange (if applicable).
   */
  API_SECRET?: string;

  /**
   * Indicates whether the exchange record is currently active or not.
   */
  is_active?: boolean;
}
