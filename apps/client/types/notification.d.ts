/**
 * Represents a notification property containing a paginated list of notification results.
 */
export interface NotificationProp {
  /**
   * The total count of notifications available in the paginated list.
   */
  count?: number;

  /**
   * The reference to the next page of notifications (if available).
   */
  next?: number;

  /**
   * The reference to the previous page of notifications (if available).
   */
  previous?: number;

  /**
   * An array containing the notification results for the current page.
   */
  results?: Result[];
}

/**
 * Represents a single notification result in the paginated list.
 */
export interface Result {
  /**
   * The unique identifier of the notification.
   */
  id?: number;

  /**
   * The type of the notification.
   * For example, it could be "New referral", "Exchange", "Subscription", etc.
   */
  notification_type?: string;

  /**
   * The message content of the notification.
   */
  message?: string;

  /**
   * Indicates whether the notification has been read or not.
   */
  is_read?: boolean;

  /**
   * Indicates whether the notification is currently active or not.
   */
  is_active?: boolean;

  /**
   * The date and time when the notification was created.
   */
  created_at?: Date;
}

export interface UnreadNotificationProp {
  count?: number;
  next?: number;
  previous?: number;
  results?: NotificationProp[];
}

export interface ShowFullMessageState {
  /**
   * The unique identifier for the current click notification.
   */
  [key: number]: boolean;
}