export interface TeammateConfig {
  id: string;
  name: string;
  role: string;
  provider: string;
  description: string;
}

/**
 * Canonical AI Teammates config used across the application.
 * All roles and descriptions focus strictly on research, writing, analysis, planning, and review.
 * Descriptions are concise (<= 12 words) with zero mentions of code, building apps, or AI model/provider names.
 */
export const TEAMMATE_PRESETS: TeammateConfig[] = [
  {
    id: 'atlas',
    name: 'Atlas',
    role: 'Researcher',
    provider: 'gemini',
    description: 'Gathers market insights, customer signals, and competitive benchmarks.'
  },
  {
    id: 'elena',
    name: 'Elena',
    role: 'Writer',
    provider: 'openai',
    description: 'Drafts crisp product narratives, value propositions, and positioning frameworks.'
  },
  {
    id: 'nova',
    name: 'Nova',
    role: 'Analyst',
    provider: 'gemini',
    description: 'Stress-tests business assumptions, unit economics, and viability metrics.'
  },
  {
    id: 'marcus',
    name: 'Marcus',
    role: 'Planner',
    provider: 'xai',
    description: 'Structures operational roadmaps, execution milestones, and launch phases.'
  },
  {
    id: 'iris',
    name: 'Iris',
    role: 'Reviewer',
    provider: 'perplexity',
    description: 'Audits strategic blind spots, risk factors, and final deliverables.'
  }
];
