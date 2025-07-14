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

- Rewrite project descriptions to match the job tone and showcase impact.
- Summarize skills relevant to the job.
- Do not fabricate any information.
- Use plain section headers (e.g., "Technical Skills", "Projects").
- Do not include markdown, bullets, emojis, or any decorative symbols.
- Omit any empty or irrelevant sections.
- Start directly with the CV. Do not explain or introduce anything.

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
