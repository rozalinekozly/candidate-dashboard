import { supabase } from './db.js';

let userId = null;
let userProjects = [];
let currentEditingIndex = null;
let projectIndexToDelete = null;

async function loadUserData() {
  userId = sessionStorage.getItem('user_id');
  if (!userId) return;

  const { data } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
  if (!data) return;

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

  // Handle delete click → show box + store index
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = (e) => {
      const index = +e.target.dataset.index;
      const boxId = e.target.dataset.confirm;
      projectIndexToDelete = index;

      document.querySelectorAll('.confirm-box').forEach(el => el.classList.add('hidden'));
      document.getElementById(boxId).classList.remove('hidden');
    };
  });

  // Confirm delete
  document.querySelectorAll('.confirm-delete').forEach(btn => {
    btn.onclick = async () => {
      if (projectIndexToDelete !== null) {
        userProjects.splice(projectIndexToDelete, 1);
        projectIndexToDelete = null;
        await saveProjectsToDB();
      }
    };
  });

  // Cancel delete
  document.querySelectorAll('.cancel-delete').forEach(btn => {
    btn.onclick = (e) => {
      e.target.closest('.confirm-box').classList.add('hidden');
      projectIndexToDelete = null;
    };
  });

  // Edit
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
  loadUserData();

  if (!error) fadeMessage('update-status', '✅ Info updated!');
  else fadeMessage('update-status', '❌ Failed to update');
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
