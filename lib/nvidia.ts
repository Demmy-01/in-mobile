/**
 * lib/nvidia.ts  — NVIDIA NIM API client
 */

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'meta/llama-3.1-8b-instruct';

// ─── Shared fetch helper ─────────────────────────────────────────────────────
async function callNvidiaAPI(systemPrompt: string, userPrompt: string, maxTokens = 1800): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA API key not found. Restart Expo with: npx expo start --tunnel --clear');

  let response: Response;
  try {
    response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: maxTokens,
        stream: false,
      }),
    });
  } catch (e: any) {
    throw new Error(`Network error: ${e.message}`);
  }

  if (!response.ok) {
    const err = await response.text().catch(() => 'unknown');
    throw new Error(`NVIDIA API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw: string = data.choices?.[0]?.message?.content ?? '';
  if (!raw) throw new Error('NVIDIA API returned an empty response.');
  return raw;
}

function extractJSON(raw: string): any {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  const match = cleaned.match(/[\s\S]*/);
  const jsonMatch = cleaned.match(/{[\s\S]*}/);
  if (!jsonMatch) throw new Error('AI response did not contain valid JSON.');
  return JSON.parse(jsonMatch[0]);
}

// ─── Interview: Question Types ───────────────────────────────────────────────
export interface InterviewQuestion {
  id: string;
  type: 'technical' | 'behavioural' | 'scenario' | 'general';
  question: string;
}

export interface InterviewQA {
  question: InterviewQuestion;
  answer: string;
}

export interface QuestionFeedback {
  questionId: string;
  score: number;        // 0–10
  feedback: string;
  suggestion: string;
}

export interface InterviewGrade {
  overallScore: number;       // 0–100
  grade: string;              // 'A', 'B', 'C', 'D', 'F'
  strengths: string[];
  weaknesses: string[];
  perQuestion: QuestionFeedback[];
  summary: string;
}

// ─── Generate 7 role-specific questions ─────────────────────────────────────
export async function generateInterviewQuestions(role: string): Promise<InterviewQuestion[]> {
  const systemPrompt = 'You are an expert technical interviewer. Respond ONLY with valid JSON. No markdown, no explanation.';
  const userPrompt = `Generate exactly 7 smart, role-specific interview questions for a student applying for: "${role}".

Mix the types: 2 technical, 2 behavioural, 2 scenario-based, 1 general.
Make them realistic, challenging but fair for a university student intern.

Return ONLY this JSON (no extra text):
{
  "questions": [
    { "id": "1", "type": "technical", "question": "..." },
    { "id": "2", "type": "behavioural", "question": "..." },
    { "id": "3", "type": "scenario", "question": "..." },
    { "id": "4", "type": "technical", "question": "..." },
    { "id": "5", "type": "behavioural", "question": "..." },
    { "id": "6", "type": "scenario", "question": "..." },
    { "id": "7", "type": "general", "question": "..." }
  ]
}`;

  const raw = await callNvidiaAPI(systemPrompt, userPrompt, 900);
  const parsed = extractJSON(raw);
  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('AI did not return valid questions.');
  }
  return parsed.questions as InterviewQuestion[];
}

// ─── Grade a completed interview session ────────────────────────────────────
export async function gradeInterviewSession(role: string, qaList: InterviewQA[]): Promise<InterviewGrade> {
  const systemPrompt = 'You are a strict but fair interview coach. Respond ONLY with valid JSON. No markdown, no explanation.';

  const answersBlock = qaList.map((qa, i) =>
    `Q${i + 1} [${qa.question.type}]: ${qa.question.question}\nAnswer: ${qa.answer.trim() || '(No answer provided)'}`
  ).join('\n\n');

  const userPrompt = `You are grading a mock interview for the role: "${role}".

Here are the student's questions and answers:

${answersBlock}

Grade each answer honestly. Consider: relevance, depth, structure (STAR method for behavioural), technical accuracy.

Return ONLY this JSON:
{
  "overallScore": <0-100 integer>,
  "grade": "<A|B|C|D|F>",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "summary": "2-3 sentence overall assessment of the student's performance.",
  "perQuestion": [
    { "questionId": "1", "score": <0-10>, "feedback": "what they did well or poorly", "suggestion": "how to improve this answer" }
  ]
}`;

  const raw = await callNvidiaAPI(systemPrompt, userPrompt, 1400);
  const parsed = extractJSON(raw) as InterviewGrade;
  return parsed;
}

export interface CVData {
  summary: string;
  education: { institution: string; degree: string; period: string; gpa?: string }[];
  experience: { company: string; role: string; period: string; description: string }[];
  skills: { category: string; items: string[] }[];
  projects: { title: string; description: string; technologies: string[] }[];
  hobbies: string[];
  targetRole: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  period: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface ProjectEntry {
  title: string;
  description: string;
  technologies: string; // comma-separated string
}

export interface StudentContext {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  level: string;
  bio?: string;
  skills: string[];
  hobbies: string[];
  gpa?: number;
  linkedinUrl?: string;
  portfolioUrl?: string;
  targetRole: string;
  educationEntries: EducationEntry[];
  experienceEntries: ExperienceEntry[];
  projectEntries: ProjectEntry[];
}

function buildEducationBlock(ctx: StudentContext): string {
  if (ctx.educationEntries.length === 0) {
    return `[AI NOTE: Student provided no education entries. Include their university as the only entry:
  - Institution: Redeemer's University, Ede, Nigeria
  - Degree: B.Sc. ${ctx.department}
  - Period: 2021 – Present
  - GPA: ${ctx.gpa ?? 'Not stated'}]`;
  }
  return ctx.educationEntries.map((e, i) =>
    `Entry ${i + 1}:
  Institution: ${e.institution}
  Degree/Course: ${e.degree}
  Period: ${e.period || 'Not specified'}`
  ).join('\n\n');
}

function buildExperienceBlock(ctx: StudentContext): string {
  if (ctx.experienceEntries.length === 0) {
    return '[AI NOTE: No experience provided by student. Do NOT fabricate any. Return an empty array [] for "experience" in the JSON.]';
  }
  return ctx.experienceEntries.map((e, i) =>
    `Entry ${i + 1}:
  Company: ${e.company}
  Role: ${e.role}
  Period: ${e.period || 'Not specified'}
  Description (student\'s words): "${e.description || 'Not provided'}"`
  ).join('\n\n');
}

function buildProjectsBlock(ctx: StudentContext): string {
  if (ctx.projectEntries.length === 0) {
    return `[AI NOTE: No projects provided. Generate 2 plausible academic projects based on the student's skills (${ctx.skills.join(', ') || 'general computing'}) and their department (${ctx.department}) — make them realistic for a Nigerian university student.]`;
  }
  return ctx.projectEntries.map((p, i) =>
    `Entry ${i + 1}:
  Title: ${p.title}
  Description (student\'s words): "${p.description || 'Not provided'}"
  Technologies: ${p.technologies || 'Not specified'}`
  ).join('\n\n');
}

function buildPrompt(ctx: StudentContext): string {
  const hasExperience = ctx.experienceEntries.length > 0;

  return `You are an expert ATS-optimised CV writer and career coach specialising in Nigerian university internship applications.

Your task: Write a complete, highly professional, ATS-optimised CV by combining the student's profile data with the information they provided. The CV must be TAILORED for the role: "${ctx.targetRole}". Follow ALL rules below strictly.

━━━━━━━━━━━━━━━━━━━━━━━━━
RULES (follow every one):
━━━━━━━━━━━━━━━━━━━━━━━━━
1. Use the student's EXACT education, experience, and project entries. Do NOT replace, omit, or fabricate any facts, companies, roles, or dates.
2. AMPLIFY the wording: rewrite their descriptions using strong action verbs and industry-standard keywords that match the target role "${ctx.targetRole}". Make every bullet point impactful and specific.
3. KEYWORD OPTIMISATION: Weave in high-value ATS keywords relevant to "${ctx.targetRole}" throughout the summary, experience descriptions, and project descriptions. Use the same terminology a hiring manager for this role would search for.
4. If a section has "[AI NOTE: No ... provided]", follow the instruction in that note exactly.
5. The summary must be compelling, 3-4 sentences, mention their real department, amplified skills, and target role "${ctx.targetRole}" with ATS keywords. Written in third person.
6. Skills must come from their profile skill list. Categorise them logically. Add relevant technical and soft skills based on their bio, experience, and what a "${ctx.targetRole}" recruiter expects.
7. Hobbies must come from their profile hobbies list. Only use the ones listed.
8. Return ONLY valid JSON — no markdown, no explanation, no code fences.
9. Do not fabricate facts. Everything must be grounded in the data below — only the WORDING is upgraded, not the facts.

━━━━━━━━━━━━━━━━━━━━━━━━━
STUDENT PROFILE (from database):
━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${ctx.firstName} ${ctx.lastName}
Email: ${ctx.email}
Phone: ${ctx.phone ?? 'Not provided'}
University: Redeemer's University, Ede, Osun State, Nigeria
Department: ${ctx.department}
Current Level: ${ctx.level}
GPA: ${ctx.gpa ?? 'Not stated'}
Bio: ${ctx.bio ?? 'Not provided'}
Profile Skills: ${ctx.skills.join(', ') || 'None listed'}
Profile Hobbies: ${ctx.hobbies.join(', ') || 'None listed'}
LinkedIn: ${ctx.linkedinUrl ?? 'Not provided'}
Portfolio: ${ctx.portfolioUrl ?? 'Not provided'}
Target Internship Role: ${ctx.targetRole}

━━━━━━━━━━━━━━━━━━━━━━━━━
EDUCATION & TRAINING (entered by student this session):
━━━━━━━━━━━━━━━━━━━━━━━━━
${buildEducationBlock(ctx)}

━━━━━━━━━━━━━━━━━━━━━━━━━
WORK EXPERIENCE (entered by student this session):
━━━━━━━━━━━━━━━━━━━━━━━━━
${buildExperienceBlock(ctx)}

━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECTS (entered by student this session):
━━━━━━━━━━━━━━━━━━━━━━━━━
${buildProjectsBlock(ctx)}

━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT (strict JSON, all fields required):
━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "summary": "3-4 sentence professional summary. Must mention: name or role context, department/university, key skills from profile, and target role (${ctx.targetRole}). Written in third person.",
  "education": [{ "institution": "exact institution name from input", "degree": "exact degree/course from input", "period": "exact period from input", "gpa": "only include if GPA is known" }],
  "experience": ${hasExperience ? '[{ "company": "exact company from input", "role": "exact role from input", "period": "exact period from input", "description": "refined professional version of student description, 1-2 sentences, include measurable impact if possible" }]' : '[]'},
  "skills": [{ "category": "Technical Skills", "items": ["from profile skill list"] }, { "category": "Soft Skills", "items": ["inferred from bio and experience"] }],
  "projects": [{ "title": "exact title from input or AI-generated if none provided", "description": "one concise impact sentence", "technologies": ["split from input or inferred"] }],
  "hobbies": ${JSON.stringify(ctx.hobbies.length > 0 ? ctx.hobbies : ['Reading', 'Problem Solving', 'Continuous Learning'])},
  "targetRole": "${ctx.targetRole}"
}`;
}

export async function generateCVWithAI(ctx: StudentContext): Promise<CVData> {
  console.log('[NVIDIA] Calling API for role:', ctx.targetRole);
  const raw = await callNvidiaAPI(
    'You are a CV writer. Respond only with valid JSON. No markdown, no code fences, no explanation.',
    buildPrompt(ctx),
    2400
  );
  const parsed = extractJSON(raw) as CVData;
  console.log('[NVIDIA] Parsed OK. Summary:', parsed.summary?.slice(0, 60));
  return parsed;
}

// ─── Smart Internship Match Evaluator ─────────────────────────────────────────

export interface MatchEvaluationRequest {
  id: string;
  title: string;
  description: string;
  requirements: string[];
}

export async function evaluateInternshipMatches(
  studentProfile: { department: string; level: string; skills: string[]; bio?: string },
  listings: MatchEvaluationRequest[]
): Promise<Record<string, number>> {
  if (listings.length === 0) return {};

  const systemPrompt =
    'You are an expert internship recruiter and career advisor. Your job is to score how well a student profile matches internship listings. Respond ONLY with a valid JSON object. No markdown, no explanation, no extra text.';

  const listingsBlock = listings
    .map(l =>
      `[${l.id}] "${l.title}"
  Required Skills: ${l.requirements?.join(', ') || 'Not specified'}
  Description: ${(l.description || 'Not provided').slice(0, 180)}`
    )
    .join('\n\n');

  const exampleKeys = listings.slice(0, 3).map(l => `"${l.id}": 82`).join(', ');

  const userPrompt = `You are scoring internship fit for the following student. Be PRECISE and DIFFERENTIATED — do not give everyone similar scores.

STUDENT PROFILE:
- Department: ${studentProfile.department}
- Academic Level: ${studentProfile.level}
- Skills: ${studentProfile.skills.join(', ') || 'None listed'}
- About: ${(studentProfile.bio || 'No bio provided').slice(0, 200)}

INTERNSHIP LISTINGS TO SCORE:
${listingsBlock}

SCORING CRITERIA (apply all four, weigh them together):
1. SKILLS MATCH (40%) – How many of the required skills does the student have? Look for exact matches AND semantic equivalents (e.g. "JS" ≈ "JavaScript", "React" ≈ "Frontend", "Figma" ≈ "UI Design"). Partial matches count for partial credit.
2. DEPARTMENT RELEVANCE (30%) – Does the student's department/field of study logically prepare them for this role? e.g. Computer Science → Software roles; Mass Comm → Marketing/Media; Accounting → Finance.
3. EXPERIENCE LEVEL FIT (15%) – Is the student's academic level (100L–500L) appropriate for the internship? Mid-level students (300L/400L) should score higher for most roles.
4. BIO / INTENT ALIGNMENT (15%) – Does the student's bio description suggest interest, motivation or experience relevant to this role?

SCORING SCALE:
- 85–99: Excellent match (strong skill overlap, perfect department fit, high intent signal)
- 70–84: Good match (most skills covered, department aligns, reasonable fit)
- 50–69: Partial match (some skills missing, indirect department match, some potential)
- 30–49: Low match (few relevant skills, department is tangentially related)
- 0–29:  Poor match (little overlap, misaligned department, wrong skill set)

IMPORTANT RULES:
- Give genuinely different scores — do not cluster around 70. Some should be high (85+), some low (20-40).
- Score based on evidence in the profile, not assumptions.
- Return ONLY a JSON object. Keys = the bracketed IDs (as strings). Values = integer scores 0-99.
Example format: {${exampleKeys}}`;

  try {
    console.log('[NVIDIA] Scoring', listings.length, 'internships for:', studentProfile.department, '|', studentProfile.skills.join(', '));
    const raw = await callNvidiaAPI(systemPrompt, userPrompt, 500);
    console.log('[NVIDIA] Raw AI response:', raw.slice(0, 600));
    const parsed = extractJSON(raw) as Record<string, number>;
    console.log('[NVIDIA] AI scores:', JSON.stringify(parsed));
    return parsed;
  } catch (err) {
    console.error('[NVIDIA] Match evaluation failed:', err);
    return {};
  }
}

