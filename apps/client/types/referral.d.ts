/**
 * Represents the referral record of a user.
 */
export interface UserReferralRecord {
  /**
   * The total number of referrals made by the user.
   */
  referral_count?: number;

  /**
   * The total earning amount of the user from referrals.
   */
  total_earning?: number;

  /**
   * The claimed earning amount of the user from referrals.
   */
  claimed_earning?: number;

  /**
   * The unclaimed earning amount of the user from referrals.
   */
  unclaimed_earning?: number;
}

/**
 * Represents the unsubscribed referral information.
 */
export interface UnsubscribedReferral {
  /**
   * The total count of unsubscribed referrals.
   */
  count?: number;

  /**
   * The reference to the next page of unsubscribed referrals.
   */
  next?: number;

  /**
   * The reference to the previous page of unsubscribed referrals.
   */
  previous?: number;

  /**
   * An array containing the details of unsubscribed referrals.
   */
  results?: SubResult[];
}

/**
 * Represents a single result entry in the unsubscribed referral list.
 */
export interface Result {
  /**
   * The unique identifier of the referral entry.
   */
  id?: number;

  /**
   * The identifier of the referred user associated with this referral entry.
   */
  referred_id?: string;

  /**
   * The date when the referral was created.
   */
  created_at?: Date;
}

/**
 * Represents the subscribed referral information.
 */
export interface SubscribedReferral {
  /**
   * The total count of subscribed referrals.
   */
  count?: number;

  /**
   * A reference to the next page of subscribed referrals (if available).
   */
  next?: null;

  /**
   * A reference to the previous page of subscribed referrals (if available).
   */
  previous?: null;

  /**
   * An array containing the details of subscribed referral entries.
   */
  results?: SubResult[];
}

/**
 * Represents a single result entry in the subscribed referral list.
 */
export interface SubResult {
  /**
   * The unique identifier of the subscribed referral entry.
   */
  id?: number;

  /**
   * The identifier of the referred user associated with this subscribed referral entry.
   */
  referred_id?: string;

  /**
   * The reward amount associated with this subscribed referral entry.
   */
  reward_amount?: string;

  /**
   * Indicates whether the reward for this subscribed referral entry is claimed or not.
   */
  is_claimed?: boolean;
  payment_id?: string;
  created_at: Date;
  total_earnings: number;
  last_month_earnings: number;
  total_referrals_count: number;
}
