/**
 * lib/matchScore.ts
 * Shared smart internship match scoring — used by both home.tsx and search.tsx.
 * Produces consistent, differentiated scores that reflect real profile relevance.
 *
 * Scoring breakdown (max 99, min capped by mismatch penalty):
 *   Skills match (direct + semantic)   → up to 40 pts
 *   Department ↔ role alignment         → up to 25 pts
 *   Bio / description keyword match     → up to 15 pts
 *   Profile skills found in job text    → up to 10 pts
 *   Base score                          →      9 pts
 *   Mismatch penalty (no skill overlap) → down up to -20 pts
 */

// ── Semantic skill synonym map ────────────────────────────────────────────────
// Maps canonical groups → common variants so "ReactJS" matches "React", etc.
const SKILL_SYNONYMS: Record<string, string[]> = {
  javascript: ['js', 'es6', 'es2015', 'node', 'nodejs', 'typescript', 'ts'],
  react:      ['reactjs', 'react.js', 'react native', 'nextjs', 'next.js'],
  python:     ['django', 'flask', 'fastapi', 'pandas', 'numpy', 'pytorch', 'tensorflow'],
  design:     ['ui', 'ux', 'ui/ux', 'figma', 'adobe xd', 'sketch', 'canva', 'illustrator', 'graphic design'],
  frontend:   ['html', 'css', 'sass', 'tailwind', 'bootstrap', 'vue', 'angular', 'svelte'],
  backend:    ['api', 'rest', 'graphql', 'sql', 'database', 'postgres', 'mysql', 'mongodb'],
  mobile:     ['android', 'ios', 'flutter', 'swift', 'kotlin', 'expo'],
  data:       ['excel', 'power bi', 'tableau', 'analytics', 'machine learning', 'ml', 'ai', 'statistics'],
  marketing:  ['seo', 'sem', 'social media', 'content', 'copywriting', 'ads', 'campaigns', 'branding'],
  finance:    ['accounting', 'bookkeeping', 'financial analysis', 'excel', 'quickbooks', 'ifrs'],
  writing:    ['content writing', 'technical writing', 'documentation', 'blogging', 'editing'],
};

/** True if two skill strings are semantically equivalent */
function skillsMatch(a: string, b: string): boolean {
  if (a.includes(b) || b.includes(a)) return true;
  for (const synonyms of Object.values(SKILL_SYNONYMS)) {
    if (synonyms.some(s => a.includes(s)) && synonyms.some(s => b.includes(s))) return true;
  }
  return false;
}

// ── Department → role keyword mapping ────────────────────────────────────────
const DEPT_ROLE_MAP: Record<string, string[]> = {
  'computer science':        ['software', 'developer', 'engineer', 'frontend', 'backend', 'fullstack', 'data', 'mobile', 'web', 'tech', 'devops', 'cloud'],
  'information technology':  ['it', 'support', 'network', 'systems', 'cloud', 'security', 'devops', 'tech', 'software'],
  'electrical engineering':  ['hardware', 'embedded', 'electronics', 'iot', 'circuit', 'automation', 'control', 'power'],
  'mechanical engineering':  ['cad', 'manufacturing', 'production', 'design', 'maintenance', 'fabrication', 'engineering'],
  'civil engineering':       ['construction', 'structural', 'planning', 'surveying', 'site', 'architecture'],
  'business administration': ['management', 'operations', 'strategy', 'admin', 'business', 'project', 'coordinator'],
  'accounting':              ['finance', 'audit', 'tax', 'accounting', 'bookkeeping', 'financial', 'treasury'],
  'economics':               ['research', 'analysis', 'finance', 'policy', 'data', 'economics', 'analyst'],
  'mass communication':      ['media', 'journalism', 'content', 'pr', 'marketing', 'communications', 'social media', 'broadcast'],
  'marketing':               ['marketing', 'brand', 'sales', 'digital', 'content', 'advertising', 'campaigns', 'growth'],
  'law':                     ['legal', 'compliance', 'contract', 'corporate', 'counsel', 'paralegal', 'regulatory'],
  'medicine':                ['health', 'medical', 'clinical', 'research', 'pharma', 'biotech', 'laboratory'],
  'pharmacy':                ['pharma', 'drug', 'clinical', 'health', 'laboratory', 'biotech'],
  'nursing':                 ['health', 'medical', 'clinical', 'patient', 'care', 'nursing'],
  'microbiology':            ['laboratory', 'research', 'biotech', 'pharma', 'clinical', 'health', 'science'],
  'biochemistry':            ['laboratory', 'research', 'biotech', 'pharma', 'clinical', 'health', 'chemistry'],
  'architecture':            ['design', 'cad', 'structural', 'planning', 'construction', 'interior'],
  'graphic design':          ['design', 'ui', 'ux', 'creative', 'visual', 'brand', 'figma', 'adobe'],
  'public administration':   ['government', 'public', 'policy', 'admin', 'management', 'coordinator'],
  'sociology':               ['research', 'community', 'social', 'ngo', 'development', 'coordinator'],
  'psychology':              ['hr', 'human resources', 'research', 'counseling', 'social', 'wellbeing'],
};

export interface ScoringProfile {
  skills: string[];
  department: string;
  bio?: string;
}

export interface ScoringListing {
  id: string;
  title: string;
  description?: string | null;
  required_skills?: string[] | null;
}

/**
 * computeLocalMatch — deterministic, instant, no network required.
 *
 * Key improvement over the old function: if there is NO skill overlap at all
 * (and the job has real skill requirements), a mismatch penalty is applied
 * so the score reflects a genuinely poor fit rather than a flat ~70.
 */
export function computeLocalMatch(listing: ScoringListing, profile: ScoringProfile): number {
  const titleLower = (listing.title || '').toLowerCase();
  const deptLower  = (profile.department || '').toLowerCase();
  const pSkills    = (profile.skills || []).map(s => s.toLowerCase());
  const rSkills    = (listing.required_skills || []).map(s => s.toLowerCase());
  const descLower  = (listing.description || '').toLowerCase();
  const bioLower   = (profile.bio || '').toLowerCase();
  const allJobText = `${titleLower} ${descLower}`;

  let score = 9; // base — everyone starts here
  let skillMatched = 0;

  // ── 1. Skills match (up to 40 pts) ────────────────────────────────────────
  if (rSkills.length > 0 && pSkills.length > 0) {
    skillMatched = rSkills.filter(r => pSkills.some(p => skillsMatch(p, r))).length;
    score += Math.round((skillMatched / rSkills.length) * 40);
  } else if (pSkills.length > 0) {
    // No required_skills set — check profile skills against job text
    const matched = pSkills.filter(s => allJobText.includes(s)).length;
    skillMatched = matched;
    score += Math.min(20, matched * 7);
  }

  // ── 2. Department ↔ role alignment (up to 25 pts) ─────────────────────────
  let deptScore = 0;

  // Exact department words found in job title/description
  const deptWords = deptLower.split(/[\s/]+/).filter(w => w.length > 3);
  for (const w of deptWords) {
    if (allJobText.includes(w)) deptScore = Math.max(deptScore, 15);
  }

  // Semantic department → role keyword mapping
  for (const [deptKey, roleKeywords] of Object.entries(DEPT_ROLE_MAP)) {
    if (deptLower.includes(deptKey)) {
      const overlap = roleKeywords.filter(kw => allJobText.includes(kw)).length;
      deptScore = Math.max(deptScore, Math.min(25, overlap * 8));
    }
  }
  score += deptScore;

  // ── 3. Bio keyword match (up to 15 pts) ───────────────────────────────────
  if (bioLower.length > 10) {
    const bioWords = bioLower.split(/\s+/).filter(w => w.length > 4);
    const bioMatches = bioWords.filter(w => allJobText.includes(w)).length;
    score += Math.min(15, bioMatches * 3);
  }

  // ── 4. Profile skills appear in job text (up to 10 pts) ───────────────────
  const skillsInText = pSkills.filter(s => allJobText.includes(s)).length;
  score += Math.min(10, skillsInText * 4);

  // ── 5. Mismatch penalty — penalise genuinely unrelated roles ──────────────
  // If the job has listed skill requirements and the student matches NONE of them,
  // cap the score much lower to reflect a poor fit rather than inflating to ~70.
  if (rSkills.length >= 3 && skillMatched === 0 && deptScore === 0) {
    // No skill overlap AND no department alignment → very poor fit
    score = Math.min(score, 22);
  } else if (rSkills.length >= 2 && skillMatched === 0 && deptScore < 10) {
    // No skill overlap, weak department alignment → low match
    score = Math.min(score, 38);
  }

  return Math.min(99, Math.max(5, score));
}
