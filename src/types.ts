import { IconType } from './types/icons';

export interface IAssetCategory {
  id: string;
  name: string;
  icon: IconType;
}

export interface IAsset {
  id: number;
  category: string;
  asset: string;
  provider: string;
  notes: string;
  marketCap: string;
  itcasScore: number;
  sector: string;
  apy: number;
  targetAllocation: number;
  currentAllocation: number;
  sharePrice: number;
  quantity: number;
  valueCAD: number;
}

export interface ITabItem {
  id: string;
  label: string;
  icon: IconType;
}

export interface IHistoricalData {
  value: number;
  timestamp: string;
}

export interface IPortfolioStats {
  totalValueCAD: number;
  totalValueBRL: number;
  passiveIncome: number;
  globalYield: number;
  totalBTC: number;
  history: {
    totalValue: IHistoricalData[];
    passiveIncome: IHistoricalData[];
    btc: IHistoricalData[];
  };
}

// Re-export Stripe types for convenience
export type {
  SubscriptionStatus,
  UserProfile,
  Subscription,
  Product,
  Price,
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  CreditsPackage,
} from './lib/stripe/types';
