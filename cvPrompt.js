export function generateCVPrompt(userData, jobDescription) {
  const { name, email, bio, linkedin, github, skills, projects } = userData;

  let prompt = `
Generate a professional and concise CV for ${name}, specifically tailored for a job with the following description:

Job Description:
"""
${jobDescription}
"""

Use the following candidate information:

---
Candidate Profile:
Name: ${name}
Email: ${email}
${linkedin ? `LinkedIn: ${linkedin}` : ''}
${github ? `GitHub: ${github}` : ''}
Bio: ${bio}
Skills: ${skills.join(', ')}

Projects:
${projects.length > 0 ? projects.map(p => `
- Project Name: ${p.name}
  Description: ${p.description}
  ${p.demo ? `Demo: ${p.demo}` : ''}
  ${p.repo ? `Repo: ${p.repo}` : ''}
  ${p.skills && p.skills.length > 0 ? `Skills: ${p.skills.join(', ')}` : ''}
`).join('\n') : 'No projects provided.'}
---

Structure the CV with the following sections. Focus on achievements and results, using strong action verbs and quantifying impact where possible. Prioritize information most relevant to the job description.

**Sections to include:**
1.  **Contact Information:** Include Name, Email, LinkedIn, and GitHub (if provided).
2.  **Summary/Professional Objective:** A concise paragraph (2-4 sentences) highlighting key qualifications and career goals, specifically tailored to the job.
3.  **Skills:** List relevant technical and soft skills. Group them logically if possible (e.g., Programming Languages, Frameworks, Tools).
4.  **Projects:** Detail your most relevant projects (2-3). For each:
    * State the Project Name.
    * Provide a brief description, emphasizing your role, technologies used, and key achievements/impact. Use bullet points for clear impact statements.
    * Include links to Live Demo and GitHub Repository if available.
5.  **Experience/Employment History (if data available):**
    * For each role, state Company Name, Job Title, and Dates (Start Year - End Year or "Present").
    * Use 2-4 bullet points to describe responsibilities and quantifiable achievements.
6.  **Certificates (if data available):**
    * List Certificate Title, Provider, and Year.
7.  **Education (if data available):**
    * State Degree, Institution, and Years attended (Start Year - End Year). Add 1-2 bullet points for relevant coursework or achievements.
8.  **Volunteering (if data available):**
    * For each role, state Role, Organization, and Dates. Use 1-2 bullet points for contributions.

**General Guidelines:**
* Use clear headings for each section.
* Use bullet points for lists and impact statements within sections.
* Keep descriptions concise and impactful.
* Omit any section that has no relevant data.
* Do not include any conversational text outside the CV content.
* Strive for a one-page CV if possible by being highly selective and concise.
`;

  return prompt;
}