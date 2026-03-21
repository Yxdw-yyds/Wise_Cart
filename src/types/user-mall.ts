export type MallCategory = "drink" | "snack" | "daily" | "food" | "beauty" | "digital";
export type BehaviorAction = "view" | "cart" | "buy" | "fav";
export type PriceBand = "low" | "mid" | "high";

export interface MallProduct {
  id: number;
  name: string;
  category: MallCategory;
  price: number;
  originalPrice?: number;
  shop: string;
  stock: number;
  tags: string[];
  hotScore: number;
  ctr: number;
  online: boolean;
  imgBg: string;
}

export interface BehaviorEvent {
  userId: string;
  productId: number;
  category: MallCategory;
  action: BehaviorAction;
  ts: number;
}

export interface GuessLikeItem {
  productId: number;
  name: string;
  score: number;
  reason: string;
  category: MallCategory;
  price: number;
}

export interface Top50Item {
  rank: number;
  productId: number;
  name: string;
  category: MallCategory;
  interestScore: number;
  hotScore: number;
  ctr: number;
  reason: string;
  priceBand: PriceBand;
  online: boolean;
}

export interface UserInterestProfile {
  categoryPercents: Record<MallCategory, number>;
  tags: string[];
  summary: string;
}
