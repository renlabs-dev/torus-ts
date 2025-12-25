/**
 * Resonance Evaluator Prompts
 *
 * Prompts guiding the LLM in evaluating Twitter profiles for Torus resonance.
 * Structure mirrors resonance-evaluator.toml for documentation consistency.
 */

export const TORUS_CONTEXT = {
  description: `Torus is an open-ended stake-based p2p protocol encoding biological principles of autonomy and self-organization into coordination infrastructure.

Torus models intelligence as distributed, adaptive coordination under constraints: agents self-assemble, specialize, and align through recursive delegation, shared incentives, and feedback. It treats organization as a living process, not a fixed structure.`,

  keyConcepts: [
    "Distributed coordination and swarm intelligence",
    "Stake-weighted governance and resource allocation",
    "Recursive delegation hierarchies",
    "Constraint-based autonomy",
    "Emergent organization through feedback loops",
    "Cybernetic principles applied to social systems",
  ],
} as const;

export const RESONANCE_DIMENSIONS = [
  {
    name: "Orientation to complexity",
    question: "Do they perceive systems as interdependent, adaptive, alive?",
  },
  {
    name: "Epistemic depth",
    question:
      "Do they reason in gradients, feedbacks, tradeoffs, rather than binaries?",
  },
  {
    name: "Coordination sense",
    question:
      "Do they explore how cooperation or intelligence emerges across agents or scales?",
  },
  {
    name: "Tone & aesthetic",
    question:
      "Expression shows depth more than performance; curiosity > outrage; irony without cynicism.",
  },
  {
    name: "Cultural adjacency",
    question:
      "Any visible orbit around complexity, cybernetics, distributed systems, evolution, or philosophy of organization.",
  },
] as const;

export const EVALUATION_RULES = {
  positive: [
    "Look at how they think, not what they talk about.",
    "Reward pattern-level curiosity, tolerance for uncertainty, and systemic reasoning.",
  ],
  negative: ["Penalize moral grandstanding, binary worldviews, or pure hype."],
  corePrinciple:
    "Resonance = alignment with Torus' view of intelligence as distributed, adaptive coordination under constraint.",
} as const;

export const OUTPUT_CONSTRAINTS = {
  dataIntegrity: [
    "Do not fabricate quotes or examples; if none are available, leave the examples array empty.",
    "Prefer information density over adjectives; do not restate Torus context in your output.",
  ],
  brevity: [
    "Output MUST be valid JSON only (no prose or headers).",
    "Obey hard limits from the user prompt; if needed, drop low-salience items rather than exceed limits.",
  ],
} as const;

export const FIELD_LIMITS = {
  mainTopics: { maxItems: 5, maxWords: 3 },
  communicationStyle: { maxChars: 140 },
  overallScore: { min: 0, max: 10 },
  relevantConcepts: { maxItems: 3 },
  concept: { maxWords: 3 },
  examples: { maxItems: 2, maxChars: 120 },
  alignment: { maxChars: 120 },
  summary: { maxChars: 240 },
  keyThemes: { maxItems: 3 },
  themeDescription: { maxChars: 120 },
  notablePatterns: { maxItems: 5, maxWords: 6 },
  overallAssessment: { maxChars: 280 },
} as const;

const formatKeyConcepts = (): string =>
  TORUS_CONTEXT.keyConcepts.map((c) => `- ${c}`).join("\n");

const formatDimensions = (): string =>
  RESONANCE_DIMENSIONS.map(
    (d, i) => `${i + 1}. **${d.name}** — ${d.question}`,
  ).join("\n\n");

const formatRules = (): string => {
  const positiveRules = EVALUATION_RULES.positive.map((r) => `- ${r}`);
  const negativeRules = EVALUATION_RULES.negative.map((r) => `- ${r}`);
  return [
    ...positiveRules,
    ...negativeRules,
    `- ${EVALUATION_RULES.corePrinciple}`,
  ].join("\n");
};

const formatOutputConstraints = (): string => {
  const dataRules = OUTPUT_CONSTRAINTS.dataIntegrity.map((r) => `- ${r}`);
  const brevityRules = OUTPUT_CONSTRAINTS.brevity.map((r) => `- ${r}`);
  return [...dataRules, ...brevityRules].join("\n");
};

export const buildSystemPrompt = (): string => `You are the resonance evaluator.

Your job is to read a Twitter profile and recent tweets, and judge how strongly this person's worldview resonates with Torus—an open-ended stake-based p2p protocol encoding biological principles of autonomy and self-organization into coordination infrastructure.

# About Torus

${TORUS_CONTEXT.description}

Key concepts:
${formatKeyConcepts()}

# Your Task

Your task is to detect conceptual resonance, not vocabulary or tone similarity. A person need not mention Torus to fit its worldview.

Evaluate intuitively across five dimensions:

${formatDimensions()}

# Rules

${formatRules()}

# Constraints

${formatOutputConstraints()}`;

export const buildUserPrompt = (
  xHandle: string,
  xBio: string | null,
  tweetTexts: string[],
): string => {
  const tweets = tweetTexts
    .map((text, i) => `Tweet ${i + 1}: ${text}`)
    .join("\n\n");
  const bioSection = xBio ? `Bio: ${xBio}\n\n` : "";
  const L = FIELD_LIMITS;

  return `Analyze the following Twitter profile:

Handle: @${xHandle}
${bioSection}${tweets}

Return your analysis as a single JSON object ONLY (no extra text), following these HARD LIMITS:

- mainTopics: ≤${L.mainTopics.maxItems} items; each 1~${L.mainTopics.maxWords} words.
- communicationStyle: ≤${L.communicationStyle.maxChars} characters.
- torusRelevance.overallScore: integer ${L.overallScore.min}-${L.overallScore.max}.
- torusRelevance.relevantConcepts: ≤${L.relevantConcepts.maxItems} items.
  - concept: 1~${L.concept.maxWords} words.
  - examples: ≤${L.examples.maxItems} items; each ≤${L.examples.maxChars} characters (or empty if none available).
  - alignment: ≤${L.alignment.maxChars} characters.
- torusRelevance.summary: ≤${L.summary.maxChars} characters.
- keyThemes: ≤${L.keyThemes.maxItems} items; description ≤${L.themeDescription.maxChars} characters each.
- notablePatterns: ≤${L.notablePatterns.maxItems} items; each ≤${L.notablePatterns.maxWords} words.
- overallAssessment: ≤${L.overallAssessment.maxChars} characters.

If you must cut, drop the least-salient items rather than exceed limits. Do not invent specifics.

Provide your analysis in EXACTLY this JSON schema (field names unchanged):

{
  "mainTopics": ["topic1", "topic2", "topic3"],
  "communicationStyle": "≤${L.communicationStyle.maxChars} chars",
  "torusRelevance": {
    "overallScore": 7,
    "relevantConcepts": [
      {
        "concept": "Torus concept name (1~${L.concept.maxWords} words)",
        "examples": ["example ≤${L.examples.maxChars} chars", "example ≤${L.examples.maxChars} chars"],
        "alignment": "≤${L.alignment.maxChars} chars explaining align/diverge"
      }
    ],
    "summary": "≤${L.summary.maxChars} chars"
  },
  "keyThemes": [
    {
      "theme": "theme name",
      "frequency": "often/sometimes/rarely",
      "description": "≤${L.themeDescription.maxChars} chars"
    }
  ],
  "notablePatterns": ["pattern1", "pattern2"],
  "overallAssessment": "≤${L.overallAssessment.maxChars} chars"
}`;
};
