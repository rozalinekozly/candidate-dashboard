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

  // 1. Establish User's Core Profile and Strengths FIRST
  prompt.push(`--- User Profile ---`);
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
    prompt.push(`Relevant Projects (Original Data - DO NOT CHANGE NAMES OR CORE DESCRIPTIONS):\n`);
    projects.forEach((p, i) => {
      prompt.push(`Project ${i + 1}:
Name: ${p.name}
Description: ${p.description}
Live Demo: ${p.demo || 'N/A'}
GitHub: ${p.repo || 'N/A'}
Skills: ${Array.isArray(p.skills) ? p.skills.join(', ') : 'N/A'}
`);
    });
  }

  // 2. Introduce the Job Context
  prompt.push(`\n--- Job Application Details ---`);
  prompt.push(`The user is applying for the following job:\n"${jobDescription}"\n`);

  // 3. Clear Instructions for GPT - Emphasize User Data, then Relevance
  prompt.push(`Based *strictly* on the "User Profile" data provided above (Bio, Skills, and "Relevant Projects" original descriptions), write a clean, professional, plain-text CV.

Your primary goal is to present the user's qualifications clearly and concisely.
Your secondary goal is to subtly highlight how the user's existing skills and project achievements are relevant to the job description, *without inventing or exaggerating*.

The CV should be structured as follows:

1.  Candidate Info: Full name and contact (email, GitHub, LinkedIn, Portfolio - include if provided)
2.  Short Professional Summary (Based on Bio, emphasizing key strengths)
3.  Education (Placeholder for now, as it's not in userData, but keep structure)
4.  Technical Skills (Grouped by topic if possible, directly from user's skills)
5.  1–3 Key Projects (Choose the most relevant ones. For each project):
    * Project Name (MUST be exactly as provided in "Original Data")
    * A concise description (1-2 sentences) that *summarizes the original project description* and *briefly connects its relevance* to the job's technical requirements. Focus on what the user *did* and *achieved*.
    * GitHub link (if present, otherwise omit)
    * Live Demo link (if present, otherwise omit)
    * Skills used (list directly from original data)

Strict rules for CV output:
-   DO NOT invent or rename projects. Use the "Project Name" exactly as given.
-   DO NOT add generic summaries or phrases like "Proven ability to..." unless directly inferable from the provided bio/projects.
-   For project descriptions: Summarize the *original* description. Only *briefly* hint at job relevance if a clear, direct connection exists.
-   If GitHub or demo links are missing, OMIT the field entirely (do not say "N/A").
-   Output a clean, plain-text CV directly.
-   DO NOT use markdown (except for headings like "Professional Summary"), emojis, or decorative symbols.
-   DO NOT add any explanations, comments, or conversational text.

Now, write the final CV output.`
  );

  return prompt.join('\n');
}