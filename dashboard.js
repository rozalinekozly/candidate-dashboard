import { supabase } from './db.js'; // Import the Supabase client
import { generateCVPrompt } from './cvPrompt.js'; // Import the CV prompt generator
//import { generatePDF } = './cvPdfGenerator.js'; // Import the PDF generator function


let userId = null;
let userProjects = [];
let currentEditingProjectIndex = null;
let projectIndexToDelete = null;

let currentUserProfile = {};

let userCertificates = [];
let currentEditingCertificateIndex = null;
let certificateIndexToDelete = null;

let userEmployment = [];
let currentEditingEmploymentIndex = null;
let employmentIndexToDelete = null;

let userVolunteering = [];
let currentEditingVolunteeringIndex = null;
let volunteeringIndexToDelete = null;

let userEducation = [];
let currentEditingEducationIndex = null;
let educationIndexToDelete = null;


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
  userEducation = Array.isArray(data.education) ? data.education : [];


  renderEmployment(); // Render employment history
  renderCertificates(); // Render certificates
  renderVolunteering(); // Render volunteering experiences
  renderEducation(); // Render education history

}

// --- PROJECTS FUNCTIONS ---
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
    const confirmBoxId = `confirm-project-box-${index}`;

    card.innerHTML = `
      <h4 class="text-lg font-semibold text-blue-300">${project.name}</h4>
      <p class="text-sm mt-1"><strong>Description:</strong> ${project.desc}</p>
      <p class="text-sm"><strong>Live Demo:</strong> <a href="${project.demo}" target="_blank" class="text-blue-400 underline">${project.demo}</a></p>
      <p class="text-sm"><strong>GitHub:</strong> <a href="${project.repo}" target="_blank" class="text-blue-400 underline">${project.repo}</a></p>
      <p class="text-sm"><strong>Skills:</strong> ${Array.isArray(project.skills) ? project.skills.join(', ') : 'N/A'}</p>
      <div class="flex gap-2 mt-3">
        <button class="edit-project-btn bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-black" data-index="${index}">✏️ Edit</button>
        <button class="delete-project-btn bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white" data-index="${index}" data-confirm="${confirmBoxId}">🗑️ Delete</button>
      </div>
      <div id="${confirmBoxId}" class="confirm-box hidden mt-3 bg-gray-800 text-sm text-white border border-red-500 p-3 rounded">
        <p class="mb-2">Are you sure you want to delete <strong>${project.name}</strong>?</p>
        <div class="flex gap-3">
          <button class="confirm-delete-project bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white">✅ Yes</button>
          <button class="cancel-delete-project bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-white">❌ Cancel</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  document.querySelectorAll('.delete-project-btn').forEach(btn => { // Add click event to delete buttons
    btn.onclick = (e) => { // Show confirmation box when delete button is clicked
      const index = +e.target.dataset.index;
      const boxId = e.target.dataset.confirm;
      projectIndexToDelete = index;
      document.querySelectorAll('.confirm-box').forEach(el => el.classList.add('hidden')); // Hide all confirm boxes
      document.getElementById(boxId).classList.remove('hidden');
    };
  });

  document.querySelectorAll('.confirm-delete-project').forEach(btn => { // Add click event to confirm delete buttons
    btn.onclick = async () => {
      if (projectIndexToDelete !== null) {
        userProjects.splice(projectIndexToDelete, 1); // Remove the project from the array
        projectIndexToDelete = null; // Reset the index after deletion
        await saveProjectsToDB(); // Save the updated projects to the database
        document.querySelectorAll('.confirm-box').forEach(el => el.classList.add('hidden')); // Hide all confirm boxes
      }
    };
  });

  document.querySelectorAll('.cancel-delete-project').forEach(btn => { // Add click event to cancel delete buttons
    btn.onclick = (e) => {
      e.target.closest('.confirm-box').classList.add('hidden');
      projectIndexToDelete = null; // Reset the index if deletion is cancelled
    };
  });

  document.querySelectorAll('.edit-project-btn').forEach(btn => { // Add click event to edit buttons
    btn.onclick = (e) => {
      const index = +e.target.dataset.index;
      const p = userProjects[index];
      currentEditingProjectIndex = index;
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
  } else {
    console.error("Error saving projects:", error);
    fadeMessage('project-status', '❌ Error saving project.');
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

  if (currentEditingProjectIndex !== null) {
    userProjects[currentEditingProjectIndex] = newProject;
    currentEditingProjectIndex = null;
  } else {
    userProjects.push(newProject);
  }

  document.getElementById('new-project-form').reset();
  document.getElementById('new-project-form').classList.add('hidden');
  await saveProjectsToDB();
}


// --- CERTIFICATES FUNCTIONS ---
function renderCertificates() {
  const cList = document.getElementById('certificates-list');
  cList.innerHTML = '';
  if (!userCertificates.length) {
    cList.innerHTML = '<p class="text-gray-400">No certificates yet.</p>';
    return;
  }
  userCertificates.forEach((cert, index) => {
    const el = document.createElement('div');
    el.className = 'border border-gray-700 p-4 rounded bg-gray-950 relative';
    const confirmBoxId = `confirm-cert-box-${index}`;
    el.innerHTML = `
      ${cert.image ? `<img src="${cert.image}" class="h-12 mb-2" alt="logo">` : ''}
      <h4 class="font-semibold text-blue-300">${cert.title}</h4>
      <p class="text-sm">${cert.provider} — ${cert.yearFrom || ''} ${cert.yearTo ? `- ${cert.yearTo}` : ''}</p>
      ${cert.description ? `<p class="text-sm mt-1"><strong>Description:</strong> ${cert.description}</p>` : ''}
      ${cert.links ? `<p class="text-sm"><strong>Link:</strong> <a href="${cert.links}" target="_blank" class="text-blue-400 underline">Certificate Link</a></p>` : ''}
      <div class="flex gap-2 mt-3">
        <button class="edit-certificate-btn bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-black" data-index="${index}">✏️ Edit</button>
        <button class="delete-certificate-btn bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white" data-index="${index}" data-confirm="${confirmBoxId}">🗑️ Delete</button>
      </div>
      <div id="${confirmBoxId}" class="confirm-box hidden mt-3 bg-gray-800 text-sm text-white border border-red-500 p-3 rounded">
        <p class="mb-2">Are you sure you want to delete <strong>${cert.title}</strong>?</p>
        <div class="flex gap-3">
          <button class="confirm-delete-certificate bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white">✅ Yes</button>
          <button class="cancel-delete-certificate bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-white">❌ Cancel</button>
        </div>
      </div>
    `;
    cList.appendChild(el);
  });

  document.querySelectorAll('.delete-certificate-btn').forEach(btn => {
    btn.onclick = (e) => {
      const index = +e.target.dataset.index;
      const boxId = e.target.dataset.confirm;
      certificateIndexToDelete = index;
      document.querySelectorAll('.confirm-box').forEach(el => el.classList.add('hidden'));
      document.getElementById(boxId).classList.remove('hidden');
    };
  });

  document.querySelectorAll('.confirm-delete-certificate').forEach(btn => {
    btn.onclick = async () => {
      if (certificateIndexToDelete !== null) {
        userCertificates.splice(certificateIndexToDelete, 1);
        certificateIndexToDelete = null;
        await saveCertificatesToDB();
        document.querySelectorAll('.confirm-box').forEach(el => el.classList.add('hidden'));
      }
    };
  });

  document.querySelectorAll('.cancel-delete-certificate').forEach(btn => {
    btn.onclick = (e) => {
      e.target.closest('.confirm-box').classList.add('hidden');
      certificateIndexToDelete = null;
    };
  });

  document.querySelectorAll('.edit-certificate-btn').forEach(btn => {
    btn.onclick = (e) => {
      const index = +e.target.dataset.index;
      const c = userCertificates[index];
      currentEditingCertificateIndex = index;
      document.getElementById('cert_title').value = c.title;
      document.getElementById('cert_provider').value = c.provider;
      document.getElementById('cert_year_from').value = c.yearFrom || '';
      document.getElementById('cert_year_to').value = c.yearTo || '';
      document.getElementById('cert_desc').value = c.description || '';
      document.getElementById('new-certificate-form').classList.remove('hidden');
    };
  });
}

async function saveCertificatesToDB() {
  const { error } = await supabase.from('user_profiles').update({ certificates: userCertificates }).eq('id', userId);
  if (!error) {
    renderCertificates();
    fadeMessage('certificate-status', '✅ Certificate saved!');
  } else {
    console.error("Error saving certificates:", error);
    fadeMessage('certificate-status', '❌ Error saving certificate.');
  }
}

async function addNewCertificate(e) {
  e.preventDefault();
  const f = document.getElementById('new-certificate-form');
  const newCert = {
    title: f.cert_title.value,
    provider: f.cert_provider.value,
    yearFrom: f.cert_year_from.value,
    yearTo: f.cert_year_to.value,
    description: f.cert_desc.value || '',
    links: f.cert_links?.value || '',
    image: f.cert_image?.value || ''
  };

  if (currentEditingCertificateIndex !== null) {
    userCertificates[currentEditingCertificateIndex] = newCert;
    currentEditingCertificateIndex = null;
  } else {
    userCertificates.push(newCert);
  }

  f.reset();
  f.classList.add('hidden');
  await saveCertificatesToDB();
}


// --- EMPLOYMENT FUNCTIONS ---
function renderEmployment() {
  const eList = document.getElementById('employment-list');
  eList.innerHTML = '';
  if (!userEmployment.length) {
    eList.innerHTML = '<p class="text-gray-400">No employment yet.</p>';
    return;
  }
  userEmployment.forEach((job, index) => {
    const el = document.createElement('div');
    el.className = 'border border-gray-700 p-4 rounded bg-gray-950 relative';
    const confirmBoxId = `confirm-job-box-${index}`;
    el.innerHTML = `
      ${job.image ? `<img src="${job.image}" class="h-12 mb-2" alt="logo">` : ''}
      <h4 class="font-semibold text-blue-300">${job.title}</h4>
      <p class="text-sm">${job.company} — ${job.yearFrom || ''} ${job.yearTo ? `- ${job.yearTo}` : ''}</p>
      ${job.description ? `<p class="text-sm mt-1"><strong>Description:</strong> ${job.description}</p>` : ''}
      ${job.links ? `<p class="text-sm"><strong>Link:</strong> <a href="${job.links}" target="_blank" class="text-blue-400 underline">More Info</a></p>` : ''}
      <div class="flex gap-2 mt-3">
        <button class="edit-employment-btn bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-black" data-index="${index}">✏️ Edit</button>
        <button class="delete-employment-btn bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white" data-index="${index}" data-confirm="${confirmBoxId}">🗑️ Delete</button>
      </div>
      <div id="${confirmBoxId}" class="confirm-box hidden mt-3 bg-gray-800 text-sm text-white border border-red-500 p-3 rounded">
        <p class="mb-2">Are you sure you want to delete <strong>${job.title}</strong>?</p>
        <div class="flex gap-3">
          <button class="confirm-delete-employment bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white">✅ Yes</button>
          <button class="cancel-delete-employment bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-white">❌ Cancel</button>
        </div>
      </div>
    `;
    eList.appendChild(el);
  });

  document.querySelectorAll('.delete-employment-btn').forEach(btn => {
    btn.onclick = (e) => {
      const index = +e.target.dataset.index;
      const boxId = e.target.dataset.confirm;
      employmentIndexToDelete = index;
      document.querySelectorAll('.confirm-box').forEach(el => el.classList.add('hidden'));
      document.getElementById(boxId).classList.remove('hidden');
    };
  });

  document.querySelectorAll('.confirm-delete-employment').forEach(btn => {
    btn.onclick = async () => {
      if (employmentIndexToDelete !== null) {
        userEmployment.splice(employmentIndexToDelete, 1);
        employmentIndexToDelete = null;
        await saveEmploymentToDB();
        document.querySelectorAll('.confirm-box').forEach(el => el.classList.add('hidden'));
      }
    };
  });

  document.querySelectorAll('.cancel-delete-employment').forEach(btn => {
    btn.onclick = (e) => {
      e.target.closest('.confirm-box').classList.add('hidden');
      employmentIndexToDelete = null;
    };
  });

  document.querySelectorAll('.edit-employment-btn').forEach(btn => {
    btn.onclick = (e) => {
      const index = +e.target.dataset.index;
      const j = userEmployment[index];
      currentEditingEmploymentIndex = index;
      document.getElementById('job_title').value = j.title;
      document.getElementById('job_company').value = j.company;
      document.getElementById('job_year_from').value = j.yearFrom || '';
      document.getElementById('job_year_to').value = j.yearTo || '';
      document.getElementById('job_desc').value = j.description || '';
      document.getElementById('new-employment-form').classList.remove('hidden');
    };
  });
}

async function saveEmploymentToDB() {
  const { error } = await supabase.from('user_profiles').update({ employment: userEmployment }).eq('id', userId);
  if (!error) {
    renderEmployment();
    fadeMessage('employment-status', '✅ Employment saved!');
  } else {
    console.error("Error saving employment:", error);
    fadeMessage('employment-status', '❌ Error saving employment.');
  }
}

async function addNewEmployment(e) {
  e.preventDefault();
  const f = document.getElementById('new-employment-form');
  const newJob = {
    title: f.job_title.value,
    company: f.job_company.value,
    yearFrom: f.job_year_from.value,
    yearTo: f.job_year_to.value,
    description: f.job_desc.value || '',
    links: f.job_links?.value || '',
    image: f.job_image?.value || ''
  };

  if (currentEditingEmploymentIndex !== null) {
    userEmployment[currentEditingEmploymentIndex] = newJob;
    currentEditingEmploymentIndex = null;
  } else {
    userEmployment.push(newJob);
  }

  f.reset();
  f.classList.add('hidden');
  await saveEmploymentToDB();
}


// --- VOLUNTEERING FUNCTIONS ---
function renderVolunteering() {
  const vList = document.getElementById('volunteering-list');
  vList.innerHTML = '';
  if (!userVolunteering.length) {
    vList.innerHTML = '<p class="text-gray-400">No volunteering yet.</p>';
    return;
  }
  userVolunteering.forEach((v, index) => {
    const el = document.createElement('div');
    el.className = 'border border-gray-700 p-4 rounded bg-gray-950 relative';
    const confirmBoxId = `confirm-vol-box-${index}`;
    el.innerHTML = `
      ${v.image ? `<img src="${v.image}" class="h-12 mb-2" alt="logo">` : ''}
      <h4 class="font-semibold text-blue-300">${v.role}</h4>
      <p class="text-sm">${v.org} — ${v.yearFrom || ''} ${v.yearTo ? `- ${v.yearTo}` : ''}</p>
      ${v.description ? `<p class="text-sm mt-1"><strong>Description:</strong> ${v.description}</p>` : ''}
      ${v.links ? `<p class="text-sm"><strong>Link:</strong> <a href="${v.links}" target="_blank" class="text-blue-400 underline">More Info</a></p>` : ''}
      <div class="flex gap-2 mt-3">
        <button class="edit-volunteering-btn bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-black" data-index="${index}">✏️ Edit</button>
        <button class="delete-volunteering-btn bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white" data-index="${index}" data-confirm="${confirmBoxId}">🗑️ Delete</button>
      </div>
      <div id="${confirmBoxId}" class="confirm-box hidden mt-3 bg-gray-800 text-sm text-white border border-red-500 p-3 rounded">
        <p class="mb-2">Are you sure you want to delete <strong>${v.role}</strong>?</p>
        <div class="flex gap-3">
          <button class="confirm-delete-volunteering bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white">✅ Yes</button>
          <button class="cancel-delete-volunteering bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-white">❌ Cancel</button>
        </div>
      </div>
    `;
    vList.appendChild(el);
  });

  document.querySelectorAll('.delete-volunteering-btn').forEach(btn => {
    btn.onclick = (e) => {
      const index = +e.target.dataset.index;
      const boxId = e.target.dataset.confirm;
      volunteeringIndexToDelete = index;
      document.querySelectorAll('.confirm-box').forEach(el => el.classList.add('hidden'));
      document.getElementById(boxId).classList.remove('hidden');
    };
  });

  document.querySelectorAll('.confirm-delete-volunteering').forEach(btn => {
    btn.onclick = async () => {
      if (volunteeringIndexToDelete !== null) {
        userVolunteering.splice(volunteeringIndexToDelete, 1);
        volunteeringIndexToDelete = null;
        await saveVolunteeringToDB();
        document.querySelectorAll('.confirm-box').forEach(el => el.classList.add('hidden'));
      }
    };
  });

  document.querySelectorAll('.cancel-delete-volunteering').forEach(btn => {
    btn.onclick = (e) => {
      e.target.closest('.confirm-box').classList.add('hidden');
      volunteeringIndexToDelete = null;
    };
  });

  document.querySelectorAll('.edit-volunteering-btn').forEach(btn => {
    btn.onclick = (e) => {
      const index = +e.target.dataset.index;
      const v = userVolunteering[index];
      currentEditingVolunteeringIndex = index;
      document.getElementById('vol_role').value = v.role;
      document.getElementById('vol_org').value = v.org;
      document.getElementById('vol_year_from').value = v.yearFrom || '';
      document.getElementById('vol_year_to').value = v.yearTo || '';
      document.getElementById('vol_desc').value = v.description || '';
      document.getElementById('new-volunteering-form').classList.remove('hidden');
    };
  });
}

async function saveVolunteeringToDB() {
  const { error } = await supabase.from('user_profiles').update({ volunteering: userVolunteering }).eq('id', userId);
  if (!error) {
    renderVolunteering();
    fadeMessage('volunteering-status', '✅ Volunteering saved!');
  } else {
    console.error("Error saving volunteering:", error);
    fadeMessage('volunteering-status', '❌ Error saving volunteering.');
  }
}

async function addNewVolunteering(e) {
  e.preventDefault();
  const f = document.getElementById('new-volunteering-form');
  const newVol = {
    role: f.vol_role.value,
    org: f.vol_org.value,
    yearFrom: f.vol_year_from.value,
    yearTo: f.vol_year_to.value,
    description: f.vol_desc.value || '',
    links: f.vol_links?.value || '',
    image: f.vol_image?.value || ''
  };

  if (currentEditingVolunteeringIndex !== null) {
    userVolunteering[currentEditingVolunteeringIndex] = newVol;
    currentEditingVolunteeringIndex = null;
  } else {
    userVolunteering.push(newVol);
  }

  f.reset();
  f.classList.add('hidden');
  await saveVolunteeringToDB();
}


// --- EDUCATION FUNCTIONS ---
function renderEducation() {
  const eList = document.getElementById('education-list');
  eList.innerHTML = '';
  if (!userEducation.length) {
    eList.innerHTML = '<p class="text-gray-400">No education entries yet.</p>';
    return;
  }
  userEducation.forEach((edu, index) => {
    const el = document.createElement('div');
    el.className = 'border border-gray-700 p-4 rounded bg-gray-950 relative';
    const confirmBoxId = `confirm-edu-box-${index}`;
    el.innerHTML = `
      <h4 class="font-semibold text-blue-300">${edu.degree}</h4>
      <p class="text-sm">${edu.institution} — ${edu.yearFrom || ''} ${edu.yearTo ? `- ${edu.yearTo}` : ''}</p>
      ${edu.description ? `<p class="text-sm mt-1"><strong>Description:</strong> ${edu.description}</p>` : ''}
      <div class="flex gap-2 mt-3">
        <button class="edit-education-btn bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-black" data-index="${index}">✏️ Edit</button>
        <button class="delete-education-btn bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white" data-index="${index}" data-confirm="${confirmBoxId}">🗑️ Delete</button>
      </div>
      <div id="${confirmBoxId}" class="confirm-box hidden mt-3 bg-gray-800 text-sm text-white border border-red-500 p-3 rounded">
        <p class="mb-2">Are you sure you want to delete <strong>${edu.degree} at ${edu.institution}</strong>?</p>
        <div class="flex gap-3">
          <button class="confirm-delete-education bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white">✅ Yes</button>
          <button class="cancel-delete-education bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-white">❌ Cancel</button>
        </div>
      </div>
    `;
    eList.appendChild(el);
  });

  document.querySelectorAll('.delete-education-btn').forEach(btn => {
    btn.onclick = (e) => {
      const index = +e.target.dataset.index;
      const boxId = e.target.dataset.confirm;
      educationIndexToDelete = index;
      document.querySelectorAll('.confirm-box').forEach(el => el.classList.add('hidden'));
      document.getElementById(boxId).classList.remove('hidden');
    };
  });

  document.querySelectorAll('.confirm-delete-education').forEach(btn => {
    btn.onclick = async () => {
      if (educationIndexToDelete !== null) {
        userEducation.splice(educationIndexToDelete, 1);
        educationIndexToDelete = null;
        await saveEducationToDB();
        document.querySelectorAll('.confirm-box').forEach(el => el.classList.add('hidden'));
      }
    };
  });

  document.querySelectorAll('.cancel-delete-education').forEach(btn => {
    btn.onclick = (e) => {
      e.target.closest('.confirm-box').classList.add('hidden');
      educationIndexToDelete = null;
    };
  });

  document.querySelectorAll('.edit-education-btn').forEach(btn => {
    btn.onclick = (e) => {
      const index = +e.target.dataset.index;
      const edu = userEducation[index];
      currentEditingEducationIndex = index;
      document.getElementById('edu_degree').value = edu.degree;
      document.getElementById('edu_institution').value = edu.institution;
      document.getElementById('edu_year_from').value = edu.yearFrom || '';
      document.getElementById('edu_year_to').value = edu.yearTo || '';
      document.getElementById('edu_desc').value = edu.description || '';
      document.getElementById('new-education-form').classList.remove('hidden');
    };
  });
}

async function saveEducationToDB() {
  const { error } = await supabase.from('user_profiles').update({ education: userEducation }).eq('id', userId);
  if (!error) {
    renderEducation();
    fadeMessage('education-status', '✅ Education saved!');
  } else {
    console.error("Error saving education:", error);
    fadeMessage('education-status', '❌ Error saving education.');
  }
}

async function addNewEducation(e) {
  e.preventDefault();
  const f = document.getElementById('new-education-form');
  const newEdu = {
    degree: f.edu_degree.value,
    institution: f.edu_institution.value,
    yearFrom: f.edu_year_from.value,
    yearTo: f.edu_year_to.value,
    description: f.edu_desc.value || '',
  };

  if (currentEditingEducationIndex !== null) {
    userEducation[currentEditingEducationIndex] = newEdu;
    currentEditingEducationIndex = null;
  } else {
    userEducation.push(newEdu);
  }

  f.reset();
  f.classList.add('hidden');
  await saveEducationToDB();
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
  } else {
    console.error("Error updating profile:", error);
    fadeMessage('update-status', '❌ Error updating info.');
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

  // Education form toggle and submit
  document.getElementById('toggle-education-form').onclick = () =>
    document.getElementById('new-education-form').classList.toggle('hidden');
  document.getElementById('new-education-form').addEventListener('submit', addNewEducation);
});


loadUserData();