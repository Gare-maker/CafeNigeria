import React, { useState } from 'react';
import { DocumentCategory } from '../types';

interface LandingViewProps {
  onOpenDashboard: () => void;
  onOpenCreateModal: (category: DocumentCategory) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onOpenDashboard,
  onOpenCreateModal,
}) => {
  const [billingMode, setBillingMode] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div>
      {/* =====================================================================
          SECTION 1: WARM STONE EDITORIAL + TERRACOTTA QUOTES (Exact Image 4)
      ===================================================================== */}
      <section
        style={{
          backgroundColor: 'var(--bg-stone)',
          borderBottom: '1px solid var(--border-stone)',
          padding: '72px 28px 84px 28px',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '28px',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div className="mono-eyebrow">PRODUCT VISION &amp; FIELD IMPACT</div>
            <button onClick={onOpenDashboard} className="btn-ed-primary">
              RETURN TO LIVE DASHBOARD
            </button>
          </div>

          {/* Editorial Visual Banner Frame (Modeled after Image 4's photography block) */}
          <div
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-navy)',
              border: '1px solid var(--border-stone)',
              padding: '52px 48px',
              color: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '36px',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  className="mono-label"
                  style={{
                    color: 'var(--status-green-text)',
                    fontSize: '10px',
                    marginBottom: '14px',
                  }}
                >
                  AI-POWERED DOCUMENT CREATION PLATFORM • WEB + DESKTOP
                </div>
                <h1
                  className="display-heading-white"
                  style={{ fontSize: '2.55rem' }}
                >
                  Choose a document type, provide your instructions, generate
                  with AI, edit freely and export professionally.
                </h1>
                <p
                  style={{
                    marginTop: '18px',
                    fontSize: '14.5px',
                    color: 'rgba(255,255,255,0.78)',
                    lineHeight: 1.6,
                  }}
                >
                  Designed for cyber cafe operators, business centre operators,
                  university students and general document users across Web,
                  Windows Desktop and macOS Desktop.
                </p>
              </div>

              {/* Architectural Spec Box */}
              <div
                style={{
                  border: '1px solid var(--border-navy)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  padding: '24px',
                }}
              >
                <div
                  className="mono-label"
                  style={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: '14px',
                  }}
                >
                  SUGGESTED TECHNICAL ARCHITECTURE (PRD SEC. 11)
                </div>
                {[
                  ['Frontend', 'React / Next.js + TypeScript'],
                  ['Desktop Framework', 'Tauri (Windows, macOS, Linux)'],
                  ['Rich Text Editor', 'Multi-Page Word-Style Canvas'],
                  ['Cloud & Auth', 'Supabase + PostgreSQL'],
                  ['Local Persistence', 'SQLite + Custom Offline Sync'],
                  ['Document Export', 'Editable DOCX, PDF & TXT'],
                ].map(([layer, tech], idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '9px 0',
                      borderBottom:
                        idx < 5 ? '1px solid var(--border-navy)' : 'none',
                      fontSize: '12.5px',
                    }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {layer}
                    </span>
                    <span style={{ fontWeight: 600, color: '#FFFFFF' }}>
                      {tech}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="mono-label"
            style={{
              fontSize: '9.5px',
              color: 'var(--ink-muted)',
              marginTop: '12px',
              letterSpacing: '0.16em',
            }}
          >
            PLATFORM ARCHITECTURE • CYBER CAFE &amp; CAMPUS EDITION
          </div>

          {/* 2-Column Quote Grid with Terracotta Quote Marks (Exact Image 4 Bottom Grid) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              borderTop: '1px solid var(--border-stone)',
              borderBottom: '1px solid var(--border-stone)',
              borderRight: '1px solid var(--border-stone)',
              marginTop: '48px',
            }}
          >
            <div
              style={{
                padding: '36px 36px 36px 0',
                borderRight: '1px solid var(--border-stone)',
              }}
            >
              <div
                style={{
                  color: 'var(--accent-terracotta)',
                  fontSize: '36px',
                  fontWeight: 900,
                  lineHeight: 1,
                  fontFamily: 'Georgia, serif',
                }}
              >
                ”
              </div>
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--ink-navy)',
                  lineHeight: 1.4,
                  marginTop: '12px',
                  maxWidth: '380px',
                }}
              >
                Project chapters and seminar papers that took two days of
                manual typing now take fifteen minutes.
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginTop: '24px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    backgroundColor: 'var(--bg-navy)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  CC
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--ink-navy)',
                    }}
                  >
                    Engr. Osaze Ogiemwonyi
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--ink-muted)',
                      marginTop: '2px',
                    }}
                  >
                    Managing Operator — Campus Business &amp; Document Centre,
                    Ugbowo
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '36px 32px' }}>
              <div
                style={{
                  color: 'var(--accent-terracotta)',
                  fontSize: '36px',
                  fontWeight: 900,
                  lineHeight: 1,
                  fontFamily: 'Georgia, serif',
                }}
              >
                ”
              </div>
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--ink-navy)',
                  lineHeight: 1.4,
                  marginTop: '12px',
                  maxWidth: '380px',
                }}
              >
                Students snap handwritten whiteboard notes and export clean
                Word revision guides without losing formatting.
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginTop: '24px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    backgroundColor: 'var(--accent-blue)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  UN
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--ink-navy)',
                    }}
                  >
                    Dr. Chinwe Nwachukwu
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--ink-muted)',
                      marginTop: '2px',
                    }}
                  >
                    Academic Seminar Coordinator — Faculty of Social Sciences
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 2: 4-COLUMN PLANS & DEVELOPMENT PHASES (Exact Image 5)
      ===================================================================== */}
      <section
        style={{
          backgroundColor: 'var(--bg-ivory)',
          padding: '84px 28px',
          borderBottom: '1px solid var(--border-ivory)',
        }}
      >
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          {/* Segmented Toggle Bar + Terracotta Promo Label (Exact match to Image 5) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '44px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                border: '1px solid var(--border-stone)',
              }}
            >
              <button
                onClick={() => setBillingMode('monthly')}
                className="mono-label"
                style={{
                  padding: '11px 18px',
                  fontSize: '10px',
                  border: 'none',
                  backgroundColor:
                    billingMode === 'monthly' ? 'var(--bg-navy)' : 'transparent',
                  color:
                    billingMode === 'monthly' ? '#FFFFFF' : 'var(--ink-muted)',
                  cursor: 'pointer',
                }}
              >
                OPERATOR PLANS
              </button>
              <button
                onClick={() => setBillingMode('annual')}
                className="mono-label"
                style={{
                  padding: '11px 18px',
                  fontSize: '10px',
                  border: 'none',
                  backgroundColor:
                    billingMode === 'annual' ? 'var(--bg-navy)' : 'transparent',
                  color:
                    billingMode === 'annual' ? '#FFFFFF' : 'var(--ink-muted)',
                  cursor: 'pointer',
                }}
              >
                PRD ROADMAP (PHASES 1 – 4)
              </button>
            </div>

            <span
              className="mono-label"
              style={{
                fontSize: '10px',
                color: 'var(--accent-terracotta)',
                fontWeight: 600,
              }}
            >
              WEB + WINDOWS &amp; MACOS DESKTOP INCLUDED
            </span>
          </div>

          {/* 4-Column Crisp Bordered Cards (Exact match to Image 5) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))',
              gap: '20px',
            }}
          >
            {[
              {
                name:
                  billingMode === 'monthly'
                    ? 'Student Starter'
                    : 'Phase 1: Foundation',
                sub:
                  billingMode === 'monthly'
                    ? 'INDIVIDUAL STUDENTS'
                    : 'CORE WORKSPACE & EXPORT',
                price: billingMode === 'monthly' ? 'Free' : 'Phase 01',
                unit:
                  billingMode === 'monthly'
                    ? '14-day full access'
                    : 'Foundation Scope',
                countLabel: '6 CAPABILITIES INCLUDED',
                features: [
                  'Homepage & Main Navigation',
                  '5 Document Category Cards',
                  'Rich-Text Document Workspace',
                  'AI Assistant Panel & Insertion',
                  'Automatic Document Saving',
                  'DOCX, PDF & TXT Export',
                ],
                more: '+ 2 MORE',
                cta: 'START FREE',
                cat: 'assignments' as DocumentCategory,
              },
              {
                name:
                  billingMode === 'monthly'
                    ? 'Campus Scholar'
                    : 'Phase 2: AI Generation',
                sub:
                  billingMode === 'monthly'
                    ? 'FINAL YEAR & SEMINARS'
                    : 'ALL 5 AI WORKFLOWS',
                price: billingMode === 'monthly' ? '₦2,500' : 'Phase 02',
                unit:
                  billingMode === 'monthly'
                    ? 'per student / semester'
                    : 'Generation Scope',
                countLabel: '6 WORKFLOWS INCLUDED',
                features: [
                  'Assignment AI Generation',
                  'Project Chapter 1–5 Builder',
                  'Seminar Paper Generation',
                  'ATS CV / Resume Builder',
                  'Image-to-Notes OCR Studio',
                  'APA / IEEE / Harvard Citations',
                ],
                more: '+ 4 MORE',
                cta: 'GET STARTED',
                cat: 'projects' as DocumentCategory,
              },
              {
                name:
                  billingMode === 'monthly'
                    ? 'Cyber Cafe Pro'
                    : 'Phase 3: Desktop & Offline',
                sub:
                  billingMode === 'monthly'
                    ? '1 – 10 OPERATOR TERMINALS'
                    : 'TAURI + SQLITE SYNC',
                price: billingMode === 'monthly' ? '₦8,500' : 'Phase 03',
                unit:
                  billingMode === 'monthly'
                    ? 'per centre / month'
                    : 'Offline Scope',
                countLabel: '8 CAPABILITIES INCLUDED',
                features: [
                  'Tauri Desktop Packaging',
                  'SQLite Local Database',
                  'Offline Document Access',
                  'Offline Rich-Text Editing',
                  'Local DOCX & PDF Exports',
                  'Automatic Cloud Synchronisation',
                ],
                more: '+ 6 MORE',
                cta: 'GET STARTED',
                cat: 'seminars' as DocumentCategory,
              },
              {
                name:
                  billingMode === 'monthly'
                    ? 'Business Centre Hub'
                    : 'Phase 4: Enterprise AI',
                sub:
                  billingMode === 'monthly'
                    ? 'UNLIMITED OPERATOR TERMINALS'
                    : 'ADVANCED AUTOMATION',
                price: billingMode === 'monthly' ? '₦15,000' : 'Phase 04',
                unit:
                  billingMode === 'monthly'
                    ? 'per centre / month'
                    : 'Expansion Scope',
                countLabel: '10 CAPABILITIES INCLUDED',
                features: [
                  'Bulk Document Generation',
                  'Institutional Formatting Presets',
                  'Document Version History',
                  'Batch Image OCR Processing',
                  'Advanced Templates Library',
                  'Multi-Device Cloud Library',
                ],
                more: '+ 9 MORE',
                cta: 'GET STARTED',
                cat: 'cv' as DocumentCategory,
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border-ivory)',
                  backgroundColor: 'var(--bg-ivory)',
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'var(--ink-navy)',
                    }}
                  >
                    {plan.name}
                  </h3>
                  <div
                    className="mono-label"
                    style={{
                      fontSize: '9.5px',
                      color: 'var(--ink-muted)',
                      marginTop: '6px',
                      paddingBottom: '18px',
                      borderBottom: '1px solid var(--border-ivory)',
                    }}
                  >
                    {plan.sub}
                  </div>

                  <div
                    style={{
                      fontSize: '30px',
                      fontWeight: 800,
                      color: 'var(--ink-navy)',
                      letterSpacing: '-0.03em',
                      marginTop: '20px',
                    }}
                  >
                    {plan.price}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--ink-muted)',
                      marginTop: '4px',
                    }}
                  >
                    {plan.unit}
                  </div>

                  <div
                    className="mono-label"
                    style={{
                      fontSize: '9.5px',
                      color: 'var(--ink-muted)',
                      marginTop: '24px',
                      marginBottom: '14px',
                    }}
                  >
                    {plan.countLabel}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {plan.features.map((feat, fIdx) => (
                      <div
                        key={fIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          fontSize: '12.5px',
                          color: 'var(--ink-body)',
                        }}
                      >
                        <span
                          style={{
                            color: 'var(--accent-terracotta)',
                            fontWeight: 700,
                            fontSize: '12px',
                          }}
                        >
                          ✓
                        </span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="mono-label"
                    style={{
                      fontSize: '9.5px',
                      color: 'var(--ink-muted)',
                      marginTop: '18px',
                      textDecoration: 'underline',
                      textUnderlineOffset: '4px',
                    }}
                  >
                    {plan.more}
                  </div>
                </div>

                <button
                  onClick={() => onOpenCreateModal(plan.cat)}
                  className="btn-ed-outline"
                  style={{
                    width: '100%',
                    marginTop: '32px',
                    padding: '12px 16px',
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

