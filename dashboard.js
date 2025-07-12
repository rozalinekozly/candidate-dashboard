// dashboard.js
import { supabase } from './db.js';

let userId = null;

async function loadUserData() {
  userId = sessionStorage.getItem('user_id');

  if (!userId) {
    document.getElementById('update-status').textContent = '❌ No user logged in.';
    return;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    document.getElementById('update-status').textContent = '❌ Error loading data.';
    return;
  }

  // Fill in the fields
  document.getElementById('full_name').value = data.full_name || '';
  document.getElementById('email').value = data.email || '';
  document.getElementById('bio').value = data.bio || '';
  document.getElementById('linkedin_url').value = data.linkedin_url || '';
  document.getElementById('portfolio_url').value = data.portfolio_url || '';
  document.getElementById('github_url').value = data.github_url || '';
  document.getElementById('projects').value = JSON.stringify(data.projects || [], null, 2);
}

function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}

async function updateUserData(event) {
  event.preventDefault();

  const updateData = {
    full_name: document.getElementById('full_name').value,
    email: document.getElementById('email').value,
    bio: document.getElementById('bio').value,
    linkedin_url: document.getElementById('linkedin_url').value,
    portfolio_url: document.getElementById('portfolio_url').value,
    github_url: document.getElementById('github_url').value,
  };

  // Parse JSON safely
  try {
    updateData.projects = JSON.parse(document.getElementById('projects').value);
  } catch (e) {
    document.getElementById('update-status').textContent = '⚠️ Invalid JSON in projects field';
    document.getElementById('update-status').style.color = 'orange';
    return;
  }

  const { error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', userId);

  const status = document.getElementById('update-status');
  if (error) {
    status.textContent = '❌ Failed to update';
    status.style.color = 'red';
  } else {
    status.textContent = '✅ Info updated successfully!';
    status.style.color = 'green';
  }
}

document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('update-form').addEventListener('submit', updateUserData);

loadUserData();
