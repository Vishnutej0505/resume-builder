// One instruction per resume section type — a bullet and a skills line need
// different treatment, not one generic "make this better" prompt.
const SECTION_INSTRUCTIONS = {
  summary:
    'Rewrite this resume summary into 2-3 confident, professional sentences. No first-person pronouns.',
  experience:
    'Rewrite this into one strong resume bullet point. Start with an action verb, quantify impact only if the input already supports it, keep it under 30 words.',
  projects:
    'Rewrite this into one strong resume bullet point for a project. Start with an action verb, mention the technology used if present, keep it under 30 words.',
  education:
    'Rewrite this into a clean, professional resume line for an education entry. Keep it factual and concise.',
  skills:
    'Clean up this into a concise, comma-separated resume skills line. Do not add skills that are not mentioned.',
  certifications:
    'Rewrite this into a clean, professional resume line for a certification entry. Keep it factual and concise.',
};

// jobDescription is optional — present only for the "Full Rewrite" /
// re-tailor flow, where every bullet is rewritten with the target job in
// mind instead of just generically polished.
export function buildPrompt(sectionType, text, jobDescription) {
  const instruction = SECTION_INSTRUCTIONS[sectionType] ?? SECTION_INSTRUCTIONS.experience;
  const targetingClause = jobDescription
    ? ` Favor wording, skills, and emphasis that align with this target job description, but never invent experience the input doesn't support:\n\n${jobDescription.slice(0, 4000)}\n`
    : '';
  return `${instruction} Never invent facts, numbers, or details that are not present in the input — this is for a real job application.${targetingClause}

Input:
${text}

Rewritten version only, no preamble, no quotes around it:`;
}
