import { supabase } from './db.js'; // Import the Supabase client
import { generateCVPrompt } from './cvPrompt.js'; // Import the CV prompt generator
//import { generatePDF } from './cvPdfGenerator.js'; // Import the PDF generator function


let userId = null;
let userProjects = [];
let currentEditingIndex = null;
let projectIndexToDelete = null;
let currentUserProfile = {};
let userCertificates = [];
let userEmployment = [];
let userVolunteering = [];


// Load profile, reads the user data from the database
async function loadUserData() {
  userId = sessionStorage.getItem('user_id'); // Get user ID from session storage
  if (!userId) return; // If no user ID, redirect to login

  const { data } = await supabase.from('user_profiles').select('*').eq('id', userId).single(); // Fetch user profile data
  if (!data) return; // If no data found, do nothing

  currentUserProfile = data; // Store the profile data for later use

  ['full_name', 'email', 'bio', 'linkedin_url', 'portfolio_url', 'github_url'].forEach(id => {
    document.getElementById(id).value = data[id] || '';
  }); // Populate the form fields with user data

  document.getElementById('static_full_name').textContent = data.full_name || ''; // Display user data in static fields
  document.getElementById('static_email').textContent = data.email || '';
  document.getElementById('static_bio').textContent = data.bio || '';
  document.getElementById('static_linkedin').textContent = data.linkedin_url || '';
  document.getElementById('static_linkedin').href = data.linkedin_url || '#';
  document.getElementById('static_portfolio').textContent = data.portfolio_url || '';
  document.getElementById('static_portfolio').href = data.portfolio_url || '#';
  document.getElementById('static_github').textContent = data.github_url || '';
  document.getElementById('static_github').href = data.github_url || '#';

  userProjects = Array.isArray(data.projects) ? data.projects : []; // Ensure projects is an array
  renderProjects(); // Render the projects on the page
  userCertificates = Array.isArray(data.certificates) ? data.certificates : [];
userEmployment = Array.isArray(data.employment) ? data.employment : [];
userVolunteering = Array.isArray(data.volunteering) ? data.volunteering : [];

renderEmployment(); // Render employment history
renderCertificates(); // Render certificates
renderVolunteering(); // Render volunteering experiences

}

//projects
function renderProjects() { // Function to render user projects on the dashboard
  const container = document.getElementById('projects-list');
  container.innerHTML = ''; // Clear the container before rendering

  if (!userProjects.length) {
    container.innerHTML = '<p class="text-gray-400">No projects yet.</p>';
    return;
  }

  userProjects.forEach((project, index) => { // Loop through each project and create a card
    const card = document.createElement('div');
    card.className = 'border border-gray-700 p-4 rounded bg-gray-950 relative';
    const confirmBoxId = `confirm-box-${index}`;

    card.innerHTML = `
      <h4 class="text-lg font-semibold text-blue-300">${project.name}</h4>
      <p class="text-sm mt-1"><strong>Description:</strong> ${project.desc}</p>
      <p class="text-sm"><strong>Live Demo:</strong> <a href="${project.demo}" target="_blank" class="text-blue-400 underline">${project.demo}</a></p>
      <p class="text-sm"><strong>GitHub:</strong> <a href="${project.repo}" target="_blank" class="text-blue-400 underline">${project.repo}</a></p>
      <p class="text-sm"><strong>Skills:</strong> ${Array.isArray(project.skills) ? project.skills.join(', ') : 'N/A'}</p>
      <div class="flex gap-2 mt-3">
        <button class="edit-btn bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-black" data-index="${index}">✏️ Edit</button>
        <button class="delete-btn bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white" data-index="${index}" data-confirm="${confirmBoxId}">🗑️ Delete</button>
      </div>
      <div id="${confirmBoxId}" class="confirm-box hidden mt-3 bg-gray-800 text-sm text-white border border-red-500 p-3 rounded">
        <p class="mb-2">Are you sure you want to delete <strong>${project.name}</strong>?</p>
        <div class="flex gap-3">
          <button class="confirm-delete bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white">✅ Yes</button>
          <button class="cancel-delete bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-white">❌ Cancel</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  document.querySelectorAll('.delete-btn').forEach(btn => { // Add click event to delete buttons
    btn.onclick = (e) => { // Show confirmation box when delete button is clicked
      const index = +e.target.dataset.index;
      const boxId = e.target.dataset.confirm;
      projectIndexToDelete = index;
      document.querySelectorAll('.confirm-box').forEach(el => el.classList.add('hidden')); // Hide all confirm boxes
      document.getElementById(boxId).classList.remove('hidden');
    };
  });

  document.querySelectorAll('.confirm-delete').forEach(btn => { // Add click event to confirm delete buttons
    btn.onclick = async () => {
      if (projectIndexToDelete !== null) {
        userProjects.splice(projectIndexToDelete, 1); // Remove the project from the array
        projectIndexToDelete = null; // Reset the index after deletion
        await saveProjectsToDB(); // Save the updated projects to the database
      }
    };
  });

  document.querySelectorAll('.cancel-delete').forEach(btn => { // Add click event to cancel delete buttons
    btn.onclick = (e) => {
      e.target.closest('.confirm-box').classList.add('hidden');
      projectIndexToDelete = null; // Reset the index if deletion is cancelled
    };
  });

  document.querySelectorAll('.edit-btn').forEach(btn => { // Add click event to edit buttons
    btn.onclick = (e) => {
      const index = +e.target.dataset.index;
      const p = userProjects[index];
      currentEditingIndex = index;
      // Populate the form with the project data for editing
      document.getElementById('project_name').value = p.name;
      document.getElementById('project_desc').value = p.desc;
      document.getElementById('project_demo').value = p.demo;
      document.getElementById('project_repo').value = p.repo;
      document.getElementById('project_skills').value = (p.skills || []).join(', ');
      document.getElementById('new-project-form').classList.remove('hidden');
    };
  });
}

async function saveProjectsToDB() { // Function to save user projects to the database
  const { error } = await supabase.from('user_profiles').update({ projects: userProjects }).eq('id', userId);
  if (!error) {// If no error, reload the projects
    renderProjects();
    fadeMessage('project-status', '✅ Project saved!'); // Show success message
  }
}

// Add a new project or update an existing one
async function addNewProject(e) {
  e.preventDefault();
  const newProject = {
    name: document.getElementById('project_name').value,
    desc: document.getElementById('project_desc').value,
    demo: document.getElementById('project_demo').value,
    repo: document.getElementById('project_repo').value,
    skills: document.getElementById('project_skills').value.split(',').map(s => s.trim()).filter(Boolean)
  };

  if (currentEditingIndex !== null) {
    userProjects[currentEditingIndex] = newProject;
    currentEditingIndex = null;
  } else {
    userProjects.push(newProject);
  }

  document.getElementById('new-project-form').reset();
  document.getElementById('new-project-form').classList.add('hidden');
  await saveProjectsToDB();
}


function renderCertificates() {
  const cList = document.getElementById('certificates-list');
  cList.innerHTML = '';
  if (!userCertificates.length) {
    cList.innerHTML = '<p class="text-gray-400">No certificates yet.</p>';
    return;
  }
  userCertificates.forEach(cert => {
    const el = document.createElement('div');
    el.className = 'border p-4 rounded bg-gray-800';
    el.innerHTML = `
      ${cert.image ? `<img src="${cert.image}" class="h-12 mb-2" alt="logo">` : ''}
      <h4 class="font-semibold">${cert.title}</h4>
      <p>${cert.provider} — ${cert.year}</p>
      ${cert.description ? `<p>${cert.description}</p>` : ''}
      ${cert.links ? `<a href="${cert.links}" target="_blank" class="text-blue-400 underline">Certificate Link</a>` : ''}
    `;
    cList.appendChild(el);
  });
}

async function addNewCertificate(e) {
  e.preventDefault();
  const f = document.getElementById('new-certificate-form');
  userCertificates.push({
    title: f.cert_title.value,
    provider: f.cert_provider.value,
    year: f.cert_year.value,
    description: f.cert_desc?.value || '',
    links: f.cert_links?.value || '',
    image: f.cert_image?.value || ''
  });
  f.reset(); f.classList.add('hidden');
  await supabase.from('user_profiles').update({ certificates: userCertificates }).eq('id', userId);
  renderCertificates();
}





// --- EMPLOYMENT FUNCTIONS ---
function renderEmployment() {
  const eList = document.getElementById('employment-list');
  eList.innerHTML = '';
  if (!userEmployment.length) {
    eList.innerHTML = '<p class="text-gray-400">No employment yet.</p>';
    return;
  }
  userEmployment.forEach(job => {
    const el = document.createElement('div');
    el.className = 'border p-4 rounded bg-gray-800';
    el.innerHTML = `
      ${job.image ? `<img src="${job.image}" class="h-12 mb-2" alt="logo">` : ''}
      <h4 class="font-semibold">${job.title}</h4>
      <p>${job.company} — ${job.year}</p>
      ${job.description ? `<p>${job.description}</p>` : ''}
      ${job.links ? `<a href="${job.links}" target="_blank" class="text-blue-400 underline">More Info</a>` : ''}
    `;
    eList.appendChild(el);
  });
}

async function addNewEmployment(e) {
  e.preventDefault();
  const f = document.getElementById('new-employment-form');
  userEmployment.push({
    title: f.job_title.value,
    company: f.job_company.value,
    year: f.job_year.value,
    description: f.job_desc?.value || '',
    links: f.job_links?.value || '',
    image: f.job_image?.value || ''
  });
  f.reset(); f.classList.add('hidden');
  await supabase.from('user_profiles').update({ employment: userEmployment }).eq('id', userId);
  renderEmployment();
}





// --- VOLUNTEERING FUNCTIONS ---
function renderVolunteering() {
  const vList = document.getElementById('volunteering-list');
  vList.innerHTML = '';
  if (!userVolunteering.length) {
    vList.innerHTML = '<p class="text-gray-400">No volunteering yet.</p>';
    return;
  }
  userVolunteering.forEach(v => {
    const el = document.createElement('div');
    el.className = 'border p-4 rounded bg-gray-800';
    el.innerHTML = `
      ${v.image ? `<img src="${v.image}" class="h-12 mb-2" alt="logo">` : ''}
      <h4 class="font-semibold">${v.role}</h4>
      <p>${v.org} — ${v.year}</p>
      ${v.description ? `<p>${v.description}</p>` : ''}
      ${v.links ? `<a href="${v.links}" target="_blank" class="text-blue-400 underline">More Info</a>` : ''}
    `;
    vList.appendChild(el);
  });
}

async function addNewVolunteering(e) {
  e.preventDefault();
  const f = document.getElementById('new-volunteering-form');
  userVolunteering.push({
    role: f.vol_role.value,
    org: f.vol_org.value,
    year: f.vol_year.value,
    description: f.vol_desc?.value || '',
    links: f.vol_links?.value || '',
    image: f.vol_image?.value || ''
  });
  f.reset(); f.classList.add('hidden');
  await supabase.from('user_profiles').update({ volunteering: userVolunteering }).eq('id', userId);
  renderVolunteering();
}


// Update user profile data in the database
async function updateUserData(e) {
  e.preventDefault();
  const updateData = {
    full_name: document.getElementById('full_name').value,
    email: document.getElementById('email').value,
    bio: document.getElementById('bio').value,
    linkedin_url: document.getElementById('linkedin_url').value,
    portfolio_url: document.getElementById('portfolio_url').value,
    github_url: document.getElementById('github_url').value
  };
  const { error } = await supabase.from('user_profiles').update(updateData).eq('id', userId);
  if (!error) {
    fadeMessage('update-status', '✅ Info updated!');
    loadUserData();
  }
}


// Helper function to show a fade-out message
function fadeMessage(id, text) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.classList.remove('opacity-0');
  el.classList.add('opacity-100', 'transition-opacity', 'duration-500');
  setTimeout(() => {
    el.classList.remove('opacity-100');
    el.classList.add('opacity-0');
  }, 3000);
}

// Extract unique skills from projects
function extractSkills(projects = []) {
  const flat = projects.map(p => p.skills || []).flat();
  return [...new Set(flat)];
}

// Verify OpenAI API key by making a test request
async function verifyOpenAIKey(key) {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${key}`
      }
    });
    return res.status === 200;
  } catch (err) {
    return false;
  }
}

// Main function to handle CV generation
document.getElementById('generate-cv').onclick = async () => {
  const key = document.getElementById('openai_key').value.trim();
  const jobDesc = document.getElementById('job_desc').value.trim();
  const status = document.getElementById('cv-status');

  if (!key || !jobDesc) {
    status.textContent = '❌ API Key or job description missing';
    return;
  }

  status.textContent = '🔍 Verifying API key...';
  const isValid = await verifyOpenAIKey(key);
  if (!isValid) {
    status.textContent = '❌ Invalid OpenAI key. Please check it.';
    return;
  }

  status.textContent = '📄 Generating CV...';

  const projects = currentUserProfile.projects || [];
  const skills = extractSkills(projects);

  // Generate the CV prompt using user data and job description
// Filter relevant projects based on keywords in the job description
const filteredProjects = projects.filter(p => {
  const jobText = jobDesc.toLowerCase();
  const projectText = `${p.name} ${p.desc} ${p.skills?.join(' ')}`.toLowerCase();

  return (
    jobText.includes('web') && projectText.includes('javascript') ||
    jobText.includes('frontend') && projectText.includes('react') ||
    jobText.includes('backend') && projectText.includes('node') ||
    jobText.includes('api') && projectText.includes('api') ||
    jobText.includes('data') && projectText.includes('sql') ||
    jobText.includes('automation') && projectText.includes('automation') ||
    jobText.includes('testing') && projectText.includes('qa') ||
    jobText.includes('ai') && projectText.includes('openai')
  );
});

const prompt = generateCVPrompt({
  name: currentUserProfile.full_name || '',
  email: currentUserProfile.email || '',
  bio: currentUserProfile.bio || '',
  linkedin: currentUserProfile.linkedin_url || '',
  github: currentUserProfile.github_url || '',
  skills,
  projects: filteredProjects.map(p => ({
    name: p.name,
    description: p.desc,
    demo: p.demo,
    repo: p.repo,
    skills: Array.isArray(p.skills) ? p.skills : []
  }))
}, jobDesc);


  // Make the API request to OpenAI
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5
      })
    });

    // Check if the response is successful
    const data = await res.json(); // Parse the JSON response
    const content = data.choices?.[0]?.message?.content || "⚠️ No response from AI.";
document.getElementById('cv-output').textContent = content; // Display the AI response in a <pre> box

document.getElementById('download-pdf').classList.remove('hidden');
status.textContent = '✅ CV Ready! Displayed below.';

  } catch (err) {
    console.error(err);
    status.textContent = '❌ Error generating CV.';
  }
};


document.getElementById('logout-btn').onclick = () => {
  sessionStorage.clear();
  location.href = 'login.html';
};

document.getElementById('update-form').addEventListener('submit', updateUserData);
document.getElementById('new-project-form').addEventListener('submit', addNewProject);
document.getElementById('toggle-project-form').addEventListener('click', () => {
  document.getElementById('new-project-form').classList.toggle('hidden');
});

// DOWNLOAD PDF FUNCTION 
document.getElementById('download-pdf').onclick = async () => {
  const cvElement = document.getElementById('cv-output');
  const content = cvElement.textContent.trim();
  if (!content) {
    return alert("❌ CV content is empty.");
  }

  // Temporarily style for rendering
  cvElement.style.background = '#fff';
  cvElement.style.color = '#000';
  cvElement.style.padding = '20px';
  cvElement.style.whiteSpace = 'pre-wrap';
  cvElement.style.fontFamily = 'monospace';

  try {
    // Capture the element as a canvas
    const canvas = await html2canvas(cvElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Generate PDF
    const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
    pdf.save('ai-cv.pdf');
  } catch (err) {
    console.error(err);
    alert('❌ Failed to generate PDF: ' + err.message);
  } finally {
    // Reset styles
    cvElement.style.background = '';
    cvElement.style.color = '';
    cvElement.style.padding = '';
    cvElement.style.whiteSpace = '';
    cvElement.style.fontFamily = '';
  }
};

window.addEventListener('DOMContentLoaded', () => {
  // Certificate form toggle and submit
  document.getElementById('toggle-certificate-form').onclick = () =>
    document.getElementById('new-certificate-form').classList.toggle('hidden');
  document.getElementById('new-certificate-form').addEventListener('submit', addNewCertificate);

  // Employment form toggle and submit
  document.getElementById('toggle-employment-form').onclick = () =>
    document.getElementById('new-employment-form').classList.toggle('hidden');
  document.getElementById('new-employment-form').addEventListener('submit', addNewEmployment);

  // Volunteering form toggle and submit
  document.getElementById('toggle-volunteering-form').onclick = () =>
    document.getElementById('new-volunteering-form').classList.toggle('hidden');
  document.getElementById('new-volunteering-form').addEventListener('submit', addNewVolunteering);
});


loadUserData();
