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

const ALLOWED_SECTION_TYPES = ['summary', 'education', 'experience', 'projects', 'skills', 'certifications'];

// Resume Import: parse arbitrary pasted resume text into our structured
// schema. This is extraction, not creative rewriting, so the "never invent"
// instruction matters even more here than in buildPrompt.
export function buildImportPrompt(text) {
  return `Extract the resume information below into strict JSON matching exactly this shape, nothing else:

{
  "personalInfo": { "name": string, "email": string, "phone": string, "location": string, "linkedIn": string|null },
  "sections": [
    { "type": one of ${JSON.stringify(ALLOWED_SECTION_TYPES)}, "items": [
        { "title": string, "subtitle": string|null, "dateRange": string, "bullets": [string] }
    ] }
  ]
}

Rules:
- Only include information actually present in the text below. Never invent names, dates, companies, or numbers.
- Use "" for a personalInfo field that isn't present, never omit the key.
- Skip a section type entirely if the resume has nothing for it. Never include a section with an empty items array.
- For a "skills" section, put the whole skills list as a single bullet string; leave title, subtitle, dateRange as "".
- One resume item's multiple description lines each become a separate string in "bullets".
- Output ONLY the JSON object — no markdown code fences, no commentary before or after it.

Resume text:
${text}`;
}
