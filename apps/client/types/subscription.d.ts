/**
 * Represents a subscription with relevant information.
 */
export interface SubscriptionProp {
  /**
   * The unique identifier of the subscription.
   */
  id?: number;

  /**
   * The name of the subscription.
   */
  name?: string;

  /**
   * The price of the subscription as a string (could represent a monetary value).
   */
  price?: string;

  /**
   * An array containing the features associated with the subscription.
   */
  features?: Feature[];
}

/**
 * Represents the subscription history with relevant information.
 */
export interface SubscriptionHistoryProp {
  /**
   * The unique identifier of the subscription history entry.
   */
  id?: number;

  /**
   * The identifier of the subscription associated with this history.
   */
  subscription_id?: number;

  /**
   * The transaction hash associated with the subscription (if applicable).
   */
  transaction_hash?: string;

  tokens?: number;

  /**
   * Indicates whether the subscription is currently active or not.
   */
  is_active?: boolean;

  /**
   * The date and time when the subscription history entry was created.
   */
  created_at?: Date;

  /**
   * The expiry date of the subscription.
   */
  expiry_date?: Date;

  /**
   * The date and time when the subscription history entry was last updated.
   */
  updated_at?: Date;

  /**
   * An array containing the features associated with the subscription.
   */
  subscription?: Feature[];

  /**
   * Additional information related to the account subscription
   */
  account_subscription?: AccountSubscription;
}

export interface AccountSubscription {
  id?: number;
  referrer_id?: string;
  reward_amount?: string;
  is_claimed?: boolean;
}

/**
 * Represents a feature that could be associated with a subscription.
 */
export interface Feature {
  /**
   * A description of the feature.
   */
  description?: string;

  /**
   * The number of allowed trades per month (if applicable).
   */
  trade_per_month?: number;

  /**
   * The number of allowed orders per day (if applicable).
   */
  order_per_day?: number;

  /**
   * The number of allowed coin selections (if applicable).
   */
  coin_selection?: number;

  /**
   * Indicates whether the feature supports auto profit (if applicable).
   */
  auto_profit?: boolean;

  /**
   * Indicates whether the feature supports stop-loss adjuster (if applicable).
   */
  stop_loss_adjuster?: boolean;

  /**
   * Indicates whether the feature supports stop-profit adjuster (if applicable).
   */
  stop_profit_adjuster?: boolean;

  /**
   * Indicates whether the feature supports instant support (if applicable).
   */
  instant_support?: boolean;

  /**
   * Indicates whether the feature supports portfolio management (if applicable).
   */
  portfolio_mgnt?: boolean;

  /**
   * The number of allowed exchange selections (if applicable).
   */
  exchange_selection?: number;
}

export interface PaymentIDProp {
  id?: number;
  name?: string;
  is_active?: boolean;
}
