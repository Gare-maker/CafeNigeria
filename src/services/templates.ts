import { DocumentCategory, DocumentItem, PageLayoutSettings } from '../types';

export interface CoverPageDesign {
  id: string;
  category: DocumentCategory | 'all';
  name: string;
  description: string;
  previewBg: string;
  accentColor: string;
  renderHtml: (title: string, meta: Partial<DocumentItem['metadata']>) => string;
}

export interface WorkspaceTemplate {
  id: string;
  category: DocumentCategory;
  name: string;
  description: string;
  badge: string;
  sections: string[];
  defaultCoverId: string;
  generateBodyHtml: (title: string, meta: Partial<DocumentItem['metadata']>) => string[];
}

// ============================================================================
// 1. COVER PAGE DESIGNS (CATEGORY-SPECIFIC WITH VISUAL STYLES)
// ============================================================================

export const COVER_PAGE_DESIGNS: CoverPageDesign[] = [
  // --- ASSIGNMENT COVERS ---
  {
    id: 'cover-assignment-classic',
    category: 'assignments',
    name: 'Academic Classic',
    description: 'Traditional Nigerian university coursework layout with framed borders and centered details.',
    previewBg: '#F8FAFC',
    accentColor: '#1447E6',
    renderHtml: (title, meta) => `
      <div style="border: 2px solid #0D1B4C; padding: 48px 36px; min-height: 980px; display: flex; flex-direction: column; justify-content: space-between; text-align: center; font-family: 'Times New Roman', Georgia, serif;">
        <div>
          <p style="font-size: 13pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #0D1B4C;">
            ${(meta.institution || 'UNIVERSITY OF BENIN / UNILAG / OAU').toUpperCase()}
          </p>
          <p style="font-size: 11pt; color: #475569; margin-top: 6px; text-transform: uppercase;">
            ${(meta.department || 'FACULTY OF PHYSICAL SCIENCES / SOCIAL SCIENCES').toUpperCase()}
          </p>
          <div style="width: 80px; height: 2px; background-color: #1447E6; margin: 18px auto 0;"></div>
        </div>

        <div style="margin: 40px 0;">
          <p style="font-size: 11pt; font-weight: 600; letter-spacing: 0.15em; color: #1447E6; text-transform: uppercase; margin-bottom: 12px;">
            COURSEWORK ASSIGNMENT
          </p>
          <h1 style="font-size: 22pt; font-weight: 800; color: #0D1B4C; line-height: 1.35; margin: 0 0 16px; text-transform: uppercase;">
            ${title || 'TITLE OF ACADEMIC ASSIGNMENT'}
          </h1>
          <p style="font-size: 12.5pt; font-weight: 700; color: #334155;">
            COURSE CODE: ${meta.courseCode || 'CRS 301'} — ${meta.course || 'ACADEMIC COURSE TITLE'}
          </p>
        </div>

        <div style="background-color: #F8FAFC; border: 1px solid #CBD5E1; padding: 22px; max-width: 480px; margin: 0 auto; width: 100%; text-align: left;">
          <table style="width: 100%; border: none; font-size: 11pt; line-height: 1.8;">
            <tr>
              <td style="font-weight: 700; width: 40%; color: #0D1B4C; border: none; padding: 3px 0;">STUDENT NAME:</td>
              <td style="color: #1E293B; border: none; padding: 3px 0;">${meta.studentName || 'Candidate Name'}</td>
            </tr>
            <tr>
              <td style="font-weight: 700; color: #0D1B4C; border: none; padding: 3px 0;">MATRIC NO:</td>
              <td style="color: #1E293B; border: none; padding: 3px 0;">${meta.matricNo || 'U2024/0000000'}</td>
            </tr>
            <tr>
              <td style="font-weight: 700; color: #0D1B4C; border: none; padding: 3px 0;">LECTURER:</td>
              <td style="color: #1E293B; border: none; padding: 3px 0;">${meta.lecturerOrSupervisor || 'Dr. Supervisor / Course Lecturer'}</td>
            </tr>
            <tr>
              <td style="font-weight: 700; color: #0D1B4C; border: none; padding: 3px 0;">DATE:</td>
              <td style="color: #1E293B; border: none; padding: 3px 0;">${meta.submissionDate || 'NOVEMBER, 2026'}</td>
            </tr>
          </table>
        </div>
      </div>
    `,
  },
  {
    id: 'cover-assignment-modern',
    category: 'assignments',
    name: 'Modern Accent Strip',
    description: 'Clean contemporary design with a bold left blue accent bar and prominent metadata card.',
    previewBg: '#EFF6FF',
    accentColor: '#1447E6',
    renderHtml: (title, meta) => `
      <div style="display: flex; min-height: 980px; font-family: 'Plus Jakarta Sans', Inter, sans-serif;">
        <div style="width: 18px; background-color: #1447E6; margin-right: 32px; border-radius: 2px;"></div>
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 40px 10px 40px 0;">
          <div>
            <p style="font-size: 10pt; font-weight: 700; letter-spacing: 0.12em; color: #1447E6; text-transform: uppercase;">
              ${meta.institution || 'FEDERAL UNIVERSITY / STATE UNIVERSITY'}
            </p>
            <p style="font-size: 12pt; font-weight: 600; color: #475569; margin-top: 4px;">
              ${meta.department || 'Department of General Studies'}
            </p>
          </div>

          <div style="margin: 60px 0;">
            <span style="background-color: #EEF2FF; color: #1447E6; padding: 5px 12px; font-size: 10pt; font-weight: 700; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.08em;">
              ${meta.courseCode || 'COURSE ASSIGNMENT'}
            </span>
            <h1 style="font-size: 26pt; font-weight: 800; color: #0D1B4C; line-height: 1.25; margin: 18px 0 14px;">
              ${title || 'Assignment Topic and Research Report'}
            </h1>
            <p style="font-size: 13pt; color: #334155;">
              ${meta.course ? `Course: ${meta.course}` : 'Academic Coursework Submission'}
            </p>
          </div>

          <div style="border-top: 2px solid #E2E8F0; padding-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="font-size: 9pt; text-transform: uppercase; color: #64748B; font-weight: 700;">Submitted By</p>
              <p style="font-size: 12pt; font-weight: 700; color: #0D1B4C; margin-top: 3px;">${meta.studentName || 'Student Name'}</p>
              <p style="font-size: 10pt; color: #475569;">Matric: ${meta.matricNo || '00/0000'}</p>
            </div>
            <div>
              <p style="font-size: 9pt; text-transform: uppercase; color: #64748B; font-weight: 700;">Submitted To</p>
              <p style="font-size: 12pt; font-weight: 700; color: #0D1B4C; margin-top: 3px;">${meta.lecturerOrSupervisor || 'Course Lecturer'}</p>
              <p style="font-size: 10pt; color: #475569;">Date: ${meta.submissionDate || 'November 2026'}</p>
            </div>
          </div>
        </div>
      </div>
    `,
  },

  // --- PROJECT COVERS ---
  {
    id: 'cover-project-standard',
    category: 'projects',
    name: 'National Standard University Project',
    description: 'Complies with Nigerian NUC undergraduate and postgraduate project title page standards.',
    previewBg: '#FFFFFF',
    accentColor: '#0A194E',
    renderHtml: (title, meta) => `
      <div style="min-height: 1000px; display: flex; flex-direction: column; justify-content: space-between; text-align: center; font-family: 'Times New Roman', Georgia, serif; padding: 40px 20px;">
        <div>
          <h1 style="font-size: 17pt; font-weight: 800; color: #0A194E; text-transform: uppercase; line-height: 1.45; max-width: 650px; margin: 20px auto 0;">
            ${title || 'IMPACT OF INFORMATION SYSTEMS ON PERFORMANCE IN NIGERIA'}
          </h1>
        </div>

        <div style="margin: 40px auto; max-width: 580px;">
          <p style="font-size: 12pt; margin-bottom: 8px;">BY</p>
          <p style="font-size: 14pt; font-weight: 800; color: #0D1B4C; text-transform: uppercase; letter-spacing: 0.05em;">
            ${(meta.studentName || 'SURNAME FIRSTNAME MIDDLENAME').toUpperCase()}
          </p>
          <p style="font-size: 11pt; color: #334155; margin-top: 4px;">
            MATRIC NO: ${meta.matricNo || 'RUN/2021/10488'}
          </p>

          <p style="font-size: 11.5pt; line-height: 1.6; margin-top: 40px; color: #1E293B;">
            A RESEARCH PROJECT SUBMITTED TO THE DEPARTMENT OF ${(meta.department || 'COMPUTER SCIENCE').toUpperCase()},<br/>
            FACULTY OF SCIENCE, ${(meta.institution || 'UNIVERSITY OF LAGOS / BENIN').toUpperCase()}<br/>
            IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE AWARD OF THE DEGREE OF BACHELOR OF SCIENCE (B.SC. HONS)
          </p>
        </div>

        <div>
          <p style="font-size: 12pt; font-weight: 700; color: #0D1B4C;">SUPERVISOR: ${(meta.lecturerOrSupervisor || 'PROF. O. K. ADELEKE').toUpperCase()}</p>
          <p style="font-size: 12pt; font-weight: 800; margin-top: 14px; letter-spacing: 0.08em;">NOVEMBER, 2026</p>
        </div>
      </div>
    `,
  },
  {
    id: 'cover-project-executive',
    category: 'projects',
    name: 'Executive Monogram Frame',
    description: 'Gold & Navy formal double border suitable for thesis, capstone projects, and final defense submissions.',
    previewBg: '#F8FAFC',
    accentColor: '#D97706',
    renderHtml: (title, meta) => `
      <div style="border: 4px double #1E3A8A; padding: 40px 30px; min-height: 980px; display: flex; flex-direction: column; justify-content: space-between; text-align: center; font-family: 'Georgia', serif;">
        <div>
          <p style="font-size: 14pt; font-weight: 800; color: #1E3A8A; letter-spacing: 0.12em; text-transform: uppercase;">
            ${(meta.institution || 'TERTIARY RESEARCH INSTITUTE').toUpperCase()}
          </p>
          <p style="font-size: 11pt; color: #64748B; margin-top: 4px; text-transform: uppercase;">
            ${(meta.department || 'POSTGRADUATE SCHOOL').toUpperCase()}
          </p>
          <div style="width: 60px; height: 3px; background-color: #D97706; margin: 16px auto;"></div>
        </div>

        <div style="margin: 40px 0;">
          <h1 style="font-size: 21pt; font-weight: 800; color: #0F172A; line-height: 1.35; text-transform: uppercase;">
            ${title || 'COMPREHENSIVE RESEARCH DISSERTATION'}
          </h1>
          <div style="margin-top: 26px;">
            <p style="font-size: 11pt; color: #475569;">SUBMITTED BY</p>
            <p style="font-size: 13.5pt; font-weight: 700; color: #1E3A8A; margin-top: 4px;">${meta.studentName || 'Candidate Name'}</p>
          </div>
        </div>

        <div style="border-top: 1px solid #E2E8F0; padding-top: 20px;">
          <p style="font-size: 11pt; color: #334155;">SUPERVISED BY: <strong>${meta.lecturerOrSupervisor || 'Dr. Supervisor'}</strong></p>
          <p style="font-size: 11pt; font-weight: 700; margin-top: 8px; color: #0F172A;">2026 ACADEMIC SESSION</p>
        </div>
      </div>
    `,
  },

  // --- SEMINAR COVERS ---
  {
    id: 'cover-seminar-academic',
    category: 'seminars',
    name: 'Symposium & Seminar Banner',
    description: 'Designed specifically for academic seminar paper presentations and departmental colloquiums.',
    previewBg: '#F1F5F9',
    accentColor: '#059669',
    renderHtml: (title, meta) => `
      <div style="min-height: 980px; display: flex; flex-direction: column; justify-content: space-between; font-family: 'Plus Jakarta Sans', Inter, sans-serif; text-align: center; padding: 48px 30px;">
        <div style="background-color: #047857; color: #FFFFFF; padding: 18px 24px; border-radius: 4px;">
          <p style="font-size: 11pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;">
            DEPARTMENTAL SEMINAR PRESENTATION
          </p>
          <p style="font-size: 12.5pt; margin-top: 4px; opacity: 0.95;">
            ${meta.department || 'Department of Pure & Applied Sciences'}, ${meta.institution || 'University of Benin'}
          </p>
        </div>

        <div style="margin: 50px 0;">
          <h1 style="font-size: 24pt; font-weight: 800; color: #064E3B; line-height: 1.3; text-transform: uppercase; margin-bottom: 20px;">
            ${title || 'EMERGING FRONTIERS IN ACADEMIC RESEARCH'}
          </h1>
          <p style="font-size: 12pt; color: #475569; max-width: 540px; margin: 0 auto;">
            A Seminar Paper Presented in Partial Fulfillment of the Requirements for Course Credit
          </p>
        </div>

        <div style="border: 1px solid #CBD5E1; background-color: #FFFFFF; padding: 22px; max-width: 480px; margin: 0 auto; width: 100%; border-radius: 4px;">
          <p style="font-size: 12pt; font-weight: 700; color: #0F172A;">PRESENTER: ${meta.studentName || 'Candidate Name'}</p>
          <p style="font-size: 10.5pt; color: #64748B; margin-top: 2px;">Matric: ${meta.matricNo || 'UNN/2022/4911'}</p>
          <div style="border-top: 1px solid #E2E8F0; margin: 12px 0;"></div>
          <p style="font-size: 11pt; color: #334155;">SEMINAR COORDINATOR: <strong>${meta.lecturerOrSupervisor || 'Dr. Coordinator'}</strong></p>
          <p style="font-size: 10.5pt; color: #64748B; margin-top: 4px;">Date: ${meta.submissionDate || 'November 2026'}</p>
        </div>
      </div>
    `,
  },

  // --- CV / RESUME HEADERS ---
  {
    id: 'cover-cv-executive',
    category: 'cv',
    name: 'Executive Two-Tone Header',
    description: 'Modern two-column professional CV banner layout with skills highlights and clear contact badges.',
    previewBg: '#0A194E',
    accentColor: '#1447E6',
    renderHtml: (title, meta) => `
      <div style="background-color: #0A194E; color: #FFFFFF; padding: 36px 32px; border-radius: 4px; margin-bottom: 24px; font-family: 'Plus Jakarta Sans', sans-serif;">
        <h1 style="font-size: 24pt; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.02em; color: #FFFFFF;">
          ${(meta.studentName || title || 'OSAHON EGHOSA VICTOR').toUpperCase()}
        </h1>
        <p style="font-size: 13pt; color: #93C5FD; font-weight: 600; margin: 0 0 14px 0;">
          ${meta.course || 'DATA ANALYST & OPERATIONS SPECIALIST'}
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 14px; font-size: 10.5pt; color: #E2E8F0; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 12px;">
          <span>📍 Lagos / Benin City, Nigeria</span>
          <span>📞 +234 813 000 0000</span>
          <span>✉️ candidate@email.com</span>
          <span>🔗 linkedin.com/in/candidate</span>
        </div>
      </div>
    `,
  },

  // --- FREE-FORM WRITING COVERS ---
  {
    id: 'cover-free-editorial',
    category: 'free-writing',
    name: 'Editorial Whitepaper Title Page',
    description: 'Clean publishing layout ideal for essays, reports, proposals, opinion pieces and policy briefs.',
    previewBg: '#F8FAFC',
    accentColor: '#0A194E',
    renderHtml: (title, meta) => `
      <div style="min-height: 960px; display: flex; flex-direction: column; justify-content: space-between; font-family: 'Georgia', serif; padding: 48px 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0D1B4C; padding-bottom: 14px;">
          <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #1447E6;">
            ${meta.institution || 'POLICY & STRATEGY WORKING PAPER'}
          </span>
          <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 9.5pt; color: #64748B;">
            EDITION 2026
          </span>
        </div>

        <div style="margin: 80px 0;">
          <h1 style="font-size: 28pt; font-weight: 800; color: #0D1B4C; line-height: 1.25; margin: 0 0 18px 0;">
            ${title || 'Strategic Overview on Economic Diversification'}
          </h1>
          <p style="font-size: 14pt; color: #475569; line-height: 1.5; font-style: italic;">
            ${meta.course || 'An empirical perspective on sustainable development frameworks in West Africa.'}
          </p>
        </div>

        <div style="border-top: 1px solid #CBD5E1; padding-top: 18px; display: flex; justify-content: space-between; align-items: flex-end; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div>
            <p style="font-size: 9pt; text-transform: uppercase; color: #64748B; font-weight: 700;">Author / Contributor</p>
            <p style="font-size: 12pt; font-weight: 700; color: #0D1B4C; margin-top: 2px;">${meta.studentName || 'Author Name'}</p>
          </div>
          <p style="font-size: 10pt; color: #64748B;">${meta.submissionDate || 'November 2026'}</p>
        </div>
      </div>
    `,
  },
  // --- IMAGE TO NOTES COVERS ---
  {
    id: 'cover-notes-summary',
    category: 'image-to-notes',
    name: 'Lecture Notes & Revision Digest',
    description: 'Crisp revision cover page with course title, module topic, date of lecture, and key summary highlights.',
    previewBg: '#F0FDF4',
    accentColor: '#16A34A',
    renderHtml: (title, meta) => `
      <div style="border: 2px solid #166534; padding: 48px 36px; min-height: 980px; display: flex; flex-direction: column; justify-content: space-between; font-family: 'Plus Jakarta Sans', Inter, sans-serif;">
        <div>
          <span style="display: inline-block; padding: 4px 12px; background-color: #DCFCE7; color: #166534; font-weight: 700; font-size: 10pt; letter-spacing: 0.1em; text-transform: uppercase;">
            DIGITAL LECTURE NOTES &amp; REVISION DIGEST
          </span>
          <h1 style="font-size: 24pt; font-weight: 800; color: #0F172A; margin: 24px 0 12px; line-height: 1.25;">
            ${title || 'DIGITAL LECTURE STUDY GUIDE'}
          </h1>
          <p style="font-size: 12.5pt; color: #166534; font-weight: 600;">
            ${meta.courseCode ? `${meta.courseCode} — ` : ''}${meta.course || 'Extracted Study Modules & OCR Notes'}
          </p>
        </div>

        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 22px;">
          <p style="font-size: 11pt; color: #334155; line-height: 1.8; margin: 0;">
            <strong>Institution:</strong> ${meta.institution || 'Higher Institution / University'}<br/>
            <strong>Department:</strong> ${meta.department || 'Department / Faculty'}<br/>
            <strong>Compiled By:</strong> ${meta.studentName || 'Candidate Name'}<br/>
            <strong>Lecturer:</strong> ${meta.lecturerOrSupervisor || 'Course Lecturer'}<br/>
            <strong>Academic Session:</strong> ${meta.submissionDate || '2025/2026 Academic Session'}
          </p>
        </div>

        <div style="border-top: 1px solid #CBD5E1; padding-top: 16px; font-size: 10pt; color: #64748B;">
          Digitally captured &amp; organized with Nigerian Cafe Document Workspace.
        </div>
      </div>
    `,
  },
];

// ============================================================================
// 2. CATEGORY-SPECIFIC WORKSPACE TEMPLATES
// ============================================================================

export const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  // --- ASSIGNMENT TEMPLATES ---
  {
    id: 'tmpl-assignment-standard',
    category: 'assignments',
    name: 'Standard Academic Coursework',
    description: 'Structured university coursework with student info, problem question, core analysis, comparison table, and APA references.',
    badge: 'Standard Coursework',
    sections: ['Cover Page', 'Question / Topic', 'Core Discussion', 'Comparative Analysis Table', 'Conclusion & References'],
    defaultCoverId: 'cover-assignment-classic',
    generateBodyHtml: (title, meta) => [
      `
        <h1>1. INTRODUCTION &amp; PROBLEM STATEMENT</h1>
        <p><strong>Assignment Topic:</strong> <em>${title}</em></p>
        <p>This coursework assignment addresses key theoretical and empirical aspects of the subject matter within the Nigerian and international context. Theoretical underpinnings provide foundational definitions before examining practical applications.</p>
        <h2>1.1 Objectives of the Analysis</h2>
        <ul>
          <li>Clarify the conceptual boundaries and definitions governing the course question.</li>
          <li>Evaluate empirical case studies and observed operational impacts.</li>
          <li>Provide substantiated conclusions and policy or practical recommendations.</li>
        </ul>
        <h2>1.2 Theoretical Foundation</h2>
        <p>Core theoretical frameworks explain the mechanisms by which institutional, technical, and macroeconomic variables interact. Recent scholarly debate emphasizes structured empirical assessment over purely normative postulations.</p>
      `,
      `
        <h1>2. MAIN THEMATIC DISCUSSION &amp; COMPARATIVE ANALYSIS</h1>
        <p>Detailed analysis of core dimensions demonstrates significant differences across operational environments. The table below synthesizes key analytical parameters:</p>
        <table>
          <thead>
            <tr>
              <th style="width: 30%;">Dimension</th>
              <th style="width: 40%;">Core Mechanism</th>
              <th style="width: 30%;">Implication in Practice</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Policy Framework</td>
              <td>Statutory guidelines and compliance standards</td>
              <td>Promotes transparency and operational predictability</td>
            </tr>
            <tr>
              <td>Resource Allocation</td>
              <td>Targeted funding and technical deployment</td>
              <td>Minimizes administrative friction and project delays</td>
            </tr>
            <tr>
              <td>Monitoring &amp; Audit</td>
              <td>Periodic empirical evaluation</td>
              <td>Ensures accountability and long-term sustainability</td>
            </tr>
          </tbody>
        </table>
        <h2>2.1 Practical Case Illustration</h2>
        <p>Field data collected across regional centers reveals that structured frameworks yield up to 35% higher compliance and throughput rates compared to decentralized, ad-hoc methods.</p>
      `,
      `
        <h1>3. CONCLUSION &amp; REFERENCES</h1>
        <p>In conclusion, addressing <strong>${title}</strong> requires concerted coordination across policy formulation, technical capacity, and rigorous oversight.</p>
        <h2>3.1 Key Recommendations</h2>
        <ol>
          <li>Harmonize operational standards across all departmental units.</li>
          <li>Implement automated auditing mechanisms to reduce turnaround time.</li>
          <li>Conduct periodic capacity-building workshops for key stakeholders.</li>
        </ol>
        <h2>References (${meta.referencingStyle || 'APA 7th Edition'})</h2>
        <p>Adebayo, K. O., &amp; Nwankwo, C. E. (2025). Contemporary perspectives and empirical analysis in Nigerian tertiary coursework. <em>West African Journal of Academic Research</em>, 18(3), 44–62.</p>
        <p>Eze, D. N., &amp; Bello, H. A. (2026). Policy execution and administrative performance metrics. <em>Journal of Applied Social &amp; Management Sciences</em>, 12(1), 89–107.</p>
      `,
    ],
  },
  {
    id: 'tmpl-assignment-case-study',
    category: 'assignments',
    name: 'Case Study & Field Report',
    description: 'Designed for analytical case evaluations, organizational reviews, and field observations.',
    badge: 'Case Study',
    sections: ['Cover Page', 'Executive Summary', 'Case Background', 'SWOT / Gap Analysis', 'Recommendations'],
    defaultCoverId: 'cover-assignment-modern',
    generateBodyHtml: (title) => [
      `
        <h1>1. EXECUTIVE SUMMARY &amp; CASE BACKGROUND</h1>
        <p><strong>Case Subject:</strong> <em>${title}</em></p>
        <p>This report evaluates organizational strategy, operational bottlenecks, and strategic opportunities. Based on qualitative and quantitative inquiry, actionable interventions are proposed.</p>
        <h2>1.1 Organizational Context</h2>
        <p>The target entity operates within an increasingly competitive and dynamic regulatory landscape. Key competitive pressures demand streamlined workflow automation and resilient contingency planning.</p>
      `,
      `
        <h1>2. STRATEGIC GAP &amp; CHALLENGE ANALYSIS</h1>
        <h2>2.1 Core Problem Dimensions</h2>
        <p>Key findings point to fragmented information flows, redundant manual verification stages, and inconsistent inter-departmental communication.</p>
        <h2>2.2 Strategic SWOT Summary</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 50%;">Strengths &amp; Opportunities</th>
              <th style="width: 50%;">Weaknesses &amp; Threats</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Strong brand equity and established client network.</td>
              <td>High reliance on legacy manual documentation processes.</td>
            </tr>
            <tr>
              <td>Rapid adoption of digital payment and mobile platforms.</td>
              <td>Regulatory volatility and infrastructural power interruptions.</td>
            </tr>
          </tbody>
        </table>
        <h2>3. Actionable Recommendations</h2>
        <ol>
          <li>Deploy modular cloud-based document management infrastructure.</li>
          <li>Institute weekly milestone reviews and automated reconciliation tracking.</li>
        </ol>
      `,
    ],
  },

  // --- PROJECT TEMPLATES ---
  {
    id: 'tmpl-project-5chapters',
    category: 'projects',
    name: 'Full 5-Chapter University Research Project',
    description: 'Comprehensive NUC-compliant academic research project covering preliminary pages, Chapters 1 through 5, and full bibliography.',
    badge: 'Complete Project (Chapters 1-5)',
    sections: [
      'Cover Page',
      'Title Page & Declaration',
      'Certification & Dedication',
      'Acknowledgements & Abstract',
      'Table of Contents',
      'Chapter 1: Introduction',
      'Chapter 2: Literature Review',
      'Chapter 3: Methodology',
      'Chapter 4: Results & Discussion',
      'Chapter 5: Conclusion & References',
    ],
    defaultCoverId: 'cover-project-standard',
    generateBodyHtml: (title, meta) => [
      `
        <h1 style="text-align: center;">TITLE PAGE &amp; DECLARATION</h1>
        <p style="text-align: center; font-weight: 700; margin-top: 14px;">DECLARATION</p>
        <p style="margin-top: 18px; line-height: 1.8;">
          I, <strong>${(meta.studentName || 'CANDIDATE NAME').toUpperCase()}</strong>, hereby declare that this research project titled 
          <strong>"${title.toUpperCase()}"</strong> is a record of my own research work under the supervision of 
          <strong>${meta.lecturerOrSupervisor || 'DR. SUPERVISOR'}</strong>. It has not been previously submitted in part or whole for any degree or award in this or any other tertiary institution.
        </p>
        <div style="margin-top: 60px; display: flex; justify-content: space-between;">
          <div>
            <p>__________________________</p>
            <p><strong>${meta.studentName || 'Student Name'}</strong><br/>Candidate</p>
          </div>
          <div>
            <p>__________________________</p>
            <p><strong>Date</strong></p>
          </div>
        </div>
      `,
      `
        <h1 style="text-align: center;">CERTIFICATION &amp; DEDICATION</h1>
        <p style="text-align: center; font-weight: 700; margin-top: 14px;">CERTIFICATION</p>
        <p style="margin-top: 18px; line-height: 1.8;">
          This is to certify that this research project titled <strong>"${title.toUpperCase()}"</strong> was carried out by 
          <strong>${meta.studentName || 'Candidate Name'}</strong> with Matriculation Number <strong>${meta.matricNo || '00/0000'}</strong> 
          in the Department of ${(meta.department || 'Academic Department').toUpperCase()}, Faculty of Science, ${(meta.institution || 'University').toUpperCase()}.
        </p>
        <div style="margin-top: 50px;">
          <p>___________________________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ____________________</p>
          <p><strong>${meta.lecturerOrSupervisor || 'Dr. Supervisor'}</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Date</strong><br/>(Project Supervisor)</p>
        </div>
        <div style="margin-top: 40px; border-top: 1px solid #CBD5E1; padding-top: 24px;">
          <p style="text-align: center; font-weight: 700;">DEDICATION</p>
          <p style="font-style: italic; line-height: 1.8; text-align: center; margin-top: 12px;">
            This study is dedicated to Almighty God for His boundless grace, wisdom and divine protection throughout this academic journey, and to my beloved family for their enduring support.
          </p>
        </div>
      `,
      `
        <h1 style="text-align: center;">ABSTRACT</h1>
        <p style="line-height: 1.85; margin-top: 20px;">
          This empirical study investigates <strong>${title}</strong>. Guided by key research questions, a descriptive survey research design was adopted. A structured questionnaire was administered to a sample of 250 respondents selected via stratified random sampling. Collected data were analyzed using descriptive statistics (frequencies and percentages) alongside inferential statistics (Pearson Product Moment Correlation and Multiple Regression) computed via SPSS Version 28. Findings reveal a statistically significant positive relationship between the independent variables and measurable organizational outcomes (r = 0.724, p &lt; 0.05). Based on these findings, the study recommends institutional standardisation, regular technical training, and adequate budgetary allocation.
        </p>
      `,
      `
        <h1>CHAPTER ONE: INTRODUCTION</h1>
        <h2>1.1 Background of the Study</h2>
        <p>Across Nigeria and developing economies globally, <strong>${title}</strong> has emerged as a focal domain of academic and empirical scrutiny. Transformations in technical infrastructure and socio-economic systems have necessitated new analytical frameworks.</p>
        <h2>1.2 Statement of the Problem</h2>
        <p>Despite ongoing institutional initiatives, empirical gaps persist regarding the precise determinants governing sustainable outcomes within the study setting.</p>
        <h2>1.3 Objectives of the Study</h2>
        <ol>
          <li>To identify the prevalence and current practices regarding ${title.toLowerCase()}.</li>
          <li>To determine the principal factors influencing implementation success.</li>
          <li>To measure the statistically significant impact on organizational performance.</li>
        </ol>
        <h2>1.4 Research Questions &amp; Hypotheses</h2>
        <p><strong>H₀₁:</strong> There is no significant relationship between implementation strategies and performance outcomes in the study population.</p>
      `,
      `
        <h1>CHAPTER TWO: LITERATURE REVIEW</h1>
        <h2>2.1 Conceptual Review</h2>
        <p>Conceptualizing <strong>${title}</strong> requires synthesizing administrative readiness, technical capability, and regulatory compliance.</p>
        <h2>2.2 Theoretical Framework</h2>
        <p>This investigation is anchored on the <strong>Technology Acceptance Model (TAM)</strong> and <strong>Systems Theory</strong>, which posit that stakeholder perception of utility and ease of use directly drives sustainable adoption.</p>
        <h2>2.3 Empirical Review &amp; Summary of Gaps</h2>
        <p>Previous scholars have highlighted structural bottlenecks; however, localized empirical datasets from Nigerian tertiary and commercial environments remain limited.</p>
      `,
      `
        <h1>CHAPTER THREE: RESEARCH METHODOLOGY</h1>
        <h2>3.1 Research Design</h2>
        <p>A cross-sectional survey research design was utilized to gather firsthand empirical observations.</p>
        <h2>3.2 Population and Sampling Technique</h2>
        <p>The study population comprises 1,200 eligible participants. Applying Taro Yamane’s formula yielded a representative sample size of 300 respondents.</p>
        <h2>3.3 Research Instrument &amp; Reliability</h2>
        <p>Data was collected via a 4-point Likert scale questionnaire. Cronbach's Alpha coefficient of 0.84 confirmed high internal consistency.</p>
      `,
      `
        <h1>CHAPTER FOUR: RESULTS &amp; DISCUSSION</h1>
        <h2>4.1 Demographic Analysis of Respondents</h2>
        <p>Out of 300 administered questionnaires, 284 were completely filled and retrieved, representing a 94.7% retrieval rate.</p>
        <h2>4.2 Test of Research Hypotheses</h2>
        <table>
          <thead>
            <tr>
              <th>Variable Relationship</th>
              <th>Pearson (r)</th>
              <th>p-value</th>
              <th>Decision</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Implementation vs. Performance</td>
              <td>0.724</td>
              <td>0.001</td>
              <td>Reject H₀</td>
            </tr>
            <tr>
              <td>Resource Allocation vs. Efficiency</td>
              <td>0.681</td>
              <td>0.004</td>
              <td>Reject H₀</td>
            </tr>
          </tbody>
        </table>
        <h2>4.3 Discussion of Empirical Findings</h2>
        <p>The empirical results align with contemporary scholarship, confirming that disciplined procedural frameworks drive measurable improvements.</p>
      `,
      `
        <h1>CHAPTER FIVE: CONCLUSION &amp; REFERENCES</h1>
        <h2>5.1 Summary of Findings</h2>
        <p>The study established significant correlations between procedural adherence, technical readiness, and sustainable operational outcomes.</p>
        <h2>5.2 Policy Recommendations</h2>
        <ol>
          <li>Institutionalize continuous technical auditing across regional operational centers.</li>
          <li>Allocate dedicated capital expenditure for infrastructural modernization.</li>
        </ol>
        <h2>References (${meta.referencingStyle || 'APA 7th Edition'})</h2>
        <p>Okafor, A. O., &amp; Bello, H. A. (2025). Empirical methodologies in Nigerian higher education research. <em>Journal of Social &amp; Management Studies</em>, 14(2), 112–130.</p>
        <p>Yamane, T. (1967). <em>Statistics: An Introductory Analysis</em> (2nd ed.). Harper and Row.</p>
      `,
    ],
  },
  {
    id: 'tmpl-project-proposal',
    category: 'projects',
    name: 'Capstone Project Proposal',
    description: 'Compact proposal structure including background, scope, methodology, timeline, and preliminary budget.',
    badge: 'Proposal / Capstone',
    sections: ['Cover Page', 'Project Synopsis', 'Methodology & Tools', 'Work Breakdown & Budget', 'References'],
    defaultCoverId: 'cover-project-executive',
    generateBodyHtml: (title) => [
      `
        <h1>1. PROJECT OVERVIEW &amp; PROBLEM SCOPE</h1>
        <p><strong>Proposed Project:</strong> <em>${title}</em></p>
        <p>This proposal outlines the engineering and empirical framework required to execute the capstone project within a 16-week timeline.</p>
        <h2>1.1 Project Objectives</h2>
        <ul>
          <li>Define system requirements and user persona specifications.</li>
          <li>Build and validate the core algorithmic pipeline.</li>
          <li>Deploy test instances and evaluate response latency and reliability.</li>
        </ul>
      `,
      `
        <h1>2. TECHNICAL ARCHITECTURE &amp; WORK PLAN</h1>
        <h2>2.1 Implementation Stack</h2>
        <p>The software solution leverages modern, cross-platform protocols ensuring zero-downtime offline caching and fast sync.</p>
        <h2>2.2 Timeline &amp; Milestone Schedule</h2>
        <table>
          <thead>
            <tr>
              <th>Milestone Phase</th>
              <th>Key Deliverable</th>
              <th>Estimated Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Phase 1: Requirements</td>
              <td>System Specifications Document</td>
              <td>Weeks 1–3</td>
            </tr>
            <tr>
              <td>Phase 2: Prototype</td>
              <td>Core Functional Engine</td>
              <td>Weeks 4–9</td>
            </tr>
            <tr>
              <td>Phase 3: Validation</td>
              <td>User Testing &amp; Final Report</td>
              <td>Weeks 10–16</td>
            </tr>
          </tbody>
        </table>
      `,
    ],
  },

  // --- SEMINAR TEMPLATES ---
  {
    id: 'tmpl-seminar-academic',
    category: 'seminars',
    name: 'Departmental Academic Seminar Paper',
    description: 'Complete seminar paper structure featuring abstract, technical introduction, thematic sections, future prospects, and references.',
    badge: 'Academic Seminar',
    sections: ['Cover Page', 'Abstract', 'Introduction & Scope', 'Core Technical Discussion', 'Future Outlook & References'],
    defaultCoverId: 'cover-seminar-academic',
    generateBodyHtml: (title, meta) => [
      `
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 18pt;">${title.toUpperCase()}</h1>
          <p style="font-size: 11pt; color: #475569;">
            Presented by: <strong>${meta.studentName || 'Presenter Name'}</strong> &nbsp;|&nbsp; 
            Department: ${(meta.department || 'Academic Department')}, ${(meta.institution || 'University')}
          </p>
        </div>
        <h2>ABSTRACT</h2>
        <p style="line-height: 1.8;">
          This seminar paper presents a critical analysis of <strong>${title}</strong>. It reviews historical paradigms, compares modern technical architectures, and examines socio-economic feasibility in developing economies. Practical recommendations are formulated for institutional stakeholders.
        </p>
        <h2>1. INTRODUCTION &amp; MOTIVATION</h2>
        <p>Rapid technological advancement has introduced new paradigms across the discipline. Understanding these developments is essential for academic researchers and practitioners alike.</p>
      `,
      `
        <h1>2. THEMATIC DISCUSSION &amp; ARCHITECTURAL ANALYSIS</h1>
        <h2>2.1 Underlying Mechanisms</h2>
        <p>Core components operate synergistically to ensure high reliability, modular scalability, and seamless interoperability with legacy infrastructure.</p>
        <h2>2.2 Comparative Technology Evaluation</h2>
        <table>
          <thead>
            <tr>
              <th>Architecture Model</th>
              <th>Throughput &amp; Speed</th>
              <th>Deployment Overhead</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Centralized Monolith</td>
              <td>Moderate</td>
              <td>Low initial complexity</td>
            </tr>
            <tr>
              <td>Modular Micro-services</td>
              <td>High</td>
              <td>Moderate operational rigor</td>
            </tr>
            <tr>
              <td>Edge-Decentralized</td>
              <td>Very High</td>
              <td>Requires robust local nodes</td>
            </tr>
          </tbody>
        </table>
      `,
      `
        <h1>3. CONCLUSION, FUTURE OUTLOOK &amp; REFERENCES</h1>
        <p>Technological convergence will continue to reshape implementation standards over the next decade.</p>
        <h2>References (${meta.referencingStyle || 'APA 7th Edition'})</h2>
        <p>Chukwu, I. E., &amp; Usman, A. B. (2025). Advanced seminar series in contemporary engineering and applied sciences. <em>Nigerian Academic Forum</em>, 31(1), 55–74.</p>
      `,
    ],
  },

  // --- CV / RESUME TEMPLATES ---
  {
    id: 'tmpl-cv-professional',
    category: 'cv',
    name: 'Executive Professional CV',
    description: 'Clean, ATS-compliant CV template with career summary, work history, education, skills, and references.',
    badge: 'Professional CV',
    sections: ['Header & Contacts', 'Professional Summary', 'Work Experience', 'Education & Qualifications', 'Core Competencies & References'],
    defaultCoverId: 'cover-cv-executive',
    generateBodyHtml: (title, meta) => [
      `
        <h1>PROFESSIONAL SUMMARY</h1>
        <p style="line-height: 1.75;">
          Results-oriented and high-performing professional with demonstrated experience leading cross-functional projects, financial analysis, and operational optimization. Proven ability to translate complex stakeholder requirements into measurable organizational success.
        </p>
        <h1>WORK EXPERIENCE</h1>
        <h2>Senior Operations &amp; Data Specialist — Nigerian Enterprise Solutions Ltd</h2>
        <p style="font-size: 10.5pt; color: #475569; font-style: italic;">Lagos, Nigeria &nbsp;|&nbsp; 2023 – Present</p>
        <ul>
          <li>Led digital workflow transformation initiatives that reduced document turnaround times by 48%.</li>
          <li>Managed financial reporting pipelines across 14 regional service locations serving 10,000+ customers.</li>
          <li>Mentored junior analysts and authored standard operating procedures (SOPs).</li>
        </ul>

        <h2>Operations Associate — West African Financial Services</h2>
        <p style="font-size: 10.5pt; color: #475569; font-style: italic;">Benin City, Nigeria &nbsp;|&nbsp; 2021 – 2023</p>
        <ul>
          <li>Automated monthly broadsheet reconciliation using advanced SQL queries and Microsoft Excel pipelines.</li>
          <li>Identified settlement discrepancies saving an average of ₦3.2M quarterly.</li>
        </ul>
      `,
      `
        <h1>EDUCATION &amp; CERTIFICATIONS</h1>
        <h2>B.Sc. (Hons) in Computer Science &amp; Management — First Class Honours</h2>
        <p style="font-size: 10.5pt; color: #475569; font-style: italic;">${meta.institution || 'Covenant University, Ota, Nigeria'} &nbsp;|&nbsp; 2017 – 2021</p>

        <h2>Professional Certifications</h2>
        <ul>
          <li>Google Data Analytics Professional Certificate (2024)</li>
          <li>Microsoft Certified: Power BI Data Analyst Associate (2023)</li>
          <li>Project Management Professional (PMP) In-Training (2025)</li>
        </ul>

        <h1>CORE COMPETENCIES &amp; SKILLS</h1>
        <p><strong>Technical:</strong> SQL, Python, Advanced Excel, Financial Modelling, Power BI, Business Documentation.</p>
        <p><strong>Soft Skills:</strong> Cross-functional Leadership, Critical Problem Solving, Executive Presentation, Negotiation.</p>

        <h1>REFEREES</h1>
        <p>Available immediately upon request.</p>
      `,
    ],
  },

  // --- FREE-FORM WRITING TEMPLATES ---
  {
    id: 'tmpl-free-whitepaper',
    category: 'free-writing',
    name: 'Policy Whitepaper & Executive Brief',
    description: 'Formal long-form writing template for articles, opinions, proposals, essays, and strategic briefs.',
    badge: 'Policy Brief / Article',
    sections: ['Cover Page', 'Executive Summary', 'Analysis & Context', 'Strategic Roadmap & Conclusion'],
    defaultCoverId: 'cover-free-editorial',
    generateBodyHtml: (title) => [
      `
        <h1>EXECUTIVE SUMMARY &amp; STRATEGIC CONTEXT</h1>
        <p><strong>Topic / Subject:</strong> <em>${title}</em></p>
        <p>This document presents a comprehensive analysis aimed at decision-makers and community stakeholders. It outlines pressing challenges and formulates sustainable strategic responses.</p>
        <h2>Key Analytical Dimensions</h2>
        <ul>
          <li><strong>Structural Foundation:</strong> Establishing clear definitions and statutory boundaries.</li>
          <li><strong>Empirical Assessment:</strong> Reviewing current operational data and resource constraints.</li>
          <li><strong>Impact Realization:</strong> Formulating phased implementation roadmaps.</li>
        </ul>
      `,
      `
        <h1>STRATEGIC RECOMMENDATIONS &amp; CONCLUSION</h1>
        <h2>Actionable Policy Pillars</h2>
        <ol>
          <li>Harmonize public-private investment frameworks to reduce project financing costs.</li>
          <li>Establish regional technical vocational hubs to build sustainable domestic talent.</li>
          <li>Institute quarterly performance audits to ensure transparency and accountability.</li>
        </ol>
        <p>In summary, consistent strategic focus and institutional discipline remain the defining factors for long-term transformation.</p>
      `,
    ],
  },

  // --- IMAGE TO NOTES TEMPLATES ---
  {
    id: 'tmpl-notes-study-guide',
    category: 'image-to-notes',
    name: 'Structured Lecture Study Guide & Key Concepts',
    description: 'Transcribes and organizes lecture snapshots into structured topics, key definitions, tabular summaries, and revision questions.',
    badge: 'Lecture Revision Digest',
    sections: ['Cover Page', 'Core Definitions & Formulas', 'In-Depth Lecture Explanations', 'Revision Practice Questions'],
    defaultCoverId: 'cover-notes-summary',
    generateBodyHtml: (title, meta) => [
      `
        <h1>CORE CONCEPT DEFINITIONS &amp; FOUNDATIONS</h1>
        <p><strong>Course / Module:</strong> ${meta.courseCode ? `${meta.courseCode} — ` : ''}${title || 'Course Lecture Notes'}</p>
        <p>This study digest transcribes and structures core lecture points, chalkboard illustrations, and slide notes for streamlined revision.</p>
        <h2>Essential Glossary &amp; Formulas</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 30%;">Key Concept / Term</th>
              <th>Academic Definition &amp; Application</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Core Principle 1</strong></td>
              <td>Foundational law explaining system equilibrium and dynamic response under load.</td>
            </tr>
            <tr>
              <td><strong>Empirical Formula</strong></td>
              <td>Mathematical expression governing relationship between input variables and measured output.</td>
            </tr>
            <tr>
              <td><strong>Operational Parameter</strong></td>
              <td>Boundary conditions and constraints observed during experimental or case demonstration.</td>
            </tr>
          </tbody>
        </table>
      `,
      `
        <h1>DETAILED LECTURE ELABORATION &amp; PRACTICE QUESTIONS</h1>
        <h2>Analytical Synthesis</h2>
        <p>1. <strong>Primary Mechanism:</strong> The central theoretical premise relies on validated principles presented during class lectures.</p>
        <p>2. <strong>Practical Context:</strong> Nigerian industry and field applications reflect constraints including infrastructure, supply volatility, and regional regulation.</p>
        <h2>Revision Self-Assessment Questions</h2>
        <ol>
          <li>Differentiate between theoretical assertions and observed experimental discrepancies.</li>
          <li>Derive the mathematical formulation discussed in Module 2 and state its practical assumptions.</li>
          <li>Outline three real-world case scenarios where this principle dictates design decisions.</li>
        </ol>
      `,
    ],
  },
];

// Helper functions for retrieval
export function getTemplatesForCategory(category: DocumentCategory): WorkspaceTemplate[] {
  return WORKSPACE_TEMPLATES.filter((t) => t.category === category);
}

export function getCoverStylesForCategory(category: DocumentCategory): CoverPageDesign[] {
  return COVER_PAGE_DESIGNS.filter((c) => c.category === category || c.category === 'all');
}

