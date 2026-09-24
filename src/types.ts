export interface HeroSlide {
  id: string;
  badge: string;
  badgeType: 'promo' | 'financing' | 'outlet' | 'gaming' | 'tradein';
  headline: string;
  subheadline: string;
  legalText?: string;
  ctaText: string;
  category: string;
  tag: string;
  highlightStat: string;
  highlightLabel: string;
  accentColor: string;
  bgGradient: string;
  imageUrl?: string;
}

export interface Persona {
  id: string;
  title: string;
  subtitle: string;
  role: string;
  avatarIcon: string;
  accentBg: string;
  accentBorder: string;
  keyFrustration: string;
  desiredOutcome: string;
  wortenAdvantage: string;
  matchingDeals: string[];
}

export interface CoreSolution {
  id: string;
  name: string;
  outcomeBenefit: string;
  icon: string;
  badge: string;
  metric: string;
  metricLabel: string;
}

export interface PromoProduct {
  id: string;
  category: 'smartphones' | 'tvs' | 'appliances' | 'beauty' | 'computing' | 'gaming';
  title: string;
  subtitle: string;
  originalPrice: number;
  promoPrice: number;
  discountBadge: string;
  badgeType?: 'percent' | 'amount' | 'gift' | 'deal' | 'talon';
  secondaryIncentive: string;
  financingInfo: string;
  inStock: boolean;
  rating: number;
  reviewsCount: number;
  imageAlt: string;
  imageUrl: string;
  deliveryTag: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'promo' | 'financing' | 'shipping' | 'resolve' | 'returns' | 'services';
}

export interface EditorialArticle {
  id: string;
  type: string;
  title: string;
  excerpt: string;
  readTime: string;
  category: string;
  badge: string;
  imageUrl?: string;
}

export interface LocalService {
  id: string;
  name: string;
  description: string;
  priceStartingAt: string;
  timeframe: string;
  icon: string;
  popular?: boolean;
}
