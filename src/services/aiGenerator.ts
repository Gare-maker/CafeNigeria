import {
  CategoryMeta,
  DocumentCategory,
  DocumentItem,
  PageGroup,
} from '../types';

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
    modalTitle: 'Create Project',
    modalSubtitle:
      'Describe the research project you want to generate. You can type, speak or upload reference materials.',
    placeholder:
      'Describe the research project you want to create (e.g., "Write Chapters 1 to 3 on the impact of social media on academic performance among undergraduate students at the University of Benin...")',
  },
  assignments: {
    heading: 'Create assignments faster with AI.',
    supportingText:
      'Generate, edit and organise your academic assignments with AI assistance.',
    buttonLabel: 'Create Assignment',
    modalTitle: 'Create Assignment',
    modalSubtitle:
      'Describe the assignment you want to generate. You can type, speak or upload reference materials.',
    placeholder:
      'Describe the assignment you want to create (e.g., "Write a 1,500-word assignment on monetary policy instruments and inflation control in Nigeria with APA 7th references...")',
  },
  seminars: {
    heading: 'Create seminar papers faster with AI.',
    supportingText: 'Generate and format seminar papers with AI assistance.',
    buttonLabel: 'Create Seminar',
    modalTitle: 'Create Seminar',
    modalSubtitle:
      'Describe the seminar paper you want to generate. You can type, speak or upload reference materials.',
    placeholder:
      'Describe the seminar paper you want to create (e.g., "Prepare a final year seminar paper on renewable energy microgrids for rural healthcare electrification in Nigeria...")',
  },
  cv: {
    heading: 'Create professional CVs faster with AI.',
    supportingText: 'Build professional CVs tailored to your career goals.',
    buttonLabel: 'Create CV',
    modalTitle: 'Create CV',
    modalSubtitle:
      'Describe your background, work experience, education and target role. You can type, speak or upload an existing CV or image.',
    placeholder:
      'Describe your details for the CV (e.g., "Create a professional CV for Osahon Eghosa, First Class Computer Science graduate from Covenant University applying for a Data Analyst role in Lagos...")',
  },
  'image-to-notes': {
    heading: 'Create organised notes faster with AI.',
    supportingText:
      'Turn pictures, handwritten materials and documents into organised notes.',
    buttonLabel: 'Create Notes',
    modalTitle: 'Create Notes from Image',
    modalSubtitle:
      'Upload images of handwritten notes, textbooks or lecture boards, and describe how you want your notes organised.',
    placeholder:
      'Describe how you want the extracted material organised (e.g., "Convert the uploaded lecture board images on cell signalling into structured headings, bullet points and 5 revision questions...")',
  },
};

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-proj-01',
    title:
      'The Impact of Social Media on Academic Performance Among University Students',
    category: 'projects',
    createdAt: '2026-11-04 09:15',
    updatedAt: '2026-11-07 21:40',
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
        },
        {
          id: 'grp-ch1',
          name: 'Group 2: Chapter One',
          pageIndices: [1],
        },
        {
          id: 'grp-ch2',
          name: 'Group 3: Chapter Two',
          pageIndices: [2],
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
    createdAt: '2026-11-06 14:20',
    updatedAt: '2026-11-07 18:12',
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
      <div style="border-bottom: 2px solid #0A194E; padding-bottom: 12px; margin-bottom: 20px;">
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
    createdAt: '2026-11-05 11:05',
    updatedAt: '2026-11-07 15:30',
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
    createdAt: '2026-11-03 16:40',
    updatedAt: '2026-11-07 12:15',
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
      <div style="border-bottom: 2px solid #0A194E; padding-bottom: 14px; margin-bottom: 18px;">
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
    createdAt: '2026-11-07 08:50',
    updatedAt: '2026-11-07 19:05',
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
    const content = `
      <div style="text-align: center; margin-bottom: 28px;">
        <p style="font-size: 15pt; font-weight: 700; text-transform: uppercase;">${title}</p>
        <p style="margin-top: 20px;">BY</p>
        <p style="font-weight: 700; font-size: 12.5pt; margin-top: 6px;">${student.toUpperCase()}</p>
        <p style="margin-top: 20px;">A RESEARCH PROJECT SUBMITTED TO THE ${dept.toUpperCase()}, ${inst.toUpperCase()}</p>
        <p style="margin-top: 12px;">SUPERVISOR: ${lecturer}</p>
        <p style="margin-top: 16px; font-weight: 700;">NOVEMBER, 2026</p>
      </div>
      <h1>ABSTRACT</h1>
      <p>This research project investigates <strong>${title}</strong>. Driven by the user instruction (<em>"${prompt}"</em>), a descriptive cross-sectional survey design was adopted with 350 respondents selected via stratified random sampling. Empirical findings demonstrate a statistically significant relationship between the primary variables under investigation and institutional performance outcomes. Policy and operational recommendations are presented.</p>
      <hr class="page-break" />
      <h1>CHAPTER ONE: INTRODUCTION</h1>
      <h2>1.1 Background to the Study</h2>
      <p>Across Nigeria and comparable developing economies, <strong>${title}</strong> has emerged as a critical focus of empirical scholarship and administrative reform. Rapid technological, economic, and institutional transformations within ${inst} and the wider sector have reshaped how stakeholders operate and evaluate outcomes.</p>
      <p>Understanding the structural and behavioural determinants of this subject is essential to bridge the persistent gap between policy formulation and practical field execution.</p>
      ${uploadedContextBlock ? `<h2>1.1.1 Context Extracted from Uploaded Reference Materials</h2>${uploadedContextBlock}` : ''}
      <h2>1.2 Statement of the Problem</h2>
      <p>Despite ongoing institutional initiatives addressing ${title.toLowerCase()}, empirical gaps remain regarding the specific factors that drive sustainable, measurable improvements in the study area.</p>
      <h2>1.3 Objectives of the Study</h2>
      <ol>
        <li>To examine the current practices and prevalence associated with ${title.toLowerCase()}.</li>
        <li>To identify the key determinants influencing effective implementation among respondents.</li>
        <li>To evaluate the statistically significant impact on overall performance outcomes.</li>
        <li>To proffer actionable, evidence-based recommendations for stakeholders.</li>
      </ol>
      <h2>1.4 Research Questions</h2>
      <ol>
        <li>What is the current level of adoption and awareness regarding ${title.toLowerCase()}?</li>
        <li>What are the principal factors shaping outcomes in the study setting?</li>
        <li>To what extent does ${title.toLowerCase()} significantly affect measurable performance?</li>
      </ol>
      <hr class="page-break" />
      <h1>CHAPTER TWO: LITERATURE REVIEW</h1>
      <h2>2.1 Conceptual Framework</h2>
      <p>The conceptual architecture of <strong>${title}</strong> encompasses institutional readiness, operational execution, and long-term sustainability. Contemporary literature emphasizes that these dimensions interact dynamically rather than operating in isolation.</p>
      <h2>2.2 Theoretical Framework</h2>
      <p>This study is anchored on <strong>Systems Theory</strong>, which conceptualizes organizations and educational institutions as open, interdependent systems where resource inputs, transformation processes, and environmental feedback loops determine overall effectiveness.</p>
      <h2>2.3 Empirical Review of Related Studies</h2>
      <p>Okonkwo and Ibrahim (2024) surveyed 400 participants across Nigerian tertiary institutions and established a strong positive correlation (r = 0.72, p &lt; 0.05) between structured intervention frameworks and target outcomes. Similarly, Adeyemi (2025) found that institutional support accounts for 61% of variance in program success.</p>
      <hr class="page-break" />
      <h1>CHAPTER THREE: RESEARCH METHODOLOGY</h1>
      <h2>3.1 Research Design &amp; Population</h2>
      <p>A descriptive survey research design was employed. Applying Taro Yamane's (1967) finite population formula at a 5% margin of error, a sample size of 350 respondents was selected through stratified simple random sampling.</p>
      <h2>3.2 Method of Data Analysis &amp; References (${refStyle})</h2>
      <p>Primary data collected via a validated 4-point Likert scale questionnaire were analysed using descriptive statistics (mean scores) and Pearson Product-Moment Correlation.</p>
      <p><strong>References:</strong><br/>Adeyemi, T. O. (2025). Institutional resource allocation and performance metrics in Nigeria. <em>Journal of Management &amp; Policy Research</em>, 19(2), 101–119.<br/>Okonkwo, C. N., &amp; Ibrahim, M. S. (2024). Empirical assessment of operational frameworks in Nigerian tertiary institutions. <em>African Research Review</em>, 18(4), 55–73.</p>
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
        headerText: title.slice(0, 50).toUpperCase(),
        showPageNumbers: true,
        orientation: 'portrait',
        marginSize: 'normal',
        fontFamily: 'Times New Roman',
        pageGroups: [
          {
            id: 'grp-1',
            name: 'Group 1: Title & Abstract',
            pageIndices: [0],
          },
          {
            id: 'grp-2',
            name: 'Group 2: Chapter One',
            pageIndices: [1],
          },
          {
            id: 'grp-3',
            name: 'Group 3: Chapter Two',
            pageIndices: [2],
          },
          {
            id: 'grp-4',
            name: 'Group 4: Methodology & References',
            pageIndices: [3],
          },
        ],
      },
    };
  }

  if (category === 'assignments') {
    const content = `
      <div style="border-bottom: 2px solid #0A194E; padding-bottom: 12px; margin-bottom: 20px;">
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
      <div style="text-align: center; border-bottom: 2px solid #0A194E; padding-bottom: 16px; margin-bottom: 22px;">
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
      <div style="border-bottom: 2px solid #0A194E; padding-bottom: 14px; margin-bottom: 18px;">
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

export function runWorkspaceAIPrompt(
  prompt: string,
  doc: DocumentItem,
  selectedText: string,
  pages?: string[],
  explicitGroupId?: string
): {
  summary: string;
  generatedHtml: string;
  targetGroupId?: string;
  targetGroupName?: string;
} {
  const p = prompt.toLowerCase();
  const cleanSelection = selectedText.trim();
  const pageGroups: PageGroup[] = doc.metadata.pageGroups || [];

  // 1. Check if a Page Group was explicitly selected or mentioned in the prompt (Section 11)
  let matchedGroup: PageGroup | undefined = explicitGroupId
    ? pageGroups.find((g) => g.id === explicitGroupId)
    : undefined;

  if (!matchedGroup && pageGroups.length > 0) {
    matchedGroup = pageGroups.find((g) => {
      const gLower = g.name.toLowerCase();
      if (p.includes(gLower)) return true;
      // Also match "group 1", "chapter one", "chapter two", "references", etc.
      const tokens = gLower.split(/[:\-–]/).map((t) => t.trim());
      return tokens.some((tok) => tok.length > 3 && p.includes(tok));
    });
  }

  if (matchedGroup && pages && pages.length > 0) {
    const groupHtml = matchedGroup.pageIndices
      .map((idx) => pages[idx] || '')
      .join('\n');
    const plainGroupText = groupHtml
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (p.includes('summarise') || p.includes('summarize')) {
      return {
        summary: `Summarised ${matchedGroup.name} (Pages ${matchedGroup.pageIndices.map((i) => i + 1).join(', ')}).`,
        generatedHtml: `${groupHtml}\n<h3>Summary of ${matchedGroup.name}</h3><p>${plainGroupText.slice(0, 240)}... Key findings and structural points within ${matchedGroup.name} have been synthesised for clarity.</p>`,
        targetGroupId: matchedGroup.id,
        targetGroupName: matchedGroup.name,
      };
    }

    return {
      summary: `Reviewed and improved ${matchedGroup.name} (Pages ${matchedGroup.pageIndices.map((i) => i + 1).join(', ')}) without modifying other groups.`,
      generatedHtml: `${groupHtml}\n<p><em>[AI Group Refinement — ${matchedGroup.name}]:</em> Furthermore, the arguments and transitions within this section have been strengthened in accordance with your instruction ("${prompt}") to ensure cohesive academic flow across ${matchedGroup.name}.</p>`,
      targetGroupId: matchedGroup.id,
      targetGroupName: matchedGroup.name,
    };
  }

  // 2. Highlighted Text Interaction (Section 6.1 – 6.3)
  if (cleanSelection) {
    if (p.includes('rewrite') || p.includes('academic') || p.includes('tone')) {
      return {
        summary: 'Rewritten selected text in a formal, scholarly academic tone.',
        generatedHtml: `<p>Empirical scholarship increasingly underscores that ${
          cleanSelection.charAt(0).toLowerCase() +
          cleanSelection.slice(1).replace(/\.$/, '')
        }, representing a pivotal analytical dimension within contemporary research and institutional policy.</p>`,
      };
    }

    if (
      p.includes('expand') ||
      p.includes('elaborate') ||
      p.includes('argument')
    ) {
      return {
        summary:
          'Expanded the selected passage with supporting arguments and institutional context.',
        generatedHtml: `<p>${cleanSelection} Furthermore, recent empirical investigations across Nigerian tertiary and administrative institutions demonstrate that this phenomenon is reinforced by structural, technological, and behavioural factors. When evaluated over a multi-year horizon, stakeholders that implement structured frameworks around this principle consistently achieve stronger, verifiable outcomes.</p>`,
      };
    }

    if (
      p.includes('summarise') ||
      p.includes('summarize') ||
      p.includes('shorten')
    ) {
      const words = cleanSelection.split(/\s+/);
      const shortText =
        words.length > 18
          ? words.slice(0, 18).join(' ') + '...'
          : cleanSelection;
      return {
        summary: 'Condensed the selected passage into a concise summary.',
        generatedHtml: `<p><strong>Key Point:</strong> ${shortText}</p>`,
      };
    }

    if (
      p.includes('grammar') ||
      p.includes('spelling') ||
      p.includes('correct') ||
      p.includes('fix')
    ) {
      return {
        summary: 'Corrected grammar, punctuation, and sentence clarity.',
        generatedHtml: `<p>${cleanSelection.replace(/\s+/g, ' ').trim()}</p>`,
      };
    }

    if (p.includes('explain') || p.includes('simplify')) {
      return {
        summary:
          'Provided a clear, accessible explanation of the selected passage.',
        generatedHtml: `<p>${cleanSelection}</p><p><em>In simple terms:</em> This means that the core factors described above directly shape how effectively the system performs in everyday practice.</p>`,
      };
    }

    return {
      summary: `Applied your instruction ("${prompt}") to the selected passage.`,
      generatedHtml: `<p>${cleanSelection} — refined and expanded to address: ${prompt}.</p>`,
    };
  }

  // 3. Whole-document prompts
  if (p.includes('summarise') || p.includes('summarize')) {
    return {
      summary: 'Generated a concise executive summary of the current document.',
      generatedHtml: `<h3>Executive Summary</h3><p>This document (<em>${doc.title}</em>) synthesizes the core background, analytical framework, empirical observations, and actionable recommendations required for academic and professional submission.</p>`,
    };
  }

  if (p.includes('continue') || p.includes('expand')) {
    return {
      summary: 'Continued writing from the current document context.',
      generatedHtml: `<p>Building upon the preceding analysis, empirical observations across Nigerian institutions confirm that sustained alignment between policy design and frontline implementation significantly improves long-term outcomes. Consequently, integrating structured evaluation metrics with continuous capacity building remains essential.</p>`,
    };
  }

  if (p.includes('reference') || p.includes('citation') || p.includes('apa')) {
    return {
      summary: `Generated formatted references (${
        doc.metadata.referencingStyle || 'APA 7th Edition'
      }).`,
      generatedHtml: `<h2>References (${
        doc.metadata.referencingStyle || 'APA 7th Edition'
      })</h2><p>Adebowale, R. T., &amp; Olatunji, S. A. (2025). Empirical dimensions and policy implications of ${doc.title.toLowerCase()}. <em>Nigerian Journal of Applied Research</em>, 22(3), 114–132.</p><p>Chukwuma, E. N., &amp; Danjuma, Y. I. (2024). Institutional capacity and socio-economic outcomes in West Africa. <em>Lagos Review of Social &amp; Management Sciences</em>, 15(1), 41–59.</p>`,
    };
  }

  return {
    summary: `Generated new section for: "${prompt}"`,
    generatedHtml: `<h2>${
      prompt.length < 70 ? prompt : 'Additional Section'
    }</h2><p>In examining <strong>${prompt}</strong> within the context of <em>${doc.title}</em>, both theoretical literature and field evidence highlight the importance of structured methodology, institutional support, and measurable performance benchmarks.</p>`,
  };
}
