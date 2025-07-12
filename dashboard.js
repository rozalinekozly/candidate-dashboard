import { supabase } from './db.js';

let userId = null;
let userProjects = [];
let currentEditingIndex = null;
let projectIndexToDelete = null;
let currentUserProfile = {};

// Load profile
async function loadUserData() {
  userId = sessionStorage.getItem('user_id');
  if (!userId) return;

  const { data } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
  if (!data) return;

  currentUserProfile = data;

  ['full_name', 'email', 'bio', 'linkedin_url', 'portfolio_url', 'github_url'].forEach(id => {
    document.getElementById(id).value = data[id] || '';
  });

  document.getElementById('static_full_name').textContent = data.full_name || '';
  document.getElementById('static_email').textContent = data.email || '';
  document.getElementById('static_bio').textContent = data.bio || '';
  document.getElementById('static_linkedin').textContent = data.linkedin_url || '';
  document.getElementById('static_linkedin').href = data.linkedin_url || '#';
  document.getElementById('static_portfolio').textContent = data.portfolio_url || '';
  document.getElementById('static_portfolio').href = data.portfolio_url || '#';
  document.getElementById('static_github').textContent = data.github_url || '';
  document.getElementById('static_github').href = data.github_url || '#';

  userProjects = Array.isArray(data.projects) ? data.projects : [];
  renderProjects();
}

// Render project list
function renderProjects() {
  const container = document.getElementById('projects-list');
  container.innerHTML = '';

  if (!userProjects.length) {
    container.innerHTML = '<p class="text-gray-400">No projects yet.</p>';
    return;
  }

  userProjects.forEach((project, index) => {
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

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = (e) => {
      const index = +e.target.dataset.index;
      const boxId = e.target.dataset.confirm;
      projectIndexToDelete = index;
      document.querySelectorAll('.confirm-box').forEach(el => el.classList.add('hidden'));
      document.getElementById(boxId).classList.remove('hidden');
    };
  });

  document.querySelectorAll('.confirm-delete').forEach(btn => {
    btn.onclick = async () => {
      if (projectIndexToDelete !== null) {
        userProjects.splice(projectIndexToDelete, 1);
        projectIndexToDelete = null;
        await saveProjectsToDB();
      }
    };
  });

  document.querySelectorAll('.cancel-delete').forEach(btn => {
    btn.onclick = (e) => {
      e.target.closest('.confirm-box').classList.add('hidden');
      projectIndexToDelete = null;
    };
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = (e) => {
      const index = +e.target.dataset.index;
      const p = userProjects[index];
      currentEditingIndex = index;
      document.getElementById('project_name').value = p.name;
      document.getElementById('project_desc').value = p.desc;
      document.getElementById('project_demo').value = p.demo;
      document.getElementById('project_repo').value = p.repo;
      document.getElementById('project_skills').value = (p.skills || []).join(', ');
      document.getElementById('new-project-form').classList.remove('hidden');
    };
  });
}

async function saveProjectsToDB() {
  const { error } = await supabase.from('user_profiles').update({ projects: userProjects }).eq('id', userId);
  if (!error) {
    renderProjects();
    fadeMessage('project-status', '✅ Project saved!');
  }
}

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

function extractSkills(projects = []) {
  const flat = projects.map(p => p.skills || []).flat();
  return [...new Set(flat)];
}

// ✅ OpenAI Key Checker
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

// ✅ CV Generator with Key Check
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

  status.textContent = '⏳ Key valid. Generating CV...';

  const skills = extractSkills(currentUserProfile.projects);
  const projects = currentUserProfile.projects || [];
  const safeProjects = projects.map(p => `• ${p.name}: ${p.desc}`).join('\n') || '';
  const safeSkills = skills.join(', ') || '';
  const safeBio = currentUserProfile.bio || '';

  const prompt = `
You are a professional CV writer. Create a 1-page CV for the following user tailored to the job description below.

✳️ MUST INCLUDE:
- Full name
- Contact (Email)
- Bio (if present)
- Skills (if relevant)
- Projects (if relevant)

Only use the data provided — do not invent anything. If a section is missing, omit or leave blank. Your goal is to make the CV match the job description as closely as possible using real user data.

---

User Data:
Name: ${currentUserProfile.full_name || '[No Name]'}
Email: ${currentUserProfile.email || '[No Email]'}
Bio: ${safeBio}

Skills: ${safeSkills}

Projects:
${safeProjects}

---

Job Description:
${jobDesc}

Now write the full CV below:
`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5
      })
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "⚠️ No response from AI.";

    const pdfBlock = document.createElement('div');
    pdfBlock.innerHTML = `<pre style="font-family: monospace; white-space: pre-wrap;">${text}</pre>`;
    html2pdf().from(pdfBlock).save("ai-cv.pdf");

    status.textContent = '✅ CV Ready! Download should start.';
  } catch (err) {
    console.error(err);
    status.textContent = '❌ Error generating CV.';
  }
};

// Init
document.getElementById('logout-btn').onclick = () => {
  sessionStorage.clear();
  location.href = 'login.html';
};
document.getElementById('update-form').addEventListener('submit', updateUserData);
document.getElementById('new-project-form').addEventListener('submit', addNewProject);
document.getElementById('toggle-project-form').addEventListener('click', () => {
  document.getElementById('new-project-form').classList.toggle('hidden');
});
loadUserData();
