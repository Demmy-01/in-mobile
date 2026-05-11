/**
 * lib/nvidia.ts  — NVIDIA NIM API client
 */

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'meta/llama-3.1-8b-instruct';

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

  return `You are a senior CV writer specialising in Nigerian university internship applications.

Your task: Write a complete, professional CV by combining the student's Supabase profile data with the additional information they provided during this session. Follow ALL rules below strictly.

━━━━━━━━━━━━━━━━━━━━━━━━━
RULES (follow every one):
━━━━━━━━━━━━━━━━━━━━━━━━━
1. Use the student's EXACT education, experience, and project entries. Do NOT replace or omit them.
2. Only REFINE the wording to sound professional — do not change facts, companies, roles, or dates.
3. If a section has "[AI NOTE: No ... provided]", follow the instruction in that note exactly.
4. The summary must reflect their actual background — mention their real department, skills, and target role.
5. Skills must come from their profile skill list. Categorise them logically. Add soft skills based on their bio/experience.
6. Hobbies must come from their profile hobbies list. Only use the ones listed.
7. Return ONLY valid JSON — no markdown, no explanation, no code fences.
8. Do not go out of context. Everything in the output must be grounded in the data provided below.

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
  const apiKey = process.env.EXPO_PUBLIC_NVIDIA_API_KEY;

  console.log('[NVIDIA] API key present:', Boolean(apiKey));
  if (!apiKey) {
    throw new Error(
      'NVIDIA API key not found. Fully restart Expo with: npx expo start --tunnel --clear'
    );
  }

  console.log('[NVIDIA] Calling API for role:', ctx.targetRole);

  let response: Response;
  try {
    response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a CV writer. Respond only with valid JSON. No markdown, no code fences, no explanation.',
          },
          { role: 'user', content: buildPrompt(ctx) },
        ],
        temperature: 0.4,
        max_tokens: 1800,
        stream: false,
      }),
    });
  } catch (networkErr: any) {
    throw new Error(`Network error: ${networkErr.message}`);
  }

  console.log('[NVIDIA] Response status:', response.status);

  if (!response.ok) {
    const errText = await response.text().catch(() => 'unknown error');
    console.error('[NVIDIA] API error:', errText);
    throw new Error(`NVIDIA API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const raw: string = data.choices?.[0]?.message?.content ?? '';

  if (!raw) throw new Error('NVIDIA API returned an empty response. Please try again.');

  // Extract JSON even if model adds surrounding text
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

  if (!jsonMatch) throw new Error('AI response did not contain valid JSON. Please try again.');

  try {
    const parsed = JSON.parse(jsonMatch[0]) as CVData;
    console.log('[NVIDIA] Parsed OK. Summary:', parsed.summary?.slice(0, 60));
    return parsed;
  } catch {
    throw new Error('Could not parse AI response. Please try again.');
  }
}
