import {
  CategoryMeta,
  DocumentCategory,
  DocumentItem,
  PageGroup,
} from '../types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Formats any date string so the month is always displayed in words
 * e.g. "26/02/2006" -> "26 February 2006", "2026-11-07 21:40" -> "07 November 2026"
 */
export function formatDisplayDate(raw?: string): string {
  if (!raw) return getCurrentFormattedDate();
  const trimmed = raw.trim();

  // Already contains a month word?
  if (/[A-Za-z]{3,}/.test(trimmed)) {
    return trimmed;
  }

  // Match YYYY-MM-DD (with optional time)
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const monthIdx = Math.max(0, Math.min(11, parseInt(isoMatch[2], 10) - 1));
    const day = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    return `${day} ${MONTH_NAMES[monthIdx]} ${year}`;
  }

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const day = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
    const monthIdx = Math.max(0, Math.min(11, parseInt(dmyMatch[2], 10) - 1));
    const year = dmyMatch[3];
    return `${day} ${MONTH_NAMES[monthIdx]} ${year}`;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = MONTH_NAMES[parsed.getMonth()];
    const year = parsed.getFullYear();
    return `${day} ${month} ${year}`;
  }

  return trimmed;
}

export function getCurrentFormattedDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[now.getMonth()];
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Strips HTML tags and normalizes whitespace for full-text search
 */
export function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Searches a document across Title, Metadata, and Full Document Content (Requirement 2)
 */
export function searchDocumentMatch(
  doc: DocumentItem,
  query: string
): {
  matched: boolean;
  matchLocation?: 'Title' | 'Document Content' | 'Metadata';
  snippet?: string;
} {
  const q = query.trim().toLowerCase();
  if (!q) return { matched: true };

  if (doc.title.toLowerCase().includes(q)) {
    return {
      matched: true,
      matchLocation: 'Title',
    };
  }

  const plainContent = stripHtmlToPlainText(doc.content);
  const contentLower = plainContent.toLowerCase();
  const contentIdx = contentLower.indexOf(q);
  if (contentIdx !== -1) {
    const start = Math.max(0, contentIdx - 48);
    const end = Math.min(plainContent.length, contentIdx + q.length + 68);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < plainContent.length ? '...' : '';
    return {
      matched: true,
      matchLocation: 'Document Content',
      snippet: `${prefix}${plainContent.slice(start, end).trim()}${suffix}`,
    };
  }

  const metaFields = [
    doc.metadata.studentName,
    doc.metadata.institution,
    doc.metadata.department,
    doc.metadata.course,
    doc.metadata.courseCode,
    doc.metadata.lecturerOrSupervisor,
  ]
    .filter(Boolean)
    .join(' • ');

  if (metaFields.toLowerCase().includes(q)) {
    return {
      matched: true,
      matchLocation: 'Metadata',
      snippet: metaFields,
    };
  }

  return { matched: false };
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'projects',
    name: 'Projects',
    shortName: 'Project',
    code: 'MOD-01',
    description:
      'Generate structured academic research projects, from introductory chapters to complete project documents.',
    longDescription:
      'Create and organise your academic research projects with AI.',
    workflowSteps: [
      'Describe your project topic and scope',
      'AI generates structured chapters and citations',
      'Edit across pages and export to DOCX or PDF',
    ],
  },
  {
    id: 'assignments',
    name: 'Assignments',
    shortName: 'Assignment',
    code: 'MOD-02',
    description:
      'Create, structure and format academic assignments with AI assistance.',
    longDescription:
      'Generate, edit and organise your academic assignments with AI assistance.',
    workflowSteps: [
      'Describe the assignment question or topic',
      'AI structures sections, analysis and references',
      'Edit in workspace and export to DOCX or PDF',
    ],
  },
  {
    id: 'seminars',
    name: 'Seminars',
    shortName: 'Seminar',
    code: 'MOD-03',
    description:
      'Create seminar papers, presentations and supporting academic materials.',
    longDescription:
      'Generate and format seminar papers with AI assistance.',
    workflowSteps: [
      'Describe your seminar topic and focus',
      'AI generates abstract, thematic discussion and subtopics',
      'Edit freely and export for submission',
    ],
  },
  {
    id: 'cv',
    name: 'CV / Resume',
    shortName: 'CV',
    code: 'MOD-04',
    description:
      'Generate professional CVs and resumes using user-provided information.',
    longDescription:
      'Build professional CVs tailored to your career goals.',
    workflowSteps: [
      'Describe your background, experience and target role',
      'AI builds a clean, ATS-ready professional CV',
      'Edit sections and export to DOCX or PDF',
    ],
  },
  {
    id: 'image-to-notes',
    name: 'Image to Notes',
    shortName: 'Notes',
    code: 'MOD-05',
    description:
      'Upload pictures of handwritten notes, textbooks or printed documents and convert them into organised notes.',
    longDescription:
      'Turn pictures, handwritten materials and documents into organised notes.',
    workflowSteps: [
      'Upload lecture images or describe note requirements',
      'OCR extracts text and AI organises headings',
      'Review, edit and export clean study notes',
    ],
  },
  {
    id: 'free-writing',
    name: 'Free-Form Writing',
    shortName: 'Writing',
    code: 'MOD-06',
    description:
      'Draft essays, articles, letters, speeches, memos, proposals and general writing on any topic without category constraints.',
    longDescription:
      'Write freely on any topic with flexible AI assistance, outlines and editing.',
    workflowSteps: [
      'Describe what you want to write or start with a blank page',
      'AI assists with drafting, structure, tone and refinement',
      'Format freely in the rich editor and export to DOCX or PDF',
    ],
  },
];

export const CATEGORY_PAGE_COPY: Record<
  DocumentCategory,
  {
    heading: string;
    supportingText: string;
    buttonLabel: string;
    modalTitle: string;
    modalSubtitle: string;
    placeholder: string;
  }
> = {
  projects: {
    heading: 'Create research projects faster with AI.',
    supportingText:
      'Create and organise your academic research projects with AI.',
    buttonLabel: 'Create Project',
    modalTitle: 'Create Research Project Faster with AI',
    modalSubtitle:
      'Create a new research project or select an existing document from your library to improve with AI.',
    placeholder:
      'Describe the research project you want to create (e.g., "Write Chapters 1 to 3 on the impact of social media on academic performance among undergraduate students at the University of Benin...")',
  },
  assignments: {
    heading: 'Create assignments faster with AI.',
    supportingText:
      'Generate, edit and organise your academic assignments with AI assistance.',
    buttonLabel: 'Create Assignment',
    modalTitle: 'Create Assignment Faster with AI',
    modalSubtitle:
      'Create a new academic assignment or select an existing document to update with AI.',
    placeholder:
      'Describe the assignment you want to create (e.g., "Write a 1,500-word assignment on monetary policy instruments and inflation control in Nigeria with APA 7th references...")',
  },
  seminars: {
    heading: 'Create seminar papers faster with AI.',
    supportingText: 'Generate and format seminar papers with AI assistance.',
    buttonLabel: 'Create Seminar',
    modalTitle: 'Create Seminar Paper Faster with AI',
    modalSubtitle:
      'Create a new seminar paper or continue working on an existing document from your file library.',
    placeholder:
      'Describe the seminar paper you want to create (e.g., "Prepare a final year seminar paper on renewable energy microgrids for rural healthcare electrification in Nigeria...")',
  },
  cv: {
    heading: 'Create professional CVs faster with AI.',
    supportingText: 'Build professional CVs tailored to your career goals.',
    buttonLabel: 'Create CV',
    modalTitle: 'Create Professional CV Faster with AI',
    modalSubtitle:
      'Describe your background, work experience and target role, or select an existing CV to tailor with AI.',
    placeholder:
      'Describe your details for the CV (e.g., "Create a professional CV for Osahon Eghosa, First Class Computer Science graduate from Covenant University applying for a Data Analyst role in Lagos...")',
  },
  'image-to-notes': {
    heading: 'Create organised notes faster with AI.',
    supportingText:
      'Turn pictures, handwritten materials and documents into organised notes.',
    buttonLabel: 'Create Notes',
    modalTitle: 'Create Organised Notes Faster with AI',
    modalSubtitle:
      'Upload images of handwritten notes or textbooks, or select an existing notes document to expand.',
    placeholder:
      'Describe how you want the extracted material organised (e.g., "Convert the uploaded lecture board images on cell signalling into structured headings, bullet points and 5 revision questions...")',
  },
  'free-writing': {
    heading: 'Write anything freely with AI.',
    supportingText:
      'Draft essays, articles, speeches, letters, memos, creative work and general documents without category constraints.',
    buttonLabel: 'Create Document',
    modalTitle: 'Free-Form Writing Faster with AI',
    modalSubtitle:
      'Describe what you want to write or select an existing document from your library to continue writing.',
    placeholder:
      'Describe what you want to write (e.g., "Draft an insightful article on the opportunities and challenges of tech hubs across tertiary institutions in Nigeria...", or "Write a formal motivation letter for a postgraduate scholarship...")',
  },
};

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-proj-01',
    title:
      'The Impact of Social Media on Academic Performance Among University Students',
    category: 'projects',
    createdAt: '04 November 2026',
    updatedAt: '07 November 2026',
    status: 'In Progress',
    syncStatus: 'saved',
    format: 'DOCX',
    metadata: {
      institution: 'University of Benin (UNIBEN)',
      faculty: 'Faculty of Social Sciences',
      department: 'Mass Communication',
      studentName: 'Chukwu Amarachi Blessing',
      matricNumber: 'SSC/21/04829',
      lecturerOrSupervisor: 'Dr. E. O. Ogbebor',
      academicSession: '2025/2026',
      referencingStyle: 'APA 7th Edition',
      headerText: 'IMPACT OF SOCIAL MEDIA ON ACADEMIC PERFORMANCE',
      footerText: 'Department of Mass Communication — UNIBEN',
      showPageNumbers: true,
      orientation: 'portrait',
      marginSize: 'normal',
      fontFamily: 'Times New Roman',
      pageGroups: [
        {
          id: 'grp-prelim',
          name: 'Group 1: Title & Abstract',
          pageIndices: [0],
          collapsed: true,
        },
        {
          id: 'grp-ch1',
          name: 'Group 2: Chapter One',
          pageIndices: [1],
          collapsed: true,
        },
        {
          id: 'grp-ch2',
          name: 'Group 3: Chapter Two',
          pageIndices: [2],
          collapsed: true,
        },
      ],
    },
    content: `
      <div style="text-align: center; margin-bottom: 28px;">
        <p style="font-size: 14pt; font-weight: 700; letter-spacing: 0.04em;">THE IMPACT OF SOCIAL MEDIA ON ACADEMIC PERFORMANCE AMONG UNIVERSITY STUDENTS</p>
        <p style="margin-top: 18px;">BY</p>
        <p style="font-weight: 700; margin-top: 6px;">CHUKWU AMARACHI BLESSING<br/>MATRIC NO: SSC/21/04829</p>
        <p style="margin-top: 18px;">DEPARTMENT OF MASS COMMUNICATION<br/>FACULTY OF SOCIAL SCIENCES<br/>UNIVERSITY OF BENIN, BENIN CITY</p>
        <p style="margin-top: 14px; font-weight: 600;">NOVEMBER, 2026</p>
      </div>
      <h1>ABSTRACT</h1>
      <p>This study examines the impact of social media usage on the academic performance of undergraduate students at the University of Benin. Using a descriptive survey design, a sample of 380 students across six faculties was selected via stratified random sampling. Findings reveal that while 84% of respondents utilize platforms such as WhatsApp, YouTube, and X for collaborative course discussions and research material retrieval, unmonitored recreational screen time exceeding four hours daily negatively correlates with Cumulative Grade Point Average (CGPA). The study recommends structured digital literacy orientation and institutional e-learning integration.</p>
      <hr class="page-break" />
      <h1>CHAPTER ONE: INTRODUCTION</h1>
      <h2>1.1 Background to the Study</h2>
      <p>The impact of social media on academic performance has become a major concern among researchers and higher education administrators across Nigeria. The rapid proliferation of mobile broadband and smartphones across tertiary institutions has fundamentally transformed how undergraduate students communicate, collaborate, and access scholarly information.</p>
      <p>Social networking platforms have evolved from purely recreational channels into virtual lecture halls where course handouts, past questions, and academic discussions are exchanged instantaneously. However, scholars continue to examine the balance between collaborative digital learning and cognitive distraction during study hours.</p>
      <h2>1.2 Statement of the Problem</h2>
      <p>Despite widespread adoption of mobile devices on Nigerian campuses, empirical clarity remains needed regarding whether daily social media engagement acts primarily as a catalyst for academic enrichment or a driver of distraction among undergraduates.</p>
      <h2>1.3 Objectives of the Study</h2>
      <ol>
        <li>To determine the average daily hours undergraduate students spend on social networking platforms.</li>
        <li>To examine the extent to which students utilize social media for academic research and group assignments.</li>
        <li>To evaluate the relationship between social media usage patterns and students' academic performance (CGPA).</li>
      </ol>
      <h2>1.4 Research Questions</h2>
      <ol>
        <li>What is the average daily duration of social media usage among undergraduate students?</li>
        <li>How do undergraduate students utilize social media platforms for academic purposes?</li>
        <li>To what extent does excessive social media engagement affect students' grade point averages?</li>
      </ol>
      <hr class="page-break" />
      <h1>CHAPTER TWO: LITERATURE REVIEW</h1>
      <h2>2.1 Conceptual Framework</h2>
      <p>Social media refers to interactive web and mobile technologies that facilitate the creation, curation, and exchange of user-generated content within virtual networks. In tertiary academic settings, these tools support peer-to-peer knowledge sharing, departmental announcements, and collaborative research groups.</p>
      <h2>2.2 Theoretical Framework</h2>
      <p>This study is anchored on <strong>Uses and Gratifications Theory (UGT)</strong> propounded by Katz, Blumler, and Gurevitch (1974), which posits that media users play an active role in choosing and using communication channels to satisfy specific cognitive, affective, and integrative needs.</p>
      <h2>2.3 Empirical Review</h2>
      <p>Recent empirical surveys across Nigerian federal and state universities demonstrate that structured academic use of digital platforms enhances access to current journals, whereas unregulated nocturnal browsing reduces sleep quality and examination preparedness.</p>
    `,
    aiHistory: [],
  },
  {
    id: 'doc-asg-01',
    title:
      'Monetary Policy Instruments and Inflation Control in Nigeria (2018–2026)',
    category: 'assignments',
    createdAt: '06 November 2026',
    updatedAt: '07 November 2026',
    status: 'Completed',
    syncStatus: 'saved',
    format: 'DOCX',
    metadata: {
      institution: 'University of Lagos (UNILAG)',
      department: 'Economics',
      course: 'Macroeconomic Theory II',
      courseCode: 'ECN 312',
      studentName: 'Adebayo Tobi Samuel',
      matricNumber: '210903044',
      lecturerOrSupervisor: 'Prof. M. A. Adebiyi',
      referencingStyle: 'APA 7th Edition',
      wordCountTarget: '1,500 Words',
      showPageNumbers: true,
      orientation: 'portrait',
      marginSize: 'normal',
      fontFamily: 'Times New Roman',
    },
    content: `
      <div style="margin-bottom: 20px;">
        <p style="margin: 0; font-weight: 700; font-size: 13pt;">UNIVERSITY OF LAGOS — DEPARTMENT OF ECONOMICS</p>
        <p style="margin: 4px 0 0 0; font-size: 11pt;"><strong>Course:</strong> ECN 312 (Macroeconomic Theory II) &nbsp;|&nbsp; <strong>Student:</strong> Adebayo Tobi Samuel (210903044) &nbsp;|&nbsp; <strong>Lecturer:</strong> Prof. M. A. Adebiyi</p>
      </div>
      <h1>MONETARY POLICY INSTRUMENTS AND INFLATION CONTROL IN NIGERIA</h1>
      <h2>1. Introduction</h2>
      <p>Monetary policy represents the deliberate macroeconomic toolkit deployed by the Central Bank of Nigeria (CBN) to regulate money supply, credit conditions, and interest rates in pursuit of price stability and sustainable economic growth. Between 2018 and 2026, inflationary pressures in Nigeria have reflected both demand-pull liquidity expansions and structural cost-push factors including exchange rate pass-through, energy logistics, and food supply bottlenecks.</p>
      <h2>2. Primary Instruments Deployed by the Central Bank of Nigeria</h2>
      <ul>
        <li><strong>Monetary Policy Rate (MPR):</strong> Serving as the anchor rate for interbank and commercial lending, successive upward adjustments of the MPR have been utilized to anchor inflation expectations.</li>
        <li><strong>Cash Reserve Ratio (CRR):</strong> By mandating commercial banks to hold a designated fraction of deposits with the apex bank, the CBN directly sterilizes excess banking system liquidity.</li>
        <li><strong>Open Market Operations (OMO):</strong> Issuance of OMO bills absorbs surplus liquidity and attracts foreign portfolio inflows.</li>
      </ul>
      <h2>3. Empirical Evaluation Matrix</h2>
      <table>
        <thead>
          <tr>
            <th>Policy Instrument</th>
            <th>Transmission Mechanism</th>
            <th>Observed Constraint in Nigeria</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Monetary Policy Rate (MPR)</td>
            <td>Commercial bank lending &amp; deposit rates</td>
            <td>High informal sector liquidity outside banking channels</td>
          </tr>
          <tr>
            <td>Cash Reserve Ratio (CRR)</td>
            <td>Direct sterilization of deposit money banks</td>
            <td>Tightens credit availability to manufacturing SMEs</td>
          </tr>
          <tr>
            <td>Open Market Operations</td>
            <td>Short-term money market yield curve</td>
            <td>Elevated debt servicing cost on short-term securities</td>
          </tr>
        </tbody>
      </table>
      <h2>4. Conclusion &amp; References</h2>
      <p>Effective disinflation in Nigeria requires tighter coordination between orthodox monetary tightening by the CBN and structural fiscal interventions addressing domestic agricultural output and transport infrastructure.</p>
      <p><strong>References (APA 7th):</strong><br/>Central Bank of Nigeria. (2025). <em>Monetary Policy Communiqués and Statistical Bulletin</em>. Abuja: CBN Press.<br/>Nwosa, P. I., &amp; Ajibola, A. (2024). Monetary policy transmission and structural inflation in West Africa. <em>Nigerian Journal of Economic Studies</em>, 66(2), 112–129.</p>
    `,
    aiHistory: [],
  },
  {
    id: 'doc-sem-01',
    title:
      'Renewable Energy Microgrids for Rural Healthcare Electrification in Nigeria',
    category: 'seminars',
    createdAt: '05 November 2026',
    updatedAt: '07 November 2026',
    status: 'Completed',
    syncStatus: 'saved',
    format: 'PDF',
    metadata: {
      institution: 'Ahmadu Bello University (ABU), Zaria',
      department: 'Electrical & Computer Engineering',
      course: 'ENG 504 — Senior Undergraduate Seminar',
      studentName: 'Ibrahim Yusuf Danjuma',
      matricNumber: 'U20EE1082',
      lecturerOrSupervisor: 'Engr. Dr. S. B. Mohammed',
      referencingStyle: 'IEEE',
      showPageNumbers: true,
      orientation: 'portrait',
      marginSize: 'normal',
      fontFamily: 'Georgia',
    },
    content: `
      <h1>RENEWABLE ENERGY MICROGRIDS FOR RURAL HEALTHCARE ELECTRIFICATION IN NIGERIA</h1>
      <p><strong>Author:</strong> Ibrahim Yusuf Danjuma (U20EE1082) — Department of Electrical &amp; Computer Engineering, ABU Zaria<br/><strong>Supervisor:</strong> Engr. Dr. S. B. Mohammed</p>
      <h2>Abstract</h2>
      <p>Primary Healthcare Centres (PHCs) across rural Nigeria require uninterrupted electrical power for vaccine cold-chain storage, diagnostic equipment, and emergency nocturnal maternity care. This seminar paper evaluates hybrid Solar Photovoltaic (PV) and Lithium-Iron-Phosphate (LiFePO4) battery microgrids as a cost-effective alternative to diesel generators.</p>
      <h2>1. Introduction &amp; Background</h2>
      <p>Over 40% of rural health facilities operate with fewer than six hours of grid electricity daily. Hybrid solar microgrids capitalize on Nigeria's high solar irradiance (4.5 to 6.5 kWh/m²/day) to deliver 99.5% uptime with lower levelized cost of electricity (LCOE).</p>
      <h2>2. System Architecture &amp; Sizing</h2>
      <ul>
        <li><strong>PV Array Layer:</strong> Monocrystalline half-cut modules sized at 15 kWp per Primary Healthcare Centre.</li>
        <li><strong>Energy Storage System:</strong> 30 kWh LiFePO4 battery bank supporting 48 hours of critical load autonomy.</li>
        <li><strong>Smart Load Prioritization:</strong> Dedicated essential bus for vaccine refrigerators and theatre lighting.</li>
      </ul>
      <h2>3. Conclusion &amp; Policy Recommendations</h2>
      <p>Standardizing modular 15 kWp solar-battery microgrids across Local Government healthcare networks reduces operational fuel expenditure by 72% over a 10-year lifecycle.</p>
    `,
    aiHistory: [],
  },
  {
    id: 'doc-cv-01',
    title: 'Osahon_Eghosa_Graduate_Analyst_CV',
    category: 'cv',
    createdAt: '03 November 2026',
    updatedAt: '07 November 2026',
    status: 'Completed',
    syncStatus: 'saved',
    format: 'DOCX',
    metadata: {
      studentName: 'Osahon Eghosa Victor',
      institution: 'Covenant University, Ota',
      department: 'Computer Science (B.Sc. First Class Honours)',
      cvLayout: 'executive',
      showPageNumbers: false,
      orientation: 'portrait',
      marginSize: 'narrow',
      fontFamily: 'Plus Jakarta Sans',
    },
    content: `
      <div style="margin-bottom: 18px;">
        <h1 style="margin: 0; font-size: 20pt; letter-spacing: -0.02em;">OSAHON EGHOSA VICTOR</h1>
        <p style="margin: 6px 0 0 0; font-size: 10.5pt; color: #334155;">Benin City / Lagos, Nigeria &nbsp;•&nbsp; +234 813 402 9188 &nbsp;•&nbsp; osahon.eghosa@email.com &nbsp;•&nbsp; linkedin.com/in/osahoneghosa</p>
      </div>
      <h2>PROFESSIONAL SUMMARY</h2>
      <p>First-Class Computer Science graduate and Data &amp; Operations Analyst with hands-on experience in financial reconciliation, SQL reporting, and workflow automation across Nigerian fintech and educational institutions. Proven track record of reducing reporting turnaround time from 5 days to 3 hours.</p>
      <h2>WORK EXPERIENCE</h2>
      <p><strong>Graduate Data &amp; Operations Analyst (NYSC)</strong> — Nigerian Cafe Systems Ltd, Benin City <em>(2025 – Present)</em></p>
      <ul>
        <li>Automated termly broadsheet and fee reconciliation pipelines for 12+ partner centres serving 5,000+ users.</li>
        <li>Designed interactive SQL and Excel dashboards tracking collection rates (achieving 87% on-time reconciliation).</li>
      </ul>
      <p><strong>Software Engineering Intern (SIWES)</strong> — Interswitch Group, Lagos <em>(2024)</em></p>
      <ul>
        <li>Built internal transaction monitoring scripts that flagged settlement anomalies across payment channels.</li>
      </ul>
      <h2>EDUCATION</h2>
      <p><strong>B.Sc. (Hons) Computer Science — First Class (4.78 / 5.00)</strong><br/>Covenant University, Ota, Ogun State <em>(2020 – 2024)</em></p>
      <h2>CORE SKILLS &amp; CERTIFICATIONS</h2>
      <p><strong>Technical:</strong> SQL, Python, Advanced Microsoft Excel, Power BI, Financial Modelling, Technical Documentation.<br/><strong>Certifications:</strong> Google Data Analytics Professional Certificate (2025), Microsoft Certified: Power BI Data Analyst Associate.</p>
    `,
    aiHistory: [],
  },
  {
    id: 'doc-notes-01',
    title:
      'BIO 201 Cell Signalling & Membrane Transport — Extracted Lecture Notes',
    category: 'image-to-notes',
    createdAt: '07 November 2026',
    updatedAt: '07 November 2026',
    status: 'Draft',
    syncStatus: 'saved',
    format: 'DOCX',
    metadata: {
      institution: 'Obafemi Awolowo University (OAU), Ile-Ife',
      course: 'BIO 201 — Cell Biology & Genetics',
      studentName: 'Nwosu Chidinma',
      showPageNumbers: true,
      orientation: 'portrait',
      marginSize: 'normal',
      fontFamily: 'Inter',
    },
    content: `
      <h1>BIO 201: CELL SIGNALLING &amp; MEMBRANE TRANSPORT (ORGANISED NOTES)</h1>
      <p><em>Source: 3 Handwritten Whiteboard &amp; Notebook Images — Cleaned &amp; Structured by AI</em></p>
      <h2>1. Mechanisms of Plasma Membrane Transport</h2>
      <ul>
        <li><strong>Passive Transport (No ATP required):</strong> Movement of solutes down their electrochemical concentration gradient (Simple Diffusion, Facilitated Diffusion via channel and carrier proteins, and Osmosis).</li>
        <li><strong>Active Transport (ATP required):</strong> Movement of ions or molecules against their concentration gradient. Primary example: <strong>Sodium-Potassium Pump (Na⁺/K⁺-ATPase)</strong> which exports 3 Na⁺ ions and imports 2 K⁺ ions per ATP hydrolysed.</li>
      </ul>
      <h2>2. Stages of Cellular Signal Transduction</h2>
      <ol>
        <li><strong>Reception:</strong> Extracellular signalling molecule (ligand) binds specifically to a membrane-bound receptor (e.g., G-Protein Coupled Receptor or Receptor Tyrosine Kinase).</li>
        <li><strong>Transduction:</strong> Conformational change triggers a second-messenger cascade (cAMP, IP₃, Ca²⁺) amplifying the original signal.</li>
        <li><strong>Response:</strong> Activation of transcription factors or cytosolic enzymes altering cellular metabolism or gene expression.</li>
      </ol>
      <h2>3. Quick Revision Questions (Generated from Notes)</h2>
      <ol>
        <li>Distinguish between primary active transport and secondary co-transport with one physiological example each.</li>
        <li>Why do hydrophilic peptide hormones require cell-surface receptors whereas steroid hormones bind intracellular receptors?</li>
      </ol>
    `,
    aiHistory: [],
  },
  {
    id: 'doc-free-01',
    title: 'Strategic Blueprint for Regional Renewable Microgrids in Nigeria',
    category: 'free-writing',
    createdAt: '09 November 2026',
    updatedAt: '09 November 2026',
    status: 'In Progress',
    syncStatus: 'saved',
    format: 'DOCX',
    metadata: {
      institution: 'Independent Policy Research',
      department: 'Energy Infrastructure Working Group',
      studentName: 'Victor Eghosa',
      showPageNumbers: true,
      orientation: 'portrait',
      marginSize: 'normal',
      fontFamily: 'Inter',
    },
    content: `
      <h1>STRATEGIC BLUEPRINT: REGIONAL RENEWABLE MICROGRIDS IN NIGERIA</h1>
      <p><em>An analytical policy framework for decentralised clean power infrastructure across commercial corridors.</em></p>
      <h2>1. Executive Summary</h2>
      <p>Access to reliable electricity remains the single greatest catalyst for economic growth and community welfare across Nigerian states. This paper outlines practical frameworks, modular technology architectures, and viable tariff models to scale private-public microgrid partnerships.</p>
      <h2>2. Core Pillars of Sustainable Deployment</h2>
      <ul>
        <li><strong>Standardised Turnkey Modular Design:</strong> Drastically cuts engineering planning and deployment timelines.</li>
        <li><strong>Pay-As-You-Go Digital Metering:</strong> Integrates local mobile banking channels for seamless daily collections and automated revenue assurance.</li>
        <li><strong>Local Maintenance Capacity:</strong> Empowers regional vocational graduates to oversee routine servicing and maintain 98%+ operational uptime.</li>
      </ul>
      <h2>3. Recommendations &amp; Strategic Roadmap</h2>
      <p>By streamlining state regulatory approvals and guaranteeing cost-reflective feed-in agreements, Nigeria's industrial hubs can achieve clean, resilient energy independence.</p>
    `,
    aiHistory: [],
  },
];

export interface OptionalDetailsInput {
  institution?: string;
  department?: string;
  courseCode?: string;
  studentName?: string;
  lecturer?: string;
  referencingStyle?: string;
  wordCount?: string;
}

function extractTitleFromPrompt(
  prompt: string,
  category: DocumentCategory
): string {
  const cleaned = prompt
    .replace(
      /^(write|create|generate|prepare|build|draft|make|convert)\s+(a|an|the)?\s*(project|research project|assignment|seminar|seminar paper|cv|resume|notes|study notes)?\s*(on|about|titled|for)?\s*/i,
      ''
    )
    .trim();

  if (cleaned.length >= 6) {
    const firstSentence = cleaned.split(/[.\n]/)[0].trim();
    return firstSentence.length > 90
      ? firstSentence.slice(0, 88).trim()
      : firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
  }

  switch (category) {
    case 'projects':
      return 'Academic Research Project';
    case 'assignments':
      return 'Academic Coursework Assignment';
    case 'seminars':
      return 'Academic Seminar Paper';
    case 'cv':
      return 'Professional Curriculum Vitae';
    case 'image-to-notes':
      return 'Extracted & Organised Lecture Notes';
    case 'free-writing':
      return 'Free-Form Document';
  }
}

export function generateDocumentFromNaturalPrompt(
  category: DocumentCategory,
  prompt: string,
  uploadedAttachments: { name: string; extractedText: string }[],
  optional: OptionalDetailsInput
): { title: string; content: string; metadata: DocumentItem['metadata'] } {
  const title = extractTitleFromPrompt(prompt, category);
  const inst = optional.institution || 'University of Lagos (UNILAG)';
  const dept = optional.department || 'Department of Academic Studies';
  const courseCode = optional.courseCode || 'CRS 301';
  const student = optional.studentName || 'Candidate Name';
  const lecturer = optional.lecturer || 'Dr. A. O. Okafor';
  const refStyle = optional.referencingStyle || 'APA 7th Edition';
  const uploadedContextBlock =
    uploadedAttachments.length > 0
      ? uploadedAttachments
          .map(
            (a) =>
              `<p><strong>Reference Material (${a.name}):</strong> ${a.extractedText}</p>`
          )
          .join('\n')
      : '';

  if (category === 'projects') {
    const page1 = `
      <div style="text-align: center; margin-bottom: 22px;">
        <p style="font-size: 14.5pt; font-weight: 700; text-transform: uppercase;">${title}</p>
        <p style="margin-top: 14px;">BY</p>
        <p style="font-weight: 700; font-size: 12pt; margin-top: 4px;">${student.toUpperCase()}</p>
        <p style="margin-top: 14px;">A RESEARCH PROJECT SUBMITTED TO THE ${dept.toUpperCase()}, ${inst.toUpperCase()}</p>
        <p style="margin-top: 8px;">SUPERVISOR: ${lecturer}</p>
        <p style="margin-top: 12px; font-weight: 700;">NOVEMBER, 2026</p>
      </div>
      <h1>ABSTRACT</h1>
      <p>This research project investigates <strong>${title}</strong>. Guided by the study objective (<em>"${prompt}"</em>), a descriptive cross-sectional survey design was adopted with 350 respondents selected via stratified random sampling. Empirical findings demonstrate a statistically significant relationship between the primary variables under investigation and institutional performance outcomes. Policy and operational recommendations are presented.</p>
    `.trim();

    const page2 = `
      <h1>CHAPTER ONE: INTRODUCTION</h1>
      <h2>1.1 Background to the Study</h2>
      <p>Across Nigeria and comparable developing economies, <strong>${title}</strong> has emerged as a critical focus of empirical scholarship and administrative reform. Rapid technological, economic, and institutional transformations within ${inst} and the wider sector have reshaped how stakeholders operate and evaluate outcomes.</p>
      ${uploadedContextBlock ? `<h2>1.1.1 Context from Reference Materials</h2>${uploadedContextBlock}` : ''}
      <h2>1.2 Statement of the Problem</h2>
      <p>Despite ongoing institutional initiatives addressing ${title.toLowerCase()}, empirical gaps remain regarding the specific factors that drive sustainable, measurable improvements in the study area.</p>
      <h2>1.3 Objectives of the Study</h2>
      <ol>
        <li>To examine the current practices and prevalence associated with ${title.toLowerCase()}.</li>
        <li>To identify the key determinants influencing effective implementation among respondents.</li>
        <li>To evaluate the statistically significant impact on overall performance outcomes.</li>
      </ol>
      <h2>1.4 Research Questions</h2>
      <ol>
        <li>What is the current level of adoption and awareness regarding ${title.toLowerCase()}?</li>
        <li>What are the principal factors shaping outcomes in the study setting?</li>
        <li>To what extent does ${title.toLowerCase()} significantly affect measurable performance?</li>
      </ol>
    `.trim();

    const page3 = `
      <h1>CHAPTER TWO: LITERATURE REVIEW</h1>
      <h2>2.1 Conceptual Framework</h2>
      <p>The conceptual architecture of <strong>${title}</strong> encompasses institutional readiness, operational execution, and long-term sustainability. Contemporary literature emphasizes that these dimensions interact dynamically rather than operating in isolation.</p>
      <h2>2.2 Theoretical Framework</h2>
      <p>This study is anchored on <strong>Systems Theory</strong>, which conceptualizes organizations and educational institutions as open, interdependent systems where resource inputs, transformation processes, and environmental feedback loops determine overall effectiveness.</p>
      <h2>2.3 Empirical Review of Related Studies</h2>
      <p>Okonkwo and Ibrahim (2024) surveyed 400 participants across Nigerian tertiary institutions and established a strong positive correlation (r = 0.72, p &lt; 0.05) between structured intervention frameworks and target outcomes. Similarly, Adeyemi (2025) found that institutional support accounts for 61% of variance in program success.</p>
      <h1>CHAPTER THREE: RESEARCH METHODOLOGY</h1>
      <h2>3.1 Research Design &amp; References (${refStyle})</h2>
      <p>A descriptive survey research design was employed with a sample size of 350 respondents selected via Taro Yamane's (1967) formula at a 5% margin of error.</p>
      <p><strong>References:</strong><br/>Adeyemi, T. O. (2025). Institutional resource allocation and performance metrics in Nigeria. <em>Journal of Management &amp; Policy Research</em>, 19(2), 101–119.<br/>Okonkwo, C. N., &amp; Ibrahim, M. S. (2024). Empirical assessment of operational frameworks in Nigerian tertiary institutions. <em>African Research Review</em>, 18(4), 55–73.</p>
    `.trim();

    const pagesArr = [page1, page2, page3];
    const content = pagesArr.join('\n<hr class="page-break" />\n');
    return {
      title,
      content,
      metadata: {
        institution: inst,
        department: dept,
        studentName: student,
        lecturerOrSupervisor: lecturer,
        referencingStyle: refStyle,
        headerText: title.slice(0, 50).toUpperCase(),
        showPageNumbers: true,
        orientation: 'portrait',
        marginSize: 'normal',
        fontFamily: 'Times New Roman',
        pages: pagesArr,
        pageGroups: [
          {
            id: 'grp-1',
            name: 'Group 1: Title & Abstract',
            pageIndices: [0],
            collapsed: true,
          },
          {
            id: 'grp-2',
            name: 'Group 2: Chapter One',
            pageIndices: [1],
            collapsed: true,
          },
          {
            id: 'grp-3',
            name: 'Group 3: Literature & Methodology',
            pageIndices: [2],
            collapsed: true,
          },
        ],
      },
    };
  }

  if (category === 'assignments') {
    const content = `
      <div style="margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13pt; font-weight: 700; text-transform: uppercase;">${inst} — ${dept}</p>
        <p style="margin: 4px 0 0 0; font-size: 10.5pt;"><strong>Course Code:</strong> ${courseCode} &nbsp;|&nbsp; <strong>Student:</strong> ${student} &nbsp;|&nbsp; <strong>Lecturer:</strong> ${lecturer}</p>
      </div>
      <h1>${title.toUpperCase()}</h1>
      <h2>1. Introduction and Conceptual Overview</h2>
      <p>This assignment critically examines <strong>${title}</strong> in direct response to the prompt: <em>"${prompt}"</em>. Within contemporary Nigerian and global scholarship, analysing the underlying principles, institutional dynamics, and empirical evidence surrounding this subject is essential for both theoretical mastery and practical application.</p>
      ${uploadedContextBlock ? `<h2>1.1 Reference Material Synthesis</h2>${uploadedContextBlock}` : ''}
      <h2>2. Core Theoretical and Analytical Dimensions</h2>
      <ol>
        <li><strong>Structural &amp; Policy Foundations:</strong> The regulatory and institutional mechanisms that govern how systems operate in practice.</li>
        <li><strong>Operational Efficiency &amp; Execution:</strong> The processes through which human capital, technology, and financial resources interact to deliver outcomes.</li>
        <li><strong>Socio-Economic Implications:</strong> Long-term sustainability and equity impacts across urban and rural stakeholders.</li>
      </ol>
      <h2>3. Comparative Analysis Table</h2>
      <table>
        <thead>
          <tr>
            <th>Analytical Dimension</th>
            <th>Core Mechanism</th>
            <th>Observed Implication in Nigeria</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Governance &amp; Regulation</td>
            <td>Standardized institutional compliance</td>
            <td>Reduces administrative bottlenecks and improves transparency</td>
          </tr>
          <tr>
            <td>Digital &amp; Technical Capacity</td>
            <td>Adoption of modern analytical workflows</td>
            <td>Enhances accuracy and speed of service delivery</td>
          </tr>
          <tr>
            <td>Resource Optimization</td>
            <td>Targeted allocation to priority areas</td>
            <td>Mitigates waste and strengthens resilience</td>
          </tr>
        </tbody>
      </table>
      <h2>4. Conclusion &amp; References (${refStyle})</h2>
      <p>In conclusion, addressing <strong>${title}</strong> requires coordinated policy execution, capacity development, and empirical monitoring.</p>
      <p><strong>References:</strong><br/>Adebayo, K. O., &amp; Nwankwo, C. E. (2025). Contemporary perspectives and empirical analysis of ${title.toLowerCase()}. <em>West African Journal of Academic Research</em>, 18(3), 44–62.<br/>Usman, A. B., &amp; Eze, D. N. (2026). Institutional frameworks and policy outcomes in Nigerian tertiary systems. <em>Journal of Applied Social &amp; Management Sciences</em>, 12(1), 89–107.</p>
    `;
    return {
      title,
      content,
      metadata: {
        institution: inst,
        department: dept,
        courseCode,
        studentName: student,
        lecturerOrSupervisor: lecturer,
        referencingStyle: refStyle,
        wordCountTarget: optional.wordCount || '1,500 Words',
        showPageNumbers: true,
        orientation: 'portrait',
        marginSize: 'normal',
        fontFamily: 'Times New Roman',
      },
    };
  }

  if (category === 'seminars') {
    const content = `
      <div style="text-align: center; margin-bottom: 22px;">
        <p style="font-size: 10.5pt; font-weight: 600; letter-spacing: 0.08em;">ACADEMIC SEMINAR PAPER</p>
        <h1 style="margin: 8px 0; font-size: 16.5pt;">${title.toUpperCase()}</h1>
        <p style="margin: 6px 0 0 0;"><strong>Presenter:</strong> ${student} &nbsp;|&nbsp; <strong>Department:</strong> ${dept}, ${inst}</p>
        <p style="margin: 4px 0 0 0;"><strong>Supervisor / Coordinator:</strong> ${lecturer}</p>
      </div>
      <h2>Abstract</h2>
      <p>This seminar paper explores <strong>${title}</strong> based on the scope: <em>"${prompt}"</em>. It synthesizes recent theoretical developments, technical architectures, and practical socio-economic implications while proposing actionable recommendations for industry and academic stakeholders.</p>
      <h2>1. Introduction &amp; Background</h2>
      <p>The rapid evolution of ${title.toLowerCase()} has created new opportunities and operational challenges across Nigeria. Historically, conventional approaches relied on fragmented manual workflows; modern frameworks introduce scalable, verifiable solutions.</p>
      ${uploadedContextBlock ? `<h2>1.1 Extracted Reference Context</h2>${uploadedContextBlock}` : ''}
      <h2>2. Main Thematic Discussion</h2>
      <h3>2.1 Core Operational Mechanisms</h3>
      <p>Field deployments demonstrate that aligning technical specifications with local institutional infrastructure yields superior long-term sustainability and cost efficiency.</p>
      <h3>2.2 Key Strategic Benefits</h3>
      <ul>
        <li><strong>Operational Speed:</strong> Eliminates redundant manual processing stages.</li>
        <li><strong>Quality Assurance:</strong> Establishes transparent performance benchmarks.</li>
        <li><strong>Scalability:</strong> Supports modular adoption across regional centres.</li>
      </ul>
      <h2>3. Conclusion, Recommendations &amp; References (${refStyle})</h2>
      <ol>
        <li>Adopt standardized institutional guidelines to harmonize implementation.</li>
        <li>Strengthen collaborative research between university departments and industry operators.</li>
        <li>Prioritize continuous technical training and infrastructure maintenance.</li>
      </ol>
      <p><strong>References:</strong><br/>Eze, C. U., &amp; Bello, H. A. (2025). Emerging paradigms in ${title.toLowerCase()}. <em>Nigerian Journal of Contemporary Research</em>, 14(2), 33–49.</p>
    `;
    return {
      title,
      content,
      metadata: {
        institution: inst,
        department: dept,
        studentName: student,
        lecturerOrSupervisor: lecturer,
        referencingStyle: refStyle,
        showPageNumbers: true,
        orientation: 'portrait',
        marginSize: 'normal',
        fontFamily: 'Georgia',
      },
    };
  }

  if (category === 'cv') {
    const candidateName = optional.studentName || title;
    const content = `
      <div style="margin-bottom: 18px;">
        <h1 style="margin: 0; font-size: 20pt; letter-spacing: -0.02em;">${candidateName.toUpperCase()}</h1>
        <p style="margin: 6px 0 0 0; font-size: 10.5pt; color: #334155;">Lagos / Benin City, Nigeria &nbsp;•&nbsp; +234 800 000 0000 &nbsp;•&nbsp; candidate@email.com &nbsp;•&nbsp; linkedin.com/in/candidate</p>
      </div>
      <h2>PROFESSIONAL SUMMARY</h2>
      <p>Results-driven professional tailored to your instructions (<em>"${prompt}"</em>). Combines strong analytical execution, stakeholder communication, and technical problem-solving across fast-paced Nigerian corporate and academic settings.</p>
      ${uploadedContextBlock ? `<h2>EXTRACTED PROFILE HIGHLIGHTS</h2>${uploadedContextBlock}` : ''}
      <h2>WORK EXPERIENCE</h2>
      <p><strong>Operations &amp; Research Analyst</strong> — Prime Corporate &amp; Research Solutions, Lagos <em>(2024 – Present)</em></p>
      <ul>
        <li>Spearheaded end-to-end preparation of analytical reports, project schedules, and client deliverables with 99% accuracy.</li>
        <li>Streamlined internal documentation and reporting workflows, reducing turnaround time by 45%.</li>
      </ul>
      <p><strong>Graduate Intern</strong> — Zenith Enterprise Systems <em>(2023 – 2024)</em></p>
      <ul>
        <li>Supported cross-functional project execution, data reconciliation, and executive presentation preparation.</li>
      </ul>
      <h2>EDUCATION</h2>
      <p><strong>Bachelor of Science (B.Sc.) Honours</strong> — ${dept}<br/>${inst} <em>(2019 – 2023)</em></p>
      <h2>CORE SKILLS &amp; CERTIFICATIONS</h2>
      <p><strong>Core Competencies:</strong> Data &amp; Policy Analysis • Project Coordination • Technical Report Writing • Microsoft Office &amp; AI Productivity Suite • Stakeholder Management</p>
      <h2>REFEREES</h2>
      <p>Available upon request.</p>
    `;
    return {
      title: `${candidateName.replace(/\s+/g, '_')}_CV`,
      content,
      metadata: {
        studentName: candidateName,
        institution: inst,
        department: dept,
        showPageNumbers: false,
        orientation: 'portrait',
        marginSize: 'narrow',
        fontFamily: 'Plus Jakarta Sans',
      },
    };
  }

  // Image to Notes
  const content = `
    <h1>${title.toUpperCase()}</h1>
    <p style="font-size: 10pt; color: #475569;"><strong>Source:</strong> Uploaded Reference Material &amp; Natural-Language Instructions &nbsp;|&nbsp; <strong>Mode:</strong> OCR Text Extraction + Structured Study Notes</p>
    <h2>1. Executive Summary of Material</h2>
    <p>These structured notes were organised based on your instruction: <em>"${prompt}"</em>. All core definitions, mechanisms, and key relationships from the source material have been preserved clearly.</p>
    ${
      uploadedContextBlock
        ? `<h2>2. Extracted Source Material (OCR Cleaned)</h2>${uploadedContextBlock}`
        : `<h2>2. Organised Lecture &amp; Study Notes</h2>
           <p><strong>Core Principle 1:</strong> Foundational definitions establish the scope and primary variables governing the subject matter.</p>
           <p><strong>Core Principle 2:</strong> Step-by-step mechanisms link theoretical inputs to observable empirical outputs.</p>`
    }
    <h2>3. Key Takeaways &amp; Bullet Points</h2>
    <ul>
      <li>Primary definitions and classification criteria are structured for rapid examination recall.</li>
      <li>Cause-and-effect relationships are separated into logical stages for clarity.</li>
      <li>Practical examples connect classroom theory to real-world application.</li>
    </ul>
    <h2>4. Self-Test Revision Questions</h2>
    <ol>
      <li>Define the principal concepts introduced in Section 1 and state their significance.</li>
      <li>Outline the sequential stages or mechanisms described in Section 2.</li>
      <li>Provide two applied examples illustrating how these principles operate in practice.</li>
    </ol>
  `;
  if (category === 'free-writing') {
    const content = `
      <h1>${title.toUpperCase()}</h1>
      <p style="font-size: 10.5pt; color: #475569; margin-bottom: 18px;">
        <em>Drafted with AI Assistance</em> &nbsp;|&nbsp; <strong>Author / Contributor:</strong> ${student} &nbsp;|&nbsp; <strong>Context:</strong> ${inst}
      </p>
      ${prompt ? `<p style="font-style: italic; color: #334155; margin-bottom: 16px;">Instruction Scope: "${prompt}"</p>` : ''}
      ${uploadedContextBlock ? `<h2>Source &amp; Reference Material</h2>${uploadedContextBlock}` : ''}
      <h2>1. Introduction &amp; Motivation</h2>
      <p>This document presents a comprehensive examination of <strong>${title}</strong>. Synthesising core ideas, practical perspectives, and operational realities enables a nuanced understanding of current dynamics and future trajectories.</p>
      <h2>2. Key Analysis &amp; Thematic Discussion</h2>
      <p>Addressing the core themes requires a balanced perspective that recognises both fundamental principles and empirical context. Stakeholder engagement, procedural clarity, and continuous iteration represent the foundation for long-term viability.</p>
      <ul>
        <li><strong>Structural Alignment:</strong> Aligning operational goals with modern frameworks and best practices.</li>
        <li><strong>Capacity &amp; Execution:</strong> Ensuring adequate technical, financial, and logistical preparation.</li>
        <li><strong>Scalable Impact:</strong> Establishing clear, measurable criteria for success.</li>
      </ul>
      <h2>3. Strategic Recommendations &amp; Conclusion</h2>
      <p>In conclusion, deliberate planning and systematic implementation drive sustainable value across private and public sectors. Continued monitoring and collaborative evaluation will ensure meaningful outcomes.</p>
    `;
    return {
      title,
      content,
      metadata: {
        institution: inst,
        department: dept,
        studentName: student,
        showPageNumbers: true,
        orientation: 'portrait',
        marginSize: 'normal',
        fontFamily: 'Inter',
      },
    };
  }

  return {
    title,
    content,
    metadata: {
      institution: inst,
      department: dept,
      studentName: student,
      showPageNumbers: true,
      orientation: 'portrait',
      marginSize: 'normal',
      fontFamily: 'Inter',
    },
  };
}

/**
 * Requirement 15 & 17: Modify an Existing Document with AI in the Creation Modal Workflow
 */
export function modifyExistingDocumentWithAI(
  existingDoc: DocumentItem,
  instruction: string,
  uploadedAttachments: { name: string; extractedText: string }[]
): { content: string; summary: string } {
  const p = instruction.toLowerCase();
  const refBlock =
    uploadedAttachments.length > 0
      ? uploadedAttachments
          .map(
            (a) =>
              `<p><strong>Integrated Reference (${a.name}):</strong> ${a.extractedText}</p>`
          )
          .join('\n')
      : '';

  if (p.includes('table') || p.includes('compare') || p.includes('matrix')) {
    const tableHtml = `
      <h2>Comparative Analytical Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Evaluation Criterion</th>
            <th>Baseline Observation</th>
            <th>Updated AI Synthesis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Operational Effectiveness</td>
            <td>Conventional manual workflow</td>
            <td>94.2% efficiency under modernized framework</td>
          </tr>
          <tr>
            <td>Cost &amp; Resource Impact</td>
            <td>High recurring overhead</td>
            <td>38% reduction in lifecycle expenditure</td>
          </tr>
          <tr>
            <td>Institutional Adoption</td>
            <td>Fragmented departmental uptake</td>
            <td>Standardized multi-centre deployment</td>
          </tr>
        </tbody>
      </table>
      ${refBlock}
    `;
    return {
      content: `${existingDoc.content}\n${tableHtml}`,
      summary: `Added comparative table and updated "${existingDoc.title}" based on your instruction.`,
    };
  }

  return {
    content: `${existingDoc.content}\n<h2>AI Updated Section: ${
      instruction.length < 65 ? instruction : 'Expanded Analysis & Recommendations'
    }</h2><p>In accordance with the update instruction (<em>"${instruction}"</em>), this document has been expanded with updated empirical analysis, refined academic structure, and actionable policy insights tailored to <strong>${existingDoc.title}</strong>.</p>${refBlock}`,
    summary: `Updated "${existingDoc.title}" with your instructions.`,
  };
}

/**
 * Requirement 4: Dedicated Text-Level AI Editing (Operates EXCLUSIVELY on highlighted text)
 */
export function runTextLevelAI(
  selectedText: string,
  instruction: string
): { updatedHtml: string; summary: string } {
  const clean = selectedText.trim();
  const p = instruction.toLowerCase();

  if (
    p.includes('shorter') ||
    p.includes('shorten') ||
    p.includes('concise') ||
    p.includes('summarise') ||
    p.includes('summarize')
  ) {
    const words = clean.split(/\s+/);
    const condensed =
      words.length > 16
        ? `${words.slice(0, Math.ceil(words.length * 0.55)).join(' ')}.`
        : clean;
    return {
      updatedHtml: condensed,
      summary: 'Shortened selected text for conciseness.',
    };
  }

  if (p.includes('expand') || p.includes('longer') || p.includes('elaborate')) {
    return {
      updatedHtml: `${clean} Furthermore, empirical evidence across Nigerian academic and professional institutions demonstrates that this factor plays a decisive role in shaping long-term operational efficiency, stakeholder satisfaction, and measurable policy outcomes.`,
      summary: 'Expanded the highlighted text with supporting detail.',
    };
  }

  if (
    p.includes('grammar') ||
    p.includes('correct') ||
    p.includes('fix') ||
    p.includes('proofread')
  ) {
    const corrected = clean
      .replace(/\s+/g, ' ')
      .replace(/\bi\b/g, 'I')
      .replace(/^\w/, (c) => c.toUpperCase());
    return {
      updatedHtml: corrected.endsWith('.') ? corrected : `${corrected}.`,
      summary: 'Corrected grammatical errors and punctuation.',
    };
  }

  if (p.includes('bullet') || p.includes('list')) {
    const sentences = clean
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const items =
      sentences.length > 1
        ? sentences.map((s) => `<li>${s}</li>`).join('')
        : `<li>${clean}</li>`;
    return {
      updatedHtml: `<ul>${items}</ul>`,
      summary: 'Converted highlighted text into a structured bulleted list.',
    };
  }

  if (
    p.includes('rewrite') ||
    p.includes('improve') ||
    p.includes('tone') ||
    p.includes('academic') ||
    p.includes('professional')
  ) {
    const base = clean.replace(/\.$/, '');
    return {
      updatedHtml: `Contemporary scholarship and empirical observations confirm that ${
        base.charAt(0).toLowerCase() + base.slice(1)
      }, thereby establishing a rigorous foundation for institutional excellence and evidence-based decision-making.`,
      summary: 'Rewrote highlighted text with improved academic tone and clarity.',
    };
  }

  return {
    updatedHtml: `${clean} (Refined per instruction: ${instruction})`,
    summary: `Applied "${instruction}" to the highlighted selection.`,
  };
}

/**
 * Requirement 5: Dedicated Page-Level AI Editing (Directly modifies the selected page's structure, visuals, tables, headings, or content)
 */
export function runPageLevelAI(
  currentPageHtml: string,
  pageIndex: number,
  instruction: string,
  docTitle: string,
  attachments: { name: string; extractedText: string }[] = []
): {
  updatedPageHtml: string;
  summary: string;
} {
  const p = instruction.toLowerCase();
  const refNote =
    attachments.length > 0
      ? `<p><em>Reference source integrated (${attachments
          .map((a) => a.name)
          .join(', ')}):</em> ${attachments
          .map((a) => a.extractedText)
          .join(' ')}</p>`
      : '';

  // 1. Add or organise into a table on this page
  if (p.includes('table') || p.includes('compare') || p.includes('organise the information into a table')) {
    const isEnergy =
      p.includes('energy') ||
      currentPageHtml.toLowerCase().includes('energy') ||
      docTitle.toLowerCase().includes('energy');

    const tableHtml = isEnergy
      ? `
        <h2>Comparative Analysis of Renewable Energy Sources in Nigeria</h2>
        <table>
          <thead>
            <tr>
              <th>Energy Source</th>
              <th>Average Capacity Factor</th>
              <th>Levelized Cost (USD/kWh)</th>
              <th>Suitability for Rural Clinics</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Solar PV + LiFePO4 Storage</strong></td>
              <td>24.5% (4.5–6.5 kWh/m²/day)</td>
              <td>$0.14 / kWh</td>
              <td>High — 99.5% uptime &amp; zero fuel logistics</td>
            </tr>
            <tr>
              <td><strong>Small Hydro Microgrid</strong></td>
              <td>52.0% (Seasonal river flow)</td>
              <td>$0.11 / kWh</td>
              <td>Moderate — Site-constrained to riverine zones</td>
            </tr>
            <tr>
              <td><strong>Wind Hybrid System</strong></td>
              <td>18.2% (Northern corridor)</td>
              <td>$0.19 / kWh</td>
              <td>Selective — Best in coastal &amp; plateau belts</td>
            </tr>
            <tr>
              <td><strong>Diesel Generator (Baseline)</strong></td>
              <td>Variable (Fuel dependent)</td>
              <td>$0.48 / kWh</td>
              <td>Low — High fuel cost &amp; carbon emissions</td>
            </tr>
          </tbody>
        </table>
      `
      : `
        <h2>Structured Summary &amp; Comparison Table (Page ${pageIndex + 1})</h2>
        <table>
          <thead>
            <tr>
              <th>Key Parameter</th>
              <th>Primary Indicator</th>
              <th>Observed Empirical Outcome</th>
              <th>Strategic Recommendation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Institutional Adoption</strong></td>
              <td>87.4% coverage rate</td>
              <td>Significant improvement in processing speed</td>
              <td>Expand standardized training across units</td>
            </tr>
            <tr>
              <td><strong>Resource Efficiency</strong></td>
              <td>72.0% cost optimization</td>
              <td>Reduced administrative overhead and delays</td>
              <td>Automate core reporting &amp; verification</td>
            </tr>
            <tr>
              <td><strong>Quality Assurance</strong></td>
              <td>94.1% compliance index</td>
              <td>Higher reliability and stakeholder trust</td>
              <td>Institute quarterly performance audits</td>
            </tr>
          </tbody>
        </table>
      `;

    return {
      updatedPageHtml: `${currentPageHtml}\n${tableHtml}${refNote}`,
      summary: `Created and inserted a formatted comparison table directly on Page ${pageIndex + 1}.`,
    };
  }

  // 2. Add an illustrative image / diagram directly on this page
  if (p.includes('image') || p.includes('diagram') || p.includes('illustrat') || p.includes('figure')) {
    const svgDiagram = `
      <div style="margin: 16px 0; padding: 14px; border: 1px solid #CBD5E1; background-color: #F8FAFC; text-align: center;">
        <svg width="100%" height="165" viewBox="0 0 600 165" xmlns="http://www.w3.org/2000/svg" style="max-width: 540px; margin: 0 auto; display: block;">
          <rect x="15" y="35" width="150" height="85" fill="#EFF6FF" stroke="#1447E6" stroke-width="2" rx="4" />
          <text x="90" y="72" text-anchor="middle" fill="#0D1B4C" font-size="12" font-weight="bold" font-family="sans-serif">1. Primary Input</text>
          <text x="90" y="92" text-anchor="middle" fill="#475569" font-size="10" font-family="sans-serif">Data &amp; Resource Layer</text>
          <line x1="165" y1="77" x2="220" y2="77" stroke="#1447E6" stroke-width="2" />
          <polygon points="220,77 212,72 212,82" fill="#1447E6" />
          <rect x="225" y="35" width="150" height="85" fill="#EEF2FF" stroke="#0D1B4C" stroke-width="2" rx="4" />
          <text x="300" y="72" text-anchor="middle" fill="#0D1B4C" font-size="12" font-weight="bold" font-family="sans-serif">2. Processing Engine</text>
          <text x="300" y="92" text-anchor="middle" fill="#475569" font-size="10" font-family="sans-serif">Structured Optimization</text>
          <line x1="375" y1="77" x2="430" y2="77" stroke="#1447E6" stroke-width="2" />
          <polygon points="430,77 422,72 422,82" fill="#1447E6" />
          <rect x="435" y="35" width="150" height="85" fill="#ECFDF5" stroke="#16A34A" stroke-width="2" rx="4" />
          <text x="510" y="72" text-anchor="middle" fill="#065F46" font-size="12" font-weight="bold" font-family="sans-serif">3. Verified Output</text>
          <text x="510" y="92" text-anchor="middle" fill="#047857" font-size="10" font-family="sans-serif">99.5% Reliability Target</text>
        </svg>
        <p style="margin: 8px 0 0 0; font-size: 9.5pt; color: #475569; font-style: italic;">Figure ${pageIndex + 1}.1: Architectural Illustration — ${docTitle}</p>
      </div>
    `;
    return {
      updatedPageHtml: `${currentPageHtml}\n${svgDiagram}${refNote}`,
      summary: `Inserted an illustrative architectural figure directly onto Page ${pageIndex + 1}.`,
    };
  }

  // 3. Change statistics / numbers on this page
  if (p.includes('statistic') || p.includes('figure') || p.includes('percentage') || p.includes('number')) {
    let updated = currentPageHtml
      .replace(/40%/g, '64%')
      .replace(/84%/g, '91.5%')
      .replace(/72%/g, '83.4%')
      .replace(/15 kWp/g, '25 kWp')
      .replace(/30 kWh/g, '50 kWh');

    if (updated === currentPageHtml) {
      updated = `${currentPageHtml}\n<div style="padding: 12px 16px; border-left: 3px solid #1447E6; background-color: #F8FAFC; margin: 12px 0;"><p style="margin: 0;"><strong>Updated Empirical Statistics (2026 Field Survey):</strong> Solar-battery hybrid adoption reached <strong>88.6% operational reliability</strong>, reducing annual diesel expenditure by <strong>78.4%</strong> across 120 surveyed facilities (p &lt; 0.01).</p></div>`;
    }
    return {
      updatedPageHtml: `${updated}${refNote}`,
      summary: `Updated the statistical figures and empirical metrics on Page ${pageIndex + 1}.`,
    };
  }

  // 4. Insert a suitable heading
  if (p.includes('heading') || p.includes('title')) {
    const headingText =
      instruction
        .replace(/^(insert|add|create)\s+(a\s+)?(suitable\s+)?(heading|title)\s*(for|on|about|titled)?\s*/i, '')
        .trim() || `Strategic Analysis & Empirical Overview (Page ${pageIndex + 1})`;
    return {
      updatedPageHtml: `<h2>${headingText.charAt(0).toUpperCase() + headingText.slice(1)}</h2>\n${currentPageHtml}${refNote}`,
      summary: `Inserted a structured heading at the top of Page ${pageIndex + 1}.`,
    };
  }

  // 5. Rewrite introduction on this page
  if (p.includes('rewrite') && p.includes('introduction')) {
    const temp = window.document.createElement('div');
    temp.innerHTML = currentPageHtml;
    const firstP = temp.querySelector('p');
    if (firstP) {
      firstP.innerHTML = `<strong>[Rewritten Introduction]:</strong> Within the contemporary landscape of <em>${docTitle}</em>, rigorous empirical evaluation demonstrates that integrating modern technological architectures with responsive institutional governance substantially elevates performance, reliability, and long-term sustainability across Nigerian operational centres.`;
      return {
        updatedPageHtml: `${temp.innerHTML}${refNote}`,
        summary: `Rewrote the introductory paragraph directly on Page ${pageIndex + 1}.`,
      };
    }
  }

  // 6. Improve arrangement / make page look more professional
  if (
    p.includes('arrange') ||
    p.includes('professional') ||
    p.includes('format') ||
    p.includes('layout') ||
    p.includes('restructure')
  ) {
    return {
      updatedPageHtml: `
        <div style="border-left: 3px solid #0A194E; padding-left: 14px; margin-bottom: 16px;">
          <p style="margin: 0; font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.08em; color: #1447E6; font-weight: 700;">Structured Executive Section — Page ${pageIndex + 1}</p>
        </div>
        ${currentPageHtml}
        <div style="margin-top: 16px; padding: 12px 16px; background-color: #F8FAFC; border: 1px solid #E2E8F0;">
          <p style="margin: 0; font-size: 10.5pt;"><strong>Key Page Takeaway:</strong> The analytical points presented on Page ${pageIndex + 1} have been arranged for executive clarity and academic coherence.</p>
        </div>
        ${refNote}
      `,
      summary: `Restructured and formatted Page ${pageIndex + 1} with a professional layout.`,
    };
  }

  // Default direct page modification
  return {
    updatedPageHtml: `${currentPageHtml}\n<h3>${
      instruction.length < 60 ? instruction : `Page ${pageIndex + 1} Enhancement`
    }</h3><p>In direct execution of your instruction on Page ${pageIndex + 1} (<em>"${instruction}"</em>), the content and analytical structure of this page have been updated to strengthen clarity, empirical depth, and alignment with <strong>${docTitle}</strong>.</p>${refNote}`,
    summary: `Applied your changes directly to Page ${pageIndex + 1}.`,
  };
}

/**
 * Requirement 6 & 7: Main AI Assistant Prompt Runner (Supports Entire Document, Selected Group + Specific Pages, or Individual Page, plus Uploaded Reference Documents)
 */
export function runWorkspaceAIPrompt(
  prompt: string,
  doc: DocumentItem,
  selectedText: string,
  pages?: string[],
  explicitGroupId?: string,
  explicitPageIndices?: number[],
  uploadedReferences: { name: string; extractedText: string }[] = []
): {
  summary: string;
  generatedHtml: string;
  targetGroupId?: string;
  targetGroupName?: string;
  targetPageIndices?: number[];
  directPageUpdates?: Record<number, string>;
} {
  const p = prompt.toLowerCase();
  const pageGroups: PageGroup[] = doc.metadata.pageGroups || [];
  const currentPages = pages || [doc.content];

  // 1. Check if specific page indices were selected (either individual page scope or subset of group pages)
  if (explicitPageIndices && explicitPageIndices.length > 0) {
    const directPageUpdates: Record<number, string> = {};
    explicitPageIndices.forEach((pIdx) => {
      if (pIdx >= 0 && pIdx < currentPages.length) {
        const res = runPageLevelAI(
          currentPages[pIdx],
          pIdx,
          prompt,
          doc.title,
          uploadedReferences
        );
        directPageUpdates[pIdx] = res.updatedPageHtml;
      }
    });

    const matchedGroup = explicitGroupId
      ? pageGroups.find((g) => g.id === explicitGroupId)
      : undefined;

    const firstUpdatedIdx = explicitPageIndices[0];
    return {
      summary: matchedGroup
        ? `Updated ${matchedGroup.name} (Page${explicitPageIndices.length > 1 ? 's' : ''} ${explicitPageIndices.map((i) => i + 1).join(', ')}) directly in the workspace${uploadedReferences.length > 0 ? ` using ${uploadedReferences.length} reference file(s)` : ''}.`
        : `Updated Page${explicitPageIndices.length > 1 ? 's' : ''} ${explicitPageIndices.map((i) => i + 1).join(', ')} directly in the workspace${uploadedReferences.length > 0 ? ` using ${uploadedReferences.length} reference file(s)` : ''}.`,
      generatedHtml: directPageUpdates[firstUpdatedIdx] || '',
      targetGroupId: matchedGroup?.id,
      targetGroupName: matchedGroup?.name,
      targetPageIndices: explicitPageIndices,
      directPageUpdates,
    };
  }

  // 2. Check if a Page Group was explicitly selected or mentioned in the prompt
  let matchedGroup: PageGroup | undefined = explicitGroupId
    ? pageGroups.find((g) => g.id === explicitGroupId)
    : undefined;

  if (!matchedGroup && pageGroups.length > 0) {
    matchedGroup = pageGroups.find((g) => {
      const gLower = g.name.toLowerCase();
      if (p.includes(gLower)) return true;
      const tokens = gLower.split(/[:\-–]/).map((t) => t.trim());
      return tokens.some((tok) => tok.length > 3 && p.includes(tok));
    });
  }

  if (matchedGroup && currentPages.length > 0) {
    const directPageUpdates: Record<number, string> = {};
    matchedGroup.pageIndices.forEach((pIdx) => {
      if (pIdx >= 0 && pIdx < currentPages.length) {
        const res = runPageLevelAI(
          currentPages[pIdx],
          pIdx,
          prompt,
          doc.title,
          uploadedReferences
        );
        directPageUpdates[pIdx] = res.updatedPageHtml;
      }
    });

    const firstIdx = matchedGroup.pageIndices[0] ?? 0;
    return {
      summary: `Updated ${matchedGroup.name} (Pages ${matchedGroup.pageIndices
        .map((i) => i + 1)
        .join(', ')}) directly in the workspace.`,
      generatedHtml: directPageUpdates[firstIdx] || '',
      targetGroupId: matchedGroup.id,
      targetGroupName: matchedGroup.name,
      targetPageIndices: matchedGroup.pageIndices,
      directPageUpdates,
    };
  }

  // 3. Whole-Document Scope (Detect if user mentioned a specific page number like "page 2", otherwise target active/first appropriate page)
  const pageMatch = p.match(/\bpage\s+(\d+)\b/i);
  const requestedIdx = pageMatch
    ? Math.max(0, Math.min(currentPages.length - 1, parseInt(pageMatch[1], 10) - 1))
    : Math.max(0, currentPages.length - 1);

  const pageResult = runPageLevelAI(
    currentPages[requestedIdx] || '',
    requestedIdx,
    prompt,
    doc.title,
    uploadedReferences
  );

  return {
    summary: `${pageResult.summary}${
      uploadedReferences.length > 0
        ? ` (Integrated ${uploadedReferences.map((r) => r.name).join(', ')})`
        : ''
    }`,
    generatedHtml: pageResult.updatedPageHtml,
    targetPageIndices: [requestedIdx],
    directPageUpdates: {
      [requestedIdx]: pageResult.updatedPageHtml,
    },
  };
}
