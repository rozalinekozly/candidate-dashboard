import { supabase } from './db.js';

let userId = null;
let userProjects = [];

async function loadUserData() {
  userId = sessionStorage.getItem('user_id');
  if (!userId) return;

  const { data } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
  if (!data) return;

  // Fill form and static data
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

  userProjects = data.projects || [];
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
    card.className = 'border border-gray-700 p-4 rounded bg-gray-950';

    card.innerHTML = `
      <h4 class="text-lg font-semibold text-blue-300">${project.name}</h4>
      <p class="text-sm mt-1"><strong>Description:</strong> ${project.desc}</p>
      <p class="text-sm"><strong>Live Demo:</strong> <a href="${project.demo}" target="_blank" class="text-blue-400 underline">${project.demo}</a></p>
      <p class="text-sm"><strong>GitHub:</strong> <a href="${project.repo}" target="_blank" class="text-blue-400 underline">${project.repo}</a></p>
      <p class="text-sm"><strong>Skills:</strong> ${Array.isArray(project.skills) ? project.skills.join(', ') : 'N/A'}</p>
      <div class="flex gap-2 mt-3">
        <button class="edit-btn bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-black" data-index="${index}">✏️ Edit</button>
        <button class="delete-btn bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white" data-index="${index}">🗑️ Delete</button>
      </div>
    `;

    container.appendChild(card);
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = async (e) => {
      const index = +e.target.dataset.index;
      userProjects.splice(index, 1);
      await saveProjectsToDB();
    };
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = (e) => {
      const index = +e.target.dataset.index;
      const p = userProjects[index];

      document.getElementById('project_name').value = p.name;
      document.getElementById('project_desc').value = p.desc;
      document.getElementById('project_demo').value = p.demo;
      document.getElementById('project_repo').value = p.repo;
      document.getElementById('project_skills').value = (p.skills || []).join(', ');

      userProjects.splice(index, 1);
      document.getElementById('new-project-form').classList.remove('hidden');
    };
  });
}

async function saveProjectsToDB() {
  const { error } = await supabase.from('user_profiles').update({ projects: userProjects }).eq('id', userId);
  if (!error) renderProjects();
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
  document.getElementById('update-status').textContent = error ? '❌ Failed to update' : '✅ Info updated!';
  loadUserData();
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
  userProjects.push(newProject);
  document.getElementById('new-project-form').reset();
  await saveProjectsToDB();
  document.getElementById('project-status').textContent = '✅ Project added!';
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
