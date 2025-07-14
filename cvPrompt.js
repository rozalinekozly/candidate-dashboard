export function generateCVPrompt(userData, jobDescription) {
  const {
    name,
    email,
    github,
    linkedin,
    portfolio,
    bio = '',
    skills = [],
    projects = []
  } = userData;

  const prompt = [];

  // Job context
  prompt.push(`The user is applying for the following job:\n"${jobDescription}"\n`);

  // Instructions for GPT
  prompt.push(`Based on the filtered projects and user profile data below, write a clean, professional, plain-text CV tailored to this job. Your responsibilities:

Now, write the final CV using ONLY the data above. You MUST preserve all real project names and descriptions unless told otherwise. Do not invent project names or add generic summaries.

The CV should be structured as follows:

1. Candidate Info: Full name and contact (email, GitHub)
2. Short Professional Summary (Bio)
3. Education
4. Technical Skills grouped by topic
5. 1–3 Projects — each in this exact format:
   - Project Name (must be exactly as provided)
   - Rewritten description using only the original project data, tailored to the job description
   - GitHub link if present, otherwise omit
   - Live Demo link if present, otherwise omit
   - Skills used (from original data)

Strict rules:
- Do not invent or rename projects
- Do not say "N/A" if GitHub or demo links are missing — just omit the field entirely
- Do not add any explanations or comments
- Do not use markdown, emojis, or decorative symbols
- Output a clean, plain-text CV directly

--- User Profile ---`);

  if (name) prompt.push(`Name: ${name}`);
  if (email) prompt.push(`Email: ${email}`);
  if (github) prompt.push(`GitHub: ${github}`);
  if (linkedin) prompt.push(`LinkedIn: ${linkedin}`);
  if (portfolio) prompt.push(`Portfolio: ${portfolio}`);
  if (bio) prompt.push(`Bio:\n${bio}`);

  if (skills.length) {
    prompt.push(`Skills:\n${skills.join(', ')}`);
  }

  if (projects.length) {
    prompt.push(`Relevant Projects:\n`);
    projects.forEach((p, i) => {
      prompt.push(`Project ${i + 1}:
Name: ${p.name}
Description: ${p.description}
Live Demo: ${p.demo}
GitHub: ${p.repo}
Skills: ${Array.isArray(p.skills) ? p.skills.join(', ') : 'N/A'}
`);
    });
  }

  prompt.push(`Now write the CV output.`);

  return prompt.join('\n');
}
