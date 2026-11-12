import {
  SubscriptionPlan,
  SubscriptionPlanId,
  UserSubscription,
  CreditWallet,
  AIUsageRecord,
  WalletTransaction,
  CreditTopUpBundle,
  RevenueShareTransaction,
  UserEarningsAccount,
} from '../types';

// ============================================================================
// 1. SUBSCRIPTION PLANS (Section 11)
// ============================================================================

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Starter',
    priceNgn: 0,
    monthlyCredits: 300,
    badge: 'Free Tier',
    recommended: false,
    features: [
      '300 monthly AI credits',
      'Standard word processor workspace',
      'Local offline auto-save',
      'DOCX & TXT export',
      'Single-file AI prompt attachments',
    ],
  },
  {
    id: 'basic',
    name: 'Basic Academic',
    priceNgn: 2500,
    monthlyCredits: 2000,
    badge: 'Students & Writers',
    recommended: false,
    features: [
      '2,000 monthly AI credits',
      'Multi-file AI attachments & OCR',
      'Workspace document cross-referencing',
      'Priority AI generation speeds',
      'All academic template styles',
    ],
  },
  {
    id: 'standard',
    name: 'Standard Pro',
    priceNgn: 5000,
    monthlyCredits: 7000,
    badge: 'Most Popular',
    recommended: true, // Subtle visual emphasis as requested in Section 11
    features: [
      '7,000 monthly AI credits',
      'AI-controlled multi-page grouping',
      'Source citation badges with downloads',
      'AI-assisted multi-variant duplication',
      'Priority offline synchronization engine',
      'Eligible for 60% revenue sharing on client services',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Enterprise',
    priceNgn: 10000,
    monthlyCredits: 18000,
    badge: 'Research Labs & Cafes',
    recommended: false,
    features: [
      '18,000 monthly AI credits',
      'Advanced document comparison & diff analysis',
      'Unrestricted batch duplication & AI adaptation',
      'Custom institutional headers & page borders',
      'Full revenue sharing & client billing workspace',
      'Dedicated account manager support',
    ],
  },
];

// ============================================================================
// 2. CREDIT TOP-UP BUNDLES (Section 12)
// ============================================================================

export const CREDIT_TOP_UP_BUNDLES: CreditTopUpBundle[] = [
  {
    id: 'bundle-starter',
    name: 'Starter Booster',
    credits: 1000,
    priceNgn: 1000,
    bonusCredits: 0,
    popular: false,
  },
  {
    id: 'bundle-value',
    name: 'Value Pack',
    credits: 5000,
    priceNgn: 4000,
    bonusCredits: 500,
    popular: true,
  },
  {
    id: 'bundle-growth',
    name: 'Growth Pack',
    credits: 15000,
    priceNgn: 10000,
    bonusCredits: 2000,
    popular: false,
  },
  {
    id: 'bundle-mega',
    name: 'Enterprise Pool',
    credits: 40000,
    priceNgn: 25000,
    bonusCredits: 8000,
    popular: false,
  },
];

// ============================================================================
// 3. MODEL PRICING TABLE & TOKEN USAGE FORMULA (Section 12)
// ============================================================================

export interface ModelPricing {
  modelId: string;
  name: string;
  inputPer1kTokensNgn: number;
  outputPer1kTokensNgn: number;
  cachedPer1kTokensNgn: number;
}

export const MODEL_PRICING_TABLE: Record<string, ModelPricing> = {
  'gemini-1.5-flash': {
    modelId: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash (Fast)',
    inputPer1kTokensNgn: 0.15,
    outputPer1kTokensNgn: 0.60,
    cachedPer1kTokensNgn: 0.04,
  },
  'gemini-1.5-pro': {
    modelId: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro (Deep Research)',
    inputPer1kTokensNgn: 2.50,
    outputPer1kTokensNgn: 7.50,
    cachedPer1kTokensNgn: 0.65,
  },
};

// 1 credit = ~₦0.75 application credit equivalent (including margin & gateway fees)
export const CREDIT_CONVERSION_RATE_NGN = 0.75;

export function calculateActualCreditsAndCost(
  operation: string,
  modelId: string = 'gemini-1.5-flash',
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number = 0
): { credits: number; costNgn: number } {
  const pricing = MODEL_PRICING_TABLE[modelId] || MODEL_PRICING_TABLE['gemini-1.5-flash'];
  const inputCost = (inputTokens / 1000) * pricing.inputPer1kTokensNgn;
  const outputCost = (outputTokens / 1000) * pricing.outputPer1kTokensNgn;
  const cachedCost = (cachedTokens / 1000) * pricing.cachedPer1kTokensNgn;

  const totalNgnCost = inputCost + outputCost + cachedCost;
  // Convert to application credits, rounding up to smallest unit with a minimum base
  const calculatedCredits = Math.max(
    1,
    Math.ceil(totalNgnCost / CREDIT_CONVERSION_RATE_NGN)
  );

  return {
    credits: calculatedCredits,
    costNgn: parseFloat(totalNgnCost.toFixed(2)),
  };
}

// ============================================================================
// 4. STORAGE KEYS & INITIAL MOCK DATA
// ============================================================================

const STORAGE_KEY_SUBSCRIPTION = 'nc_subscription_v1';
const STORAGE_KEY_WALLET = 'nc_wallet_v1';
const STORAGE_KEY_USAGE = 'nc_ai_usage_history_v1';
const STORAGE_KEY_TRANSACTIONS = 'nc_wallet_transactions_v1';
const STORAGE_KEY_EARNINGS = 'nc_user_earnings_v1';

export const INITIAL_USER_SUBSCRIPTION: UserSubscription = {
  planId: 'standard', // Standard Pro as recommended initial account plan
  status: 'active',
  renewalDate: '26 Dec 2026',
  currentPeriodStart: '26 Nov 2026',
};

export const INITIAL_CREDIT_WALLET: CreditWallet = {
  availableCredits: 5150,
  totalAllocatedCredits: 7000,
  consumedCredits: 1850,
  breakdown: {
    subscription: 4650,
    purchased: 500,
    promotional: 0,
    adjustment: 0,
  },
  renewalDate: '26 Dec 2026',
};

export const INITIAL_USAGE_HISTORY: AIUsageRecord[] = [
  {
    id: 'usg-101',
    timestamp: '11 Nov 2026, 14:22',
    operation: 'Academic Section Generation',
    model: 'gemini-1.5-flash',
    inputTokens: 1420,
    outputTokens: 890,
    cachedTokens: 250,
    creditsDeducted: 18,
    costNgnEquivalent: 13.50,
    status: 'completed',
    documentTitle: 'AI in Nigerian Healthcare Delivery',
  },
  {
    id: 'usg-102',
    timestamp: '11 Nov 2026, 16:05',
    operation: 'Selected Text Clarification & Rewrite',
    model: 'gemini-1.5-flash',
    inputTokens: 380,
    outputTokens: 210,
    cachedTokens: 0,
    creditsDeducted: 4,
    costNgnEquivalent: 2.80,
    status: 'completed',
    documentTitle: 'ECN 301 Macroeconomics Term Paper',
  },
  {
    id: 'usg-103',
    timestamp: '11 Nov 2026, 18:40',
    operation: 'Document Comparison & Similarities',
    model: 'gemini-1.5-pro',
    inputTokens: 4600,
    outputTokens: 1200,
    cachedTokens: 800,
    creditsDeducted: 64,
    costNgnEquivalent: 48.00,
    status: 'completed',
    documentTitle: 'Literature Review Comparison 2025 vs 2026',
  },
];

export const INITIAL_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx-201',
    timestamp: '26 Oct 2026, 09:00',
    type: 'subscription_grant',
    credits: 7000,
    amountNgn: 5000,
    reference: 'SUB-STD-20261026-88',
    description: 'Standard Pro Monthly Credit Grant (7,000 Credits)',
    status: 'success',
  },
  {
    id: 'tx-202',
    timestamp: '02 Nov 2026, 11:30',
    type: 'top_up',
    credits: 5500,
    amountNgn: 4000,
    reference: 'PAY-BOOST-20261102-14',
    description: 'Value Pack Booster (+500 Bonus Credits)',
    status: 'success',
  },
  {
    id: 'tx-203',
    timestamp: '11 Nov 2026, 18:40',
    type: 'usage_deduction',
    credits: -86,
    reference: 'USG-BATCH-20261111-09',
    description: 'AI Generation & Document Analysis Usage',
    status: 'success',
  },
];

// Initial Revenue Sharing & Earnings Account (Section 13: 40% Company / 60% User)
export const INITIAL_REVENUE_TRANSACTIONS: RevenueShareTransaction[] = [
  {
    id: 'rev-301',
    timestamp: '08 Nov 2026, 10:15',
    description: 'Comprehensive Thesis Proofreading & NUC Formatting Service',
    clientOrPayer: 'Adebayo Folashade (UNILAG Postgrad)',
    grossAmountNgn: 25000,
    companyShareNgn: 10000, // 40%
    userShareNgn: 15000,    // 60%
    companyPercent: 40,
    userPercent: 60,
    reference: 'REV-NIG-20261108-44',
    status: 'verified',
    category: 'freelance_formatting',
  },
  {
    id: 'rev-302',
    timestamp: '10 Nov 2026, 15:40',
    description: 'Undergraduate Seminar Slide Review & Advisory Consultation',
    clientOrPayer: 'Emmanuel Okafor (Covenant Univ)',
    grossAmountNgn: 10000,
    companyShareNgn: 4000,  // 40%
    userShareNgn: 6000,     // 60%
    companyPercent: 40,
    userPercent: 60,
    reference: 'REV-NIG-20261110-12',
    status: 'verified',
    category: 'peer_review',
  },
];

export const INITIAL_USER_EARNINGS: UserEarningsAccount = {
  grossEarningsNgn: 35000,
  companyCommissionNgn: 14000, // 40% of ₦35,000
  netUserEarningsNgn: 21000,    // 60% of ₦35,000
  availableBalanceNgn: 16000,
  pendingBalanceNgn: 5000,
  withdrawnAmountNgn: 0,
  transactions: INITIAL_REVENUE_TRANSACTIONS,
};

// ============================================================================
// 5. BILLING MANAGER (Singleton Class with Persistence)
// ============================================================================

export class BillingManager {
  private subscription: UserSubscription;
  private wallet: CreditWallet;
  private usageHistory: AIUsageRecord[];
  private walletTransactions: WalletTransaction[];
  private earningsAccount: UserEarningsAccount;
  private listeners: (() => void)[] = [];

  constructor() {
    this.subscription = this.load(STORAGE_KEY_SUBSCRIPTION, INITIAL_USER_SUBSCRIPTION);
    this.wallet = this.load(STORAGE_KEY_WALLET, INITIAL_CREDIT_WALLET);
    this.usageHistory = this.load(STORAGE_KEY_USAGE, INITIAL_USAGE_HISTORY);
    this.walletTransactions = this.load(STORAGE_KEY_TRANSACTIONS, INITIAL_WALLET_TRANSACTIONS);
    this.earningsAccount = this.load(STORAGE_KEY_EARNINGS, INITIAL_USER_EARNINGS);
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return fallback;
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(this.subscription));
      localStorage.setItem(STORAGE_KEY_WALLET, JSON.stringify(this.wallet));
      localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(this.usageHistory));
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(this.walletTransactions));
      localStorage.setItem(STORAGE_KEY_EARNINGS, JSON.stringify(this.earningsAccount));
    } catch {
      // ignore
    }
    this.notify();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- Getters ---
  public getSubscription(): UserSubscription {
    return { ...this.subscription };
  }

  public getWallet(): CreditWallet {
    return { ...this.wallet };
  }

  public getUsageHistory(): AIUsageRecord[] {
    return [...this.usageHistory];
  }

  public getTransactions(): WalletTransaction[] {
    return [...this.walletTransactions];
  }

  public getEarningsAccount(): UserEarningsAccount {
    return { ...this.earningsAccount };
  }

  // --- Usage Threshold Check (Section 12) ---
  public getUsageStatus(): {
    status: 'normal' | 'low_warning' | 'critical_warning' | 'exhausted';
    consumedPercent: number;
    remainingPercent: number;
    canUseAI: boolean;
  } {
    const total = Math.max(1, this.wallet.totalAllocatedCredits);
    const consumed = this.wallet.consumedCredits;
    const consumedPercent = parseFloat(((consumed / total) * 100).toFixed(2));
    const remainingPercent = parseFloat((100 - consumedPercent).toFixed(2));

    if (this.wallet.availableCredits <= 0) {
      return {
        status: 'exhausted',
        consumedPercent: 100,
        remainingPercent: 0,
        canUseAI: false,
      };
    } else if (consumedPercent >= 95) {
      return {
        status: 'critical_warning',
        consumedPercent,
        remainingPercent,
        canUseAI: true,
      };
    } else if (consumedPercent >= 80) {
      return {
        status: 'low_warning',
        consumedPercent,
        remainingPercent,
        canUseAI: true,
      };
    }
    return {
      status: 'normal',
      consumedPercent,
      remainingPercent,
      canUseAI: true,
    };
  }

  // --- Reserve & Deduct AI Credits (Section 12) ---
  public reserveAndDeductCredits(
    operation: string,
    modelId: string,
    inputTokens: number,
    outputTokens: number,
    docTitle?: string
  ): { success: boolean; creditsDeducted: number; reason?: string } {
    const { credits, costNgn } = calculateActualCreditsAndCost(
      operation,
      modelId,
      inputTokens,
      outputTokens
    );

    if (this.wallet.availableCredits < credits) {
      return {
        success: false,
        creditsDeducted: 0,
        reason: `Insufficient credits. Required: ${credits}, Available: ${this.wallet.availableCredits}. Please top up.`,
      };
    }

    // Deduction priority: promotional -> subscription -> purchased
    let remainingToDeduct = credits;
    const bd = { ...this.wallet.breakdown };

    if (bd.promotional > 0) {
      const takePromo = Math.min(bd.promotional, remainingToDeduct);
      bd.promotional -= takePromo;
      remainingToDeduct -= takePromo;
    }
    if (remainingToDeduct > 0 && bd.subscription > 0) {
      const takeSub = Math.min(bd.subscription, remainingToDeduct);
      bd.subscription -= takeSub;
      remainingToDeduct -= takeSub;
    }
    if (remainingToDeduct > 0 && bd.purchased > 0) {
      const takePurch = Math.min(bd.purchased, remainingToDeduct);
      bd.purchased -= takePurch;
      remainingToDeduct -= takePurch;
    }

    // Update wallet
    this.wallet.availableCredits = Math.max(0, this.wallet.availableCredits - credits);
    this.wallet.consumedCredits += credits;
    this.wallet.breakdown = bd;

    // Record usage
    const nowStr = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const usageRec: AIUsageRecord = {
      id: `usg-${Date.now()}`,
      timestamp: nowStr,
      operation,
      model: modelId,
      inputTokens,
      outputTokens,
      creditsDeducted: credits,
      costNgnEquivalent: costNgn,
      status: 'completed',
      documentTitle: docTitle,
    };
    this.usageHistory.unshift(usageRec);
    if (this.usageHistory.length > 100) this.usageHistory.pop();

    this.persist();
    return { success: true, creditsDeducted: credits };
  }

  // --- Top-Up Credits (Section 12) ---
  public topUpCredits(bundle: CreditTopUpBundle): boolean {
    const totalAdded = bundle.credits + (bundle.bonusCredits || 0);
    this.wallet.availableCredits += totalAdded;
    this.wallet.totalAllocatedCredits += totalAdded;
    this.wallet.breakdown.purchased += totalAdded;

    const nowStr = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      timestamp: nowStr,
      type: 'top_up',
      credits: totalAdded,
      amountNgn: bundle.priceNgn,
      reference: `PAY-TOPUP-${Date.now().toString().slice(-6)}`,
      description: `${bundle.name} (${totalAdded.toLocaleString()} Credits added)`,
      status: 'success',
    };
    this.walletTransactions.unshift(tx);
    this.persist();
    return true;
  }

  // --- Upgrade or Change Subscription Plan (Section 11) ---
  public changeSubscriptionPlan(newPlanId: SubscriptionPlanId): boolean {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === newPlanId);
    if (!plan) return false;

    this.subscription = {
      planId: newPlanId,
      status: 'active',
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      currentPeriodStart: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };

    // Add plan's monthly allocation to wallet
    this.wallet.availableCredits += plan.monthlyCredits;
    this.wallet.totalAllocatedCredits += plan.monthlyCredits;
    this.wallet.breakdown.subscription += plan.monthlyCredits;

    const nowStr = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      timestamp: nowStr,
      type: 'subscription_grant',
      credits: plan.monthlyCredits,
      amountNgn: plan.priceNgn,
      reference: `SUB-${newPlanId.toUpperCase()}-${Date.now().toString().slice(-6)}`,
      description: `Upgraded to ${plan.name} (${plan.monthlyCredits.toLocaleString()} Credits granted)`,
      status: 'success',
    };
    this.walletTransactions.unshift(tx);
    this.persist();
    return true;
  }

  // ============================================================================
  // 6. REVENUE SHARING (40% Company / 60% User) (Section 13)
  // ============================================================================

  public recordEligibleRevenueTransaction(
    grossAmountNgn: number,
    description: string,
    clientOrPayer: string,
    category: RevenueShareTransaction['category']
  ): RevenueShareTransaction {
    // Configurable 40% company / 60% user split
    const companyShareNgn = Math.round(grossAmountNgn * 0.40);
    const userShareNgn = grossAmountNgn - companyShareNgn; // Exactly 60%

    const nowStr = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const revTx: RevenueShareTransaction = {
      id: `rev-${Date.now()}`,
      timestamp: nowStr,
      description,
      clientOrPayer,
      grossAmountNgn,
      companyShareNgn,
      userShareNgn,
      companyPercent: 40,
      userPercent: 60,
      reference: `REV-ELIG-${Date.now().toString().slice(-6)}`,
      status: 'verified',
      category,
    };

    // Update monetary earnings account (NEVER mixed with AI credits!)
    this.earningsAccount.grossEarningsNgn += grossAmountNgn;
    this.earningsAccount.companyCommissionNgn += companyShareNgn;
    this.earningsAccount.netUserEarningsNgn += userShareNgn;
    this.earningsAccount.availableBalanceNgn += userShareNgn;
    this.earningsAccount.transactions.unshift(revTx);

    this.persist();
    return revTx;
  }

  // --- Request Withdrawal of Earnings ---
  public requestWithdrawal(amountNgn: number): { success: boolean; message: string } {
    if (amountNgn <= 0) {
      return { success: false, message: 'Invalid withdrawal amount.' };
    }
    if (amountNgn > this.earningsAccount.availableBalanceNgn) {
      return {
        success: false,
        message: `Requested amount ₦${amountNgn.toLocaleString()} exceeds available balance ₦${this.earningsAccount.availableBalanceNgn.toLocaleString()}.`,
      };
    }

    this.earningsAccount.availableBalanceNgn -= amountNgn;
    this.earningsAccount.withdrawnAmountNgn += amountNgn;

    this.persist();
    return {
      success: true,
      message: `Withdrawal request for ₦${amountNgn.toLocaleString()} submitted successfully to your verified Nigerian bank account. Settlement is processed within 24 hours.`,
    };
  }
}

// Global Singleton Instance
export const billingManager = new BillingManager();

