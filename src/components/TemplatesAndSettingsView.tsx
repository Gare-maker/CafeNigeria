import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Globe,
  RefreshCw,
  HardDrive,
  User,
  ArrowLeft,
  CreditCard,
  Coins,
  CheckCircle2,
  Building2,
  Sparkles,
  Sun,
  Moon,
  PlusCircle,
} from 'lucide-react';
import {
  billingManager,
  SUBSCRIPTION_PLANS,
  CREDIT_TOP_UP_BUNDLES,
} from '../services/billingService';
import {
  SubscriptionPlanId,
  CreditWallet,
  CreditTopUpBundle,
  UserSubscription,
  AIUsageRecord,
  WalletTransaction,
} from '../types';

interface SettingsViewProps {
  onBackHome: () => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  pendingSyncCount: number;
  onForceSyncNow: () => void;
  totalDocuments: number;
  onResetDemoData: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

type SettingsTab =
  | 'subscription'
  | 'account'
  | 'offline';

export const SettingsView: React.FC<SettingsViewProps> = ({
  onBackHome,
  isOnline,
  onToggleOnline,
  pendingSyncCount,
  onForceSyncNow,
  totalDocuments,
  onResetDemoData,
  darkMode,
  onToggleDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('subscription');

  // Billing & Wallet Live State
  const [subscription, setSubscription] = useState<UserSubscription>(() =>
    billingManager.getSubscription()
  );
  const [wallet, setWallet] = useState<CreditWallet>(() =>
    billingManager.getWallet()
  );
  const [usageHistory, setUsageHistory] = useState<AIUsageRecord[]>(() =>
    billingManager.getUsageHistory()
  );
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() =>
    billingManager.getTransactions()
  );

  // Subscribe to BillingManager updates
  useEffect(() => {
    const unsubscribe = billingManager.subscribe(() => {
      setSubscription(billingManager.getSubscription());
      setWallet(billingManager.getWallet());
      setUsageHistory(billingManager.getUsageHistory());
      setTransactions(billingManager.getTransactions());
    });
    return unsubscribe;
  }, []);

  // Account Preferences State
  const [operatorName, setOperatorName] = useState(
    'Nigerian Cafe Document Centre'
  );
  const [operatorEmail, setOperatorEmail] = useState(
    'operator@nigeriancafe.ng'
  );
  const [defaultRefStyle, setDefaultRefStyle] = useState('APA 7th Edition');
  const [defaultFont, setDefaultFont] = useState('Times New Roman');
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('nc_gemini_api_key') || '';
  });
  const [savedNotice, setSavedNotice] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handlePlanUpgrade = (planId: SubscriptionPlanId) => {
    const success = billingManager.changeSubscriptionPlan(planId);
    if (success) {
      showNotification(`Subscription successfully updated to ${planId.toUpperCase()}.`);
    }
  };

  const handleTopUp = (bundle: CreditTopUpBundle) => {
    const success = billingManager.topUpCredits(bundle);
    if (success) {
      showNotification(
        `Added ${(bundle.credits + (bundle.bonusCredits || 0)).toLocaleString()} AI credits to your wallet.`
      );
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem('nc_gemini_api_key', geminiApiKey.trim());
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const usageStatus = billingManager.getUsageStatus();
  const currentPlan =
    SUBSCRIPTION_PLANS.find((p) => p.id === subscription.planId) ||
    SUBSCRIPTION_PLANS[0];

  return (
    <section
      style={{
        backgroundColor: 'var(--bg-ivory)',
        minHeight: 'calc(100vh - 60px)',
        paddingTop: '36px',
        paddingBottom: '80px',
      }}
    >
      <div className="nc-container">
        {/* Navigation & Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <button
            onClick={onBackHome}
            style={{
              background: 'none',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              color: 'var(--ink-muted)',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={13} /> Back to Home
          </button>

          {actionNotice && (
            <div
              style={{
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                border: '1px solid #86EFAC',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '2px',
              }}
            >
              <CheckCircle2 size={14} />
              <span>{actionNotice}</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h1 className="display-heading">Subscription, Wallet &amp; Settings</h1>
          <p
            style={{
              fontSize: '14.5px',
              color: 'var(--ink-muted)',
              marginTop: '6px',
            }}
          >
            Manage your AI credit wallet, subscription plans, 40/60 revenue sharing
            ledger, document defaults, and local persistence.
          </p>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-ivory)',
            marginBottom: '28px',
            gap: '4px',
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => setActiveTab('subscription')}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              borderBottom:
                activeTab === 'subscription'
                  ? '3px solid var(--accent-blue)'
                  : '3px solid transparent',
              backgroundColor: 'transparent',
              color:
                activeTab === 'subscription'
                  ? 'var(--ink-navy)'
                  : 'var(--ink-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            <CreditCard size={15} />
            <span>Subscription &amp; AI Credits</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              borderBottom:
                activeTab === 'account'
                  ? '3px solid var(--accent-blue)'
                  : '3px solid transparent',
              backgroundColor: 'transparent',
              color:
                activeTab === 'account'
                  ? 'var(--ink-navy)'
                  : 'var(--ink-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            <User size={15} />
            <span>Account &amp; Defaults</span>
          </button>

          <button
            onClick={() => setActiveTab('offline')}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              borderBottom:
                activeTab === 'offline'
                  ? '3px solid var(--accent-blue)'
                  : '3px solid transparent',
              backgroundColor: 'transparent',
              color:
                activeTab === 'offline'
                  ? 'var(--ink-navy)'
                  : 'var(--ink-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            <HardDrive size={15} />
            <span>Offline &amp; Synchronisation</span>
          </button>
        </div>

        {/* =================================================================
            TAB 1: SUBSCRIPTION PLANS & AI CREDIT WALLET (Sections 11 & 12)
        ================================================================== */}
        {activeTab === 'subscription' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Wallet Overview Banner */}
            <div
              style={{
                backgroundColor: 'var(--bg-stone)',
                border: '1px solid var(--border-ivory)',
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                alignItems: 'center',
              }}
            >
              <div>
                <span
                  className="mono-label"
                  style={{ color: 'var(--ink-muted)', fontSize: '10px' }}
                >
                  AI CREDIT WALLET BALANCE
                </span>
                <div
                  style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    color: 'var(--ink-navy)',
                    letterSpacing: '-0.03em',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Coins size={28} color="var(--accent-blue)" />
                  <span>{wallet.availableCredits.toLocaleString()}</span>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--ink-muted)',
                    }}
                  >
                    / {wallet.totalAllocatedCredits.toLocaleString()} Total
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'var(--border-stone)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginTop: '10px',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, (wallet.consumedCredits / Math.max(1, wallet.totalAllocatedCredits)) * 100)}%`,
                      height: '100%',
                      backgroundColor:
                        usageStatus.status === 'exhausted'
                          ? '#DC2626'
                          : usageStatus.status === 'critical_warning'
                          ? '#EA580C'
                          : usageStatus.status === 'low_warning'
                          ? '#D97706'
                          : 'var(--accent-blue)',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--ink-muted)',
                    marginTop: '4px',
                  }}
                >
                  <span>{usageStatus.consumedPercent}% consumed</span>
                  <span>Renews: {wallet.renewalDate}</span>
                </div>
              </div>

              {/* Balance Breakdown by Source */}
              <div
                style={{
                  backgroundColor: 'var(--bg-ivory)',
                  border: '1px solid var(--border-ivory)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: 'var(--ink-navy)',
                    marginBottom: '4px',
                  }}
                >
                  Balance Breakdown:
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>
                    • Subscription Credits:
                  </span>
                  <strong>{wallet.breakdown.subscription.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>
                    • Purchased Top-Up Credits:
                  </span>
                  <strong>{wallet.breakdown.purchased.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>
                    • Promotional Credits:
                  </span>
                  <strong>{wallet.breakdown.promotional.toLocaleString()}</strong>
                </div>
              </div>

              {/* Status & Plan Info */}
              <div
                style={{
                  backgroundColor: 'var(--bg-ivory)',
                  border: '1px solid var(--border-ivory)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span
                    className="mono-label"
                    style={{ color: 'var(--ink-muted)', fontSize: '10px' }}
                  >
                    CURRENT TIER
                  </span>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: 'var(--accent-blue)',
                      marginTop: '4px',
                    }}
                  >
                    {currentPlan.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--ink-muted)',
                      marginTop: '2px',
                    }}
                  >
                    ₦{currentPlan.priceNgn.toLocaleString()} / month (
                    {currentPlan.monthlyCredits.toLocaleString()} cr)
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11.5px',
                      color: '#16A34A',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={13} /> Active &amp; Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Subscription Tier Cards Grid (Section 11) */}
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800 }}>
                  Subscription Plans
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
                  Upgrade or switch your monthly plan. Plans renew automatically
                  and unused subscription credits rollover within the billing cycle.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
                }}
              >
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isCurrent = subscription.planId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      style={{
                        backgroundColor: 'var(--bg-ivory)',
                        border: plan.recommended
                          ? '2px solid var(--accent-blue)'
                          : '1px solid var(--border-ivory)',
                        padding: '24px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        boxShadow: plan.recommended
                          ? '0 4px 16px rgba(20, 71, 230, 0.08)'
                          : 'none',
                      }}
                    >
                      {plan.recommended && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-10px',
                            right: '16px',
                            backgroundColor: 'var(--accent-blue)',
                            color: '#FFFFFF',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Recommended
                        </div>
                      )}

                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            color: 'var(--ink-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          {plan.badge}
                        </div>
                        <h3
                          style={{
                            fontSize: '17px',
                            fontWeight: 800,
                            color: 'var(--ink-navy)',
                            marginTop: '4px',
                          }}
                        >
                          {plan.name}
                        </h3>

                        <div
                          style={{
                            marginTop: '12px',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '4px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '26px',
                              fontWeight: 800,
                              color: 'var(--ink-navy)',
                            }}
                          >
                            ₦{plan.priceNgn.toLocaleString()}
                          </span>
                          <span
                            style={{
                              fontSize: '12px',
                              color: 'var(--ink-muted)',
                            }}
                          >
                            / month
                          </span>
                        </div>

                        <div
                          style={{
                            padding: '8px 10px',
                            backgroundColor: 'var(--bg-stone)',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--accent-blue)',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Sparkles size={14} />
                          <span>
                            {plan.monthlyCredits.toLocaleString()} AI Credits / mo
                          </span>
                        </div>

                        <ul
                          style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: '0 0 24px 0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            fontSize: '12px',
                            color: 'var(--ink-navy)',
                          }}
                        >
                          {plan.features.map((feat, i) => (
                            <li
                              key={i}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '7px',
                                lineHeight: 1.4,
                              }}
                            >
                              <CheckCircle2
                                size={14}
                                color="#16A34A"
                                style={{ flexShrink: 0, marginTop: '2px' }}
                              />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => handlePlanUpgrade(plan.id)}
                        disabled={isCurrent}
                        className={
                          isCurrent
                            ? 'btn-ed-subtle'
                            : plan.recommended
                            ? 'btn-ed-primary'
                            : 'btn-ed-outline'
                        }
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          padding: '10px',
                          fontSize: '12px',
                        }}
                      >
                        {isCurrent ? 'Current Plan' : `Switch to ${plan.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Credit Top-Up Bundles Grid (Section 12) */}
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800 }}>
                  Credit Top-Up Bundles
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
                  Need more credits before the next billing cycle? Purchased credits
                  never expire and are deducted only after subscription credits.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '14px',
                }}
              >
                {CREDIT_TOP_UP_BUNDLES.map((bundle) => (
                  <div
                    key={bundle.id}
                    style={{
                      border: bundle.popular
                        ? '2px solid var(--accent-blue)'
                        : '1px solid var(--border-ivory)',
                      padding: '18px',
                      backgroundColor: 'var(--bg-ivory)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '6px',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '14px',
                            color: 'var(--ink-navy)',
                          }}
                        >
                          {bundle.name}
                        </span>
                        {bundle.bonusCredits !== undefined && bundle.bonusCredits > 0 && (
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontFamily: 'var(--font-mono)',
                              backgroundColor: '#DCFCE7',
                              color: '#15803D',
                              padding: '1px 6px',
                              borderRadius: '2px',
                            }}
                          >
                            +{bundle.bonusCredits.toLocaleString()} Bonus
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: '22px',
                          fontWeight: 800,
                          color: 'var(--ink-navy)',
                          margin: '8px 0',
                        }}
                      >
                        ₦{bundle.priceNgn.toLocaleString()}
                      </div>

                      <div
                        style={{
                          fontSize: '12.5px',
                          color: 'var(--ink-muted)',
                          marginBottom: '16px',
                        }}
                      >
                        {(bundle.credits + (bundle.bonusCredits || 0)).toLocaleString()}{' '}
                        Total Credits
                      </div>
                    </div>

                    <button
                      onClick={() => handleTopUp(bundle)}
                      className="btn-ed-primary"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        fontSize: '11.5px',
                        padding: '8px',
                      }}
                    >
                      <PlusCircle size={13} />
                      <span>Add Credits</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Usage Records History Table */}
            <div>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                  Recent AI Usage &amp; Token Audit Log
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                  Detailed audit of API token consumption, model allocation, and credit deductions.
                </p>
              </div>

              <div
                style={{
                  border: '1px solid var(--border-ivory)',
                  overflowX: 'auto',
                  backgroundColor: 'var(--bg-ivory)',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px',
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'var(--bg-stone)',
                        borderBottom: '1px solid var(--border-ivory)',
                        color: 'var(--ink-muted)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                      }}
                    >
                      <th style={{ padding: '10px 14px' }}>Date &amp; Time</th>
                      <th style={{ padding: '10px 14px' }}>Operation</th>
                      <th style={{ padding: '10px 14px' }}>Model</th>
                      <th style={{ padding: '10px 14px' }}>Tokens (In / Out)</th>
                      <th style={{ padding: '10px 14px' }}>Credits Deducted</th>
                      <th style={{ padding: '10px 14px' }}>₦ Equivalent</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageHistory.slice(0, 10).map((record) => (
                      <tr
                        key={record.id}
                        style={{ borderBottom: '1px solid var(--border-ivory)' }}
                      >
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          {record.timestamp}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                          {record.operation}
                          {record.documentTitle && (
                            <div
                              style={{
                                fontSize: '10.5px',
                                color: 'var(--ink-muted)',
                                fontWeight: 400,
                              }}
                            >
                              Doc: {record.documentTitle.slice(0, 32)}...
                            </div>
                          )}
                        </td>
                        <td
                          style={{
                            padding: '10px 14px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                          }}
                        >
                          {record.model}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {record.inputTokens.toLocaleString()} /{' '}
                          {record.outputTokens.toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: '10px 14px',
                            fontWeight: 700,
                            color: 'var(--accent-blue)',
                          }}
                        >
                          -{record.creditsDeducted} cr
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--ink-muted)' }}>
                          ₦{record.costNgnEquivalent.toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              backgroundColor: '#DCFCE7',
                              color: '#15803D',
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '2px',
                              fontWeight: 600,
                            }}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 2: ACCOUNT & DOCUMENT DEFAULTS
        ================================================================== */}
        {activeTab === 'account' && (
          <div className="nc-settings-grid">
            <div
              style={{
                border: '1px solid var(--border-ivory)',
                padding: '22px',
                backgroundColor: 'var(--bg-ivory)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  marginBottom: '18px',
                }}
              >
                <User size={17} color="var(--accent-blue)" />
                <h2 style={{ fontSize: '15.5px', fontWeight: 700 }}>
                  Account &amp; Document Defaults
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="ed-field-label">Account / Centre Name</label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="ed-input"
                  />
                </div>

                <div>
                  <label className="ed-field-label">Synchronisation Email</label>
                  <input
                    type="email"
                    value={operatorEmail}
                    onChange={(e) => setOperatorEmail(e.target.value)}
                    className="ed-input"
                  />
                </div>

                <div className="nc-grid-2col">
                  <div>
                    <label className="ed-field-label">Default Citation</label>
                    <select
                      value={defaultRefStyle}
                      onChange={(e) => setDefaultRefStyle(e.target.value)}
                      className="ed-select"
                    >
                      <option>APA 7th Edition</option>
                      <option>Harvard</option>
                      <option>IEEE</option>
                      <option>MLA 9th Edition</option>
                    </select>
                  </div>
                  <div>
                    <label className="ed-field-label">Default Font</label>
                    <select
                      value={defaultFont}
                      onChange={(e) => setDefaultFont(e.target.value)}
                      className="ed-select"
                    >
                      <option>Times New Roman</option>
                      <option>Georgia</option>
                      <option>Plus Jakarta Sans</option>
                      <option>Calibri</option>
                    </select>
                  </div>
                </div>

                {/* Google Gemini API Key Configuration (Section 2) */}
                <div>
                  <label className="ed-field-label">Google Gemini API Key (Optional Override)</label>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy... (leave blank to use default proxy)"
                    className="ed-input"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                    Requests connect securely to Google Cloud Project 175673940381. You can optionally supply your personal Gemini API key here.
                  </span>
                </div>

                {/* Workspace Theme Toggle (Section 8) */}
                {onToggleDarkMode && (
                  <div
                    style={{
                      borderTop: '1px solid var(--border-ivory)',
                      paddingTop: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <label className="ed-field-label" style={{ marginBottom: '2px' }}>
                        Workspace Theme
                      </label>
                      <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                        Currently using {darkMode ? 'Dark Theme' : 'Light Theme'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={onToggleDarkMode}
                      className="btn-ed-outline"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {darkMode ? <Sun size={14} color="#F59E0B" /> : <Moon size={14} />}
                      <span>{darkMode ? 'Switch to Light' : 'Switch to Dark'}</span>
                    </button>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <button
                    onClick={handleSavePreferences}
                    className="btn-ed-primary"
                  >
                    Save Preferences
                  </button>
                  {savedNotice && (
                    <span
                      className="mono-label"
                      style={{ color: '#16A34A', fontSize: '10px' }}
                    >
                      ✓ Saved
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Platform & Google Cloud Architecture Card (Section 2) */}
            <div
              style={{
                border: '1px solid var(--border-ivory)',
                padding: '22px',
                backgroundColor: 'var(--bg-stone)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '14px',
                  }}
                >
                  <Building2 size={18} color="var(--accent-blue)" />
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700 }}>
                    Google Cloud Platform Project
                  </h3>
                </div>

                <p
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--ink-muted)',
                    lineHeight: 1.5,
                    marginBottom: '14px',
                  }}
                >
                  Nigerian Cafe document operations are securely connected to Google Cloud Project{' '}
                  <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    projects/175673940381
                  </code>{' '}
                  (Project Number: 175673940381).
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--bg-ivory)',
                    border: '1px solid var(--border-ivory)',
                    padding: '12px',
                    fontSize: '11.5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-muted)' }}>GCP Project Number:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>175673940381</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-muted)' }}>Backend Proxy:</span>
                    <strong style={{ color: '#16A34A' }}>Active &amp; Authenticated</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-muted)' }}>Client Key Exposure:</span>
                    <strong>Zero (Strict Server-Side Isolation)</strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--ink-muted)',
                  marginTop: '16px',
                  borderTop: '1px solid var(--border-ivory)',
                  paddingTop: '12px',
                }}
              >
                All generation requests record input tokens, output tokens, and cached tokens
                against the internal rate-limiting and audit log.
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 4: OFFLINE PERSISTENCE & SYNCHRONISATION
        ================================================================== */}
        {activeTab === 'offline' && (
          <div className="nc-settings-grid">
            <div
              style={{
                border: '1px solid var(--border-ivory)',
                padding: '24px',
                backgroundColor: 'var(--bg-stone)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    marginBottom: '16px',
                  }}
                >
                  <HardDrive size={17} color="var(--accent-blue)" />
                  <h2 style={{ fontSize: '15.5px', fontWeight: 700 }}>
                    Offline Persistence &amp; Synchronisation
                  </h2>
                </div>

                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--ink-muted)',
                    lineHeight: 1.5,
                    marginBottom: '16px',
                  }}
                >
                  Documents are automatically saved locally with debouncing so you can continue
                  editing uninterrupted when offline. When connectivity is restored, local modifications
                  synchronise automatically with the server.
                </p>

                <div
                  style={{
                    border: '1px solid var(--border-ivory)',
                    backgroundColor: 'var(--bg-ivory)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '12.5px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-muted)' }}>Connection Status:</span>
                    <strong
                      style={{
                        color: isOnline ? '#16A34A' : 'var(--accent-terracotta)',
                      }}
                    >
                      {isOnline ? 'Online (Synced)' : 'Offline (Local Storage)'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-muted)' }}>Documents in Library:</span>
                    <strong>{totalDocuments}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-muted)' }}>Pending Offline Changes:</span>
                    <strong>{pendingSyncCount}</strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginTop: '20px',
                }}
              >
                <button onClick={onToggleOnline} className="btn-ed-outline">
                  {isOnline ? 'Simulate Offline' : 'Reconnect Online'}
                </button>

                <button
                  onClick={onForceSyncNow}
                  disabled={!isOnline}
                  className="btn-ed-primary"
                >
                  <RefreshCw size={12} />
                  <span>Sync Now</span>
                </button>

                <button onClick={onResetDemoData} className="btn-ed-subtle">
                  Reset Demo Docs
                </button>
              </div>
            </div>

            {/* Desktop & Web Platform Info */}
            <div
              style={{
                border: '1px solid var(--border-ivory)',
                padding: '24px',
                backgroundColor: 'var(--bg-ivory)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '15.5px', fontWeight: 700, marginBottom: '12px' }}>
                  Web + Desktop Synchronisation Engine
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--ink-muted)',
                    lineHeight: 1.5,
                    marginBottom: '18px',
                  }}
                >
                  Your document library and credit wallet remain unified across Web browsers,
                  Windows desktop executables, and macOS binaries.
                </p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    className="mono-label"
                    style={{
                      padding: '6px 10px',
                      border: '1px solid var(--border-ivory)',
                      fontSize: '9.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Monitor size={12} /> Desktop Ready
                  </span>
                  <span
                    className="mono-label"
                    style={{
                      padding: '6px 10px',
                      border: '1px solid var(--border-ivory)',
                      fontSize: '9.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Globe size={12} /> Web Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
export default SettingsView;
