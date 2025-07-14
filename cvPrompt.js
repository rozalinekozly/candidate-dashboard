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
  prompt.push(`The user is applying for this job:\n"${jobDescription}"\n`);

  // Instructions for AI
  prompt.push(`Your task is to generate a strong, concise, and tailored CV that fits this job. Follow these steps:

1. Select only the most relevant projects from the list below, based on the job description.
2. Rewrite the project descriptions to emphasize the relevant technical skills, tools, and impact.
3. Summarize the user's core skills that match the job.
4. Maintain a professional, confident tone without exaggeration.
5. Keep the CV easy to read in plain text with no markdown or decorations.
6. Omit any section that is missing or empty.
7. Only include real content based on the data.
8. Do not explain anything — just write the CV directly.

--- User Data ---`);

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
    prompt.push(`Projects:\n`);
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

  prompt.push(`Now, write the plain-text CV based only on this data. Do NOT mention any projects that are not relevant to the job description.`);

  return prompt.join('\n');
}
