export interface TradeProp {
  id?: number;
  exchange?: string;
  currency?: string;
  pair?: string;
  order_count?: number;
  amount?: string;
  trade_balance: string;
  stop_loss?: string;
  re_invest_all?: boolean;
  profit_margin?: number;
  loss_margin?: number;
  profit_loss_differrence?: number;
  is_active?: boolean;
  created_at?: Date;
  trade_order?: TradeOrder[];
}

export interface TradeOrder {
  id?: number;
  order_id?: string;
  currency?: string;
  type?: string;
  pair?: string;
  quantity?: string;
  price?: string;
  difference?: string;
  is_filled?: boolean;
  created_at?: Date;
  updated_at?: Date;
  misc?: any;
}

export interface UserTradePortfolio {
  total_profit_margin?: number;
  total_loss_margin?: number;
  total_trades?: number;
  total_orders?: number;
}

export interface TradePortfolioPairList {
  invested_pairs?: string[];
}

export interface TradedYears {
  status?: string;
  trades_years?: number[];
}

export interface AddTradeProp {
  exchange_id: number;
  currency_id: number;
  pair_id: number;
  amount: number;
  stop_loss: number;
  re_invest_all: boolean;
  trade_type: 1 | 2 | null;
}

export interface YearlyProfitAnalysisProp {
  month?: string;
  percent?: number;
}
