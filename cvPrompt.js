export function generateCVPrompt(userData, jobDescription) {
  const { name, email, bio, linkedin, github, skills, projects } = userData;

  let prompt = `
Generate a professional and concise CV for ${name}, tailored specifically for a job with the following description:

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
- **${p.name}**: ${p.description}
  ${p.demo ? `  (Demo: ${p.demo})` : ''}
  ${p.repo ? `  (Repo: ${p.repo})` : ''}
  ${p.skills && p.skills.length > 0 ? `  Skills: ${p.skills.join(', ')}` : ''}
`).join('\n') : 'No projects provided.'}
---

Structure the CV with the following sections, using clear headings and bullet points where appropriate. Focus on achievements and results, using strong action verbs. Prioritize information most relevant to the job description.

**Sections to include:**
1.  **Contact Information:** Name, Email, LinkedIn, GitHub (if provided).
2.  **Summary/Professional Objective:** A concise paragraph (2-4 sentences) highlighting key qualifications and career goals, specifically tailored to the job description.
3.  **Skills:** A list of relevant technical and soft skills, ideally categorized (e.g., Programming Languages, Frameworks, Tools, Soft Skills). Only include skills relevant to the job description or prominently featured in projects.
4.  **Projects:** Detail 2-3 most relevant projects. For each project:
    * Project Name
    * Brief description emphasizing your role, technologies used, and quantifiable achievements/impact. Use bullet points for impact.
    * Link to Live Demo (if applicable)
    * Link to GitHub Repository (if applicable)
5.  **Experience/Employment History (if available in user data, otherwise omit):**
    * Company Name, Job Title, Dates (Start Year - End Year or "Present")
    * 2-4 bullet points describing responsibilities and achievements. Use action verbs and quantify results.
6.  **Certificates (if available in user data, otherwise omit):**
    * Certificate Title, Provider, Year
7.  **Education (if available in user data, otherwise omit):**
    * Degree, Institution, Years (Start Year - End Year), relevant coursework/achievements (1-2 bullet points).
8.  **Volunteering (if available in user data, otherwise omit):**
    * Role, Organization, Dates (Start Year - End Year or "Present"), 1-2 bullet points describing contributions.

**Formatting Guidelines:**
* Use Markdown for headings ('#', '##', '###'), bold text (`**text**`), and bullet points (`* item` or `- item`).
* Keep bullet points concise and impactful.
* Ensure consistency in formatting across sections.
* Do not include any introductory or concluding remarks outside the CV content itself.
* If a section has no relevant data, omit it entirely from the output.
* Limit the CV to maximum one page if possible, prioritizing the most impactful information.
`;

  return prompt;
}