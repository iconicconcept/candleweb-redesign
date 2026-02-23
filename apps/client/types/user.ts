/**
 * Represents a user with relevant information.
 */
export interface User {
  /**
   * The status of the user (if applicable).
   */
  status?: string;

  /**
   * The username of the user.
   */
  username?: string;

  /**
   * The wallet address associated with the user.
   */
  wallet_address?: string;

  /**
   * The email address of the user.
   */
  email?: string;

  /**
   * An array containing user exchange information (if applicable).
   */
  user_exchanges?: UserExchange[];

  is_live_mode?: boolean;

  access_token?: string;
  first_name?: string;
  last_name?: string;
}

export interface UserExchange {
  id?: number;
  supported_exchange_id?: string;
  API_KEY?: string;
  API_SECRET?: string;
  is_active?: boolean;
}

export interface BalanceProp {
  name: string;
  balance: number;
  logo: string;
}
