// cvPrompt.js
export function generateCVPrompt(userData, jobDescription) {
  const {
    name,
    email,
    github,
    linkedin,
    portfolio,
    bio = '',
    skills = '',
    projects = ''
  } = userData;

  const promptParts = [];

  // Job context
  promptParts.push(`The user is applying for the following job:\n"${jobDescription}"\n`);

  // User profile data
  promptParts.push(`Use the following real data to build the CV:`);

  if (name) promptParts.push(`Name: ${name}`);
  if (email) promptParts.push(`Email: ${email}`);
  if (github) promptParts.push(`GitHub: ${github}`);
  if (linkedin) promptParts.push(`LinkedIn: ${linkedin}`);
  if (portfolio) promptParts.push(`Portfolio: ${portfolio}`);
  if (bio) promptParts.push(`Bio: ${bio}`);
  if (skills) promptParts.push(`Skills:\n${skills}`);
  if (projects) promptParts.push(`Projects:\n${projects}`);

  // Final AI instructions
 // Final AI instructions
promptParts.push(`
Generate a clean, professional, plain-text CV based only on the data above.

Strict formatting rules:
- Do not use any markdown formatting (no asterisks, bold text, bullets, or dashes)
- Do not add notes, disclaimers, or footnotes
- Do not include any extra sentences explaining missing sections
- Only include real sections with actual content from the data
- Omit any section that is missing or empty (no placeholders like [List here])
- Use plain section headers with no decoration (e.g., "Technical Skills", not "**Technical Skills**")
- Output should look like a real CV and be easy to copy-paste into a PDF

Start the CV output now:
`);


  return promptParts.join('\n');
}
