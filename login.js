// login.js
import { supabase } from './db.js';

export async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const status = document.getElementById('status');

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error || !data) {
    status.textContent = '❌ Login failed';
    status.style.color = 'red';
  } else {
    status.textContent = '✅ Login successful';
    status.style.color = 'green';
  }
}
