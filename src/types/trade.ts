export type TradeType = "BUY" | "SELL";

export interface TradeAction {
  type: TradeType;
  quantity: number;
  price: number;
  date: string;
}

export interface Trade {
  id: string;
  symbol: string;
  date: string;
  actions: TradeAction[];
  isActive: boolean;
  notes?: string;
} 