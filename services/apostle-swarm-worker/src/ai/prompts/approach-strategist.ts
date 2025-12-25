/**
 * Approach Strategist Prompts
 *
 * Prompts guiding the LLM in generating personalized outreach strategies.
 * Structure mirrors approach-strategist.toml for documentation consistency.
 */

import type { EvaluationProfile } from "../resonance-evaluator";

export const TORUS_CONTEXT = {
  description: `Torus is an open-ended stake-based p2p protocol encoding biological principles of autonomy and self-organization into coordination infrastructure. It models intelligence as distributed, adaptive coordination under constraints.`,
} as const;

export const APOSTLE_SWARM = {
  description: `The Apostle Swarm is a coordination surface for targeted outreach to recruit individuals whose worldview resonates with Torus. Apostles are vetted participants who engage with high-potential prospects identified through resonance evaluation.`,
} as const;

export const STRATEGY_PRINCIPLES = [
  {
    name: "Leverage resonance points",
    guidance:
      "Use the concepts and themes that already resonate with this person's worldview.",
  },
  {
    name: "Match communication style",
    guidance: "Adapt the approach to their tone and aesthetic preferences.",
  },
  {
    name: "Provide concrete hooks",
    guidance:
      "Give specific opening messages or topics that would naturally lead into a Torus conversation.",
  },
  {
    name: "Identify risks",
    guidance:
      "Note potential pitfalls based on their patterns (e.g., if they dislike hype, avoid promotional language).",
  },
] as const;

export const STRATEGY_RULES = [
  "Be specific and actionable, not generic.",
  "Ground recommendations in the evaluation data provided.",
  "Keep hooks conversational and authentic, not salesy.",
  "The goal is genuine connection, not manipulation.",
  "Output MUST be valid JSON only, respecting all length limits.",
] as const;

export const FIELD_LIMITS = {
  recommendedAngle: { maxChars: 300 },
  narrativeFrame: { maxChars: 300 },
  hooks: { maxItems: 4, maxChars: 200 },
  risks: { maxItems: 3, maxChars: 150 },
} as const;

const formatPrinciples = (): string =>
  STRATEGY_PRINCIPLES.map(
    (p, i) => `${i + 1}. **${p.name}** — ${p.guidance}`,
  ).join("\n\n");

const formatRules = (): string =>
  STRATEGY_RULES.map((r) => `- ${r}`).join("\n");

export const buildSystemPrompt =
  (): string => `You are the Approach Strategist for Torus Apostle Swarm.

# About Torus

${TORUS_CONTEXT.description}

# About Apostle Swarm

${APOSTLE_SWARM.description}

# Your Task

Given an evaluation profile of a Twitter user, generate a personalized approach strategy for an apostle to use when reaching out. The strategy should:

${formatPrinciples()}

# Rules

${formatRules()}`;

export const buildUserPrompt = (
  xHandle: string,
  evaluationProfile: EvaluationProfile,
): string => {
  const L = FIELD_LIMITS;

  return `Generate an approach strategy for reaching out to @${xHandle}.

Evaluation Profile:
${JSON.stringify(evaluationProfile, null, 2)}

Based on this profile, provide a personalized approach strategy.

Return your strategy as a single JSON object with these fields:

{
  "recommendedAngle": "How to approach this person (max ${L.recommendedAngle.maxChars} chars)",
  "narrativeFrame": "The story/frame to use when introducing Torus (max ${L.narrativeFrame.maxChars} chars)",
  "hooks": [
    "Concrete opening message or topic 1 (max ${L.hooks.maxChars} chars)",
    "Opening message or topic 2 (max ${L.hooks.maxChars} chars)"
  ],
  "risks": [
    "Thing to avoid 1 (max ${L.risks.maxChars} chars)",
    "Thing to avoid 2 (max ${L.risks.maxChars} chars)"
  ]
}

Requirements:
- recommendedAngle: <=${L.recommendedAngle.maxChars} characters
- narrativeFrame: <=${L.narrativeFrame.maxChars} characters
- hooks: <=${L.hooks.maxItems} items, each <=${L.hooks.maxChars} characters
- risks: <=${L.risks.maxItems} items, each <=${L.risks.maxChars} characters

Ground your recommendations in the specific details from the evaluation profile. Be concrete and actionable.`;
};
