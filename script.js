const API_URL = 'http://localhost:5001/api';

let state = {
  token: localStorage.getItem('clientflow_token') || null,
  clients: [],
  projects: [],
  tasks: []
};

const views = {
  auth: document.getElementById('auth-view'),
  app: document.getElementById('app-layout'),
  dashboard: document.getElementById('dashboard-view'),
  clients: document.getElementById('clients-view'),
  projects: document.getElementById('projects-view'),
  tasks: document.getElementById('tasks-view')
};

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const logoutBtn = document.getElementById('logout-btn');

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function setBtnLoading(btn, isLoading) {
  const spinner = btn.querySelector('.spinner');
  if (isLoading) {
    btn.disabled = true;
    if(spinner) spinner.classList.remove('hidden');
  } else {
    btn.disabled = false;
    if(spinner) spinner.classList.add('hidden');
  }
}

async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${endpoint}`, config);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

function init() {
  if (state.token) {
    views.auth.classList.add('hidden');
    views.app.classList.remove('hidden');
    loadDashboard();
  } else {
    views.auth.classList.remove('hidden');
    views.app.classList.add('hidden');
  }
}

tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active'); tabRegister.classList.remove('active');
  loginForm.classList.add('active'); registerForm.classList.remove('active');
});
tabRegister.addEventListener('click', () => {
  tabRegister.classList.add('active'); tabLogin.classList.remove('active');
  registerForm.classList.add('active'); loginForm.classList.remove('active');
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = e.target.querySelector('button');
  
  setBtnLoading(btn, true);
  try {
    const data = await apiCall('/auth/login', 'POST', { email, password });
    state.token = data.token;
    localStorage.setItem('clientflow_token', data.token);
    showToast('Login successful!');
    init();
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    setBtnLoading(btn, false);
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const btn = e.target.querySelector('button');
  
  setBtnLoading(btn, true);
  try {
    const data = await apiCall('/auth/register', 'POST', { email, password });
    state.token = data.token;
    localStorage.setItem('clientflow_token', data.token);
    showToast('Registration successful!');
    init();
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    setBtnLoading(btn, false);
  }
});

logoutBtn.addEventListener('click', () => {
  state.token = null;
  localStorage.removeItem('clientflow_token');
  init();
});

const themeToggle = document.getElementById('theme-toggle');
if (localStorage.getItem('clientflow_theme') === 'dark') document.body.setAttribute('data-theme', 'dark');
themeToggle.addEventListener('click', () => {
  if (document.body.getAttribute('data-theme') === 'dark') {
    document.body.removeAttribute('data-theme');
    localStorage.setItem('clientflow_theme', 'light');
  } else {
    document.body.setAttribute('data-theme', 'dark');
    localStorage.setItem('clientflow_theme', 'dark');
  }
});

document.getElementById('btn-export-data').addEventListener('click', () => {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clientflow_export.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully!');
});

document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    e.target.classList.add('active');
    
    document.querySelectorAll('.content-view').forEach(v => v.classList.add('hidden'));
    
    const targetId = e.target.getAttribute('data-target');
    document.getElementById(targetId).classList.remove('hidden');
    document.getElementById(targetId).classList.add('active');

    if (targetId === 'dashboard-view') loadDashboard();
    if (targetId === 'clients-view') loadClients();
    if (targetId === 'projects-view') loadProjects();
    if (targetId === 'tasks-view') loadTasksView();
  });
});

document.getElementById('refresh-dashboard').addEventListener('click', async (e) => {
  const btn = e.target;
  const originalText = btn.innerHTML;
  btn.innerText = 'Refreshing...';
  btn.disabled = true;
  await loadDashboard();
  showToast('Dashboard Refreshed!', 'success');
  btn.innerHTML = originalText;
  btn.disabled = false;
});

let dashboardChart = null;
function renderChart(data) {
  const ctx = document.getElementById('dashboard-chart').getContext('2d');
  if (dashboardChart) dashboardChart.destroy();
  dashboardChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Total Clients', 'Active Projects', 'Completed', 'Revenue ($)'],
      datasets: [{
        label: 'Dashboard Stats',
        data: [data.clientsCount, data.activeProjectsCount, data.completedProjectsCount, data.totalRevenue],
        backgroundColor: ['#4f46e5', '#f59e0b', '#10b981', '#10b981'],
        borderRadius: 4
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

async function loadDashboard() {
  try {
    const data = await apiCall('/dashboard/stats');
    document.getElementById('stat-clients').innerText = data.clientsCount;
    document.getElementById('stat-active-projects').innerText = data.activeProjectsCount;
    document.getElementById('stat-completed-projects').innerText = data.completedProjectsCount;
    document.getElementById('stat-revenue').innerText = `$${data.totalRevenue}`;
    renderChart(data);
  } catch (err) {
    showToast('Failed to load dashboard', 'danger');
  }
}

async function loadClients() {
  try {
    const clients = await apiCall('/clients');
    state.clients = clients;
    renderClients();
  } catch (err) {
    showToast('Failed to load clients', 'danger');
  }
}

document.getElementById('filter-clients').addEventListener('input', renderClients);

function renderClients() {
  const filter = document.getElementById('filter-clients').value.toLowerCase();
  const filtered = state.clients.filter(c => c.name.toLowerCase().includes(filter) || (c.company && c.company.toLowerCase().includes(filter)));
  const tbody = document.querySelector('#clients-table tbody');
  tbody.innerHTML = filtered.map(client => `
    <tr>
      <td>${client.name}</td>
      <td>${client.email || '-'}</td>
      <td>${client.company || '-'}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editClient('${client.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteClient('${client.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function loadProjects() {
  try {
    const projects = await apiCall('/projects');
    state.projects = projects;
    renderProjects();
  } catch (err) {
    showToast('Failed to load projects', 'danger');
  }
}

document.getElementById('filter-projects').addEventListener('input', renderProjects);
document.getElementById('filter-project-status').addEventListener('change', renderProjects);

function renderProjects() {
  const filterText = document.getElementById('filter-projects').value.toLowerCase();
  const filterStatus = document.getElementById('filter-project-status').value;
  
  const filtered = state.projects.filter(p => {
    const matchText = p.title.toLowerCase().includes(filterText) || (p.Client && p.Client.name.toLowerCase().includes(filterText));
    const matchStatus = filterStatus ? p.status === filterStatus : true;
    return matchText && matchStatus;
  });

  const tbody = document.querySelector('#projects-table tbody');
  tbody.innerHTML = filtered.map(proj => {
    const statusClass = proj.status === 'Completed' ? 'badge-success' : (proj.status === 'In Progress' ? 'badge-info' : 'badge-warning');
    const paymentClass = proj.paymentStatus === 'Paid' ? 'badge-success' : 'badge-danger';
    
    // Check overdue
    let dueHtml = '-';
    if (proj.dueDate) {
      const isOverdue = new Date(proj.dueDate) < new Date() && proj.status !== 'Completed';
      dueHtml = `<span class="${isOverdue ? 'text-danger' : 'text-muted'}">${proj.dueDate}</span>`;
    }

    const prog = proj.progress || 0;
    const progressHtml = `
      <div style="font-size:0.75rem;">${prog}%</div>
      <div class="progress-container"><div class="progress-bar" style="width: ${prog}%"></div></div>
    `;

    return `
      <tr style="${proj.isArchived ? 'opacity:0.5;' : ''}">
        <td>
          <strong>${proj.title}</strong> ${proj.isArchived ? '<span class="badge badge-warning">Archived</span>' : ''}<br>
          <small class="text-muted">${proj.description || ''}</small>
        </td>
        <td>${proj.Client ? proj.Client.name : 'Unknown'}</td>
        <td><span class="badge ${statusClass}">${proj.status}</span></td>
        <td><span class="badge ${paymentClass}">${proj.paymentStatus}</span></td>
        <td>${dueHtml}</td>
        <td>${progressHtml}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="editProject('${proj.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteProject('${proj.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function loadTasksView() {
  try {
    const projects = await apiCall('/projects');
    state.projects = projects;
    
    const select = document.getElementById('task-project-select');
    select.innerHTML = '<option value="">-- Choose Project --</option>' + 
      projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
      
    document.getElementById('tasks-list').innerHTML = '<p class="text-muted">Select a project to view tasks.</p>';
    document.getElementById('btn-add-task').disabled = true;
  } catch (err) {
    showToast('Failed to set up tasks view', 'danger');
  }
}

document.getElementById('task-project-select').addEventListener('change', (e) => {
  const projectId = e.target.value;
  const btnAddTask = document.getElementById('btn-add-task');
  if (!projectId) {
    document.getElementById('tasks-list').innerHTML = '<p class="text-muted">Select a project to view tasks.</p>';
    btnAddTask.disabled = true;
    return;
  }
  btnAddTask.disabled = false;
  loadTasksForProject(projectId);
});

async function loadTasksForProject(projectId) {
  try {
    const tasks = await apiCall(`/tasks/project/${projectId}`);
    state.tasks = tasks;
    renderTasks();
  } catch (err) {
    showToast('Failed to load tasks', 'danger');
  }
}

function renderTasks() {
  const list = document.getElementById('tasks-list');
  if (state.tasks.length === 0) {
    list.innerHTML = '<p class="text-muted text-center">No tasks found. Add one!</p>';
    return;
  }
  
  list.innerHTML = state.tasks.map(task => {
    let dueHtml = '';
    if (task.dueDate) {
      const isOverdue = new Date(task.dueDate) < new Date() && !task.isComplete;
      dueHtml = `<small class="${isOverdue ? 'text-danger' : 'text-muted'}" style="margin-left: 0.5rem;">Due: ${task.dueDate}</small>`;
    }
    return `
      <div class="task-item">
        <div class="task-info">
          <input type="checkbox" ${task.isComplete ? 'checked' : ''} onchange="toggleTask('${task.id}', this.checked)">
          <span class="task-title ${task.isComplete ? 'completed' : ''}">${task.title}</span>
          ${dueHtml}
        </div>
        <button class="btn btn-sm btn-danger" onclick="deleteTask('${task.id}')">Delete</button>
      </div>
    `;
  }).join('');
}

window.toggleTask = async (id, isComplete) => {
  try {
    await apiCall(`/tasks/${id}`, 'PUT', { isComplete });
    const task = state.tasks.find(t => t.id === id);
    if(task) task.isComplete = isComplete;
    renderTasks();
  } catch (err) {
    showToast('Failed to update task', 'danger');
  }
};

const modals = document.querySelectorAll('.modal');
document.querySelectorAll('.close').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const modalId = e.target.getAttribute('data-modal');
    document.getElementById(modalId).classList.remove('active');
  });
});

window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.classList.remove('active');
  }
}

document.getElementById('btn-add-client').addEventListener('click', () => {
  document.getElementById('form-client').reset();
  document.getElementById('client-id').value = '';
  document.getElementById('modal-client-title').innerText = 'Add Client';
  document.getElementById('modal-client').classList.add('active');
});

window.editClient = (id) => {
  const client = state.clients.find(c => c.id === id);
  if (!client) return;
  document.getElementById('client-id').value = client.id;
  document.getElementById('client-name').value = client.name;
  document.getElementById('client-email').value = client.email || '';
  document.getElementById('client-company').value = client.company || '';
  document.getElementById('modal-client-title').innerText = 'Edit Client';
  document.getElementById('modal-client').classList.add('active');
};

document.getElementById('form-client').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('client-id').value;
  const name = document.getElementById('client-name').value;
  const email = document.getElementById('client-email').value;
  const company = document.getElementById('client-company').value;
  
  try {
    if (id) {
      await apiCall(`/clients/${id}`, 'PUT', { name, email, company });
      showToast('Client updated');
    } else {
      await apiCall('/clients', 'POST', { name, email, company });
      showToast('Client added');
    }
    document.getElementById('modal-client').classList.remove('active');
    loadClients();
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

window.deleteClient = async (id) => {
  if (!confirm('Are you sure you want to delete this client?')) return;
  try {
    await apiCall(`/clients/${id}`, 'DELETE');
    showToast('Client deleted');
    loadClients();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

document.getElementById('btn-add-project').addEventListener('click', async () => {
  document.getElementById('form-project').reset();
  document.getElementById('project-id').value = '';
  document.getElementById('modal-project-title').innerText = 'Add Project';
  await populateClientSelect();
  document.getElementById('modal-project').classList.add('active');
});

async function populateClientSelect(selectedId = null) {
  if (state.clients.length === 0) await loadClients();
  const select = document.getElementById('project-client-id');
  select.innerHTML = state.clients.map(c => 
    `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.name} (${c.company||''})</option>`
  ).join('');
}

window.editProject = async (id) => {
  const project = state.projects.find(p => p.id === id);
  if (!project) return;
  document.getElementById('project-id').value = project.id;
  document.getElementById('project-title').value = project.title;
  document.getElementById('project-desc').value = project.description || '';
  document.getElementById('project-status').value = project.status;
  document.getElementById('project-payment').value = project.paymentStatus;
  document.getElementById('project-due').value = project.dueDate || '';
  document.getElementById('project-notes').value = project.notes || '';
  document.getElementById('project-archived').checked = project.isArchived || false;
  
  await populateClientSelect(project.clientId);
  
  document.getElementById('modal-project-title').innerText = 'Edit Project';
  document.getElementById('modal-project').classList.add('active');
};

document.getElementById('form-project').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('project-id').value;
  const body = {
    title: document.getElementById('project-title').value,
    description: document.getElementById('project-desc').value,
    clientId: document.getElementById('project-client-id').value,
    status: document.getElementById('project-status').value,
    paymentStatus: document.getElementById('project-payment').value,
    dueDate: document.getElementById('project-due').value || null,
    notes: document.getElementById('project-notes').value,
    isArchived: document.getElementById('project-archived').checked
  };
  
  try {
    if (id) {
      await apiCall(`/projects/${id}`, 'PUT', body);
      showToast('Project updated');
    } else {
      await apiCall('/projects', 'POST', body);
      showToast('Project created');
    }
    document.getElementById('modal-project').classList.remove('active');
    loadProjects();
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

window.deleteProject = async (id) => {
  if (!confirm('Are you sure you want to delete this project?')) return;
  try {
    await apiCall(`/projects/${id}`, 'DELETE');
    showToast('Project deleted');
    loadProjects();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

document.getElementById('btn-add-task').addEventListener('click', () => {
  document.getElementById('form-task').reset();
  document.getElementById('modal-task').classList.add('active');
});

document.getElementById('form-task').addEventListener('submit', async (e) => {
  e.preventDefault();
  const projectId = document.getElementById('task-project-select').value;
  const title = document.getElementById('task-title').value;
  const dueDate = document.getElementById('task-due').value || null;
  
  try {
    await apiCall('/tasks', 'POST', { title, projectId, dueDate });
    showToast('Task added');
    document.getElementById('modal-task').classList.remove('active');
    loadTasksForProject(projectId);
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

window.deleteTask = async (id) => {
  if (!confirm('Are you sure you want to delete this task?')) return;
  try {
    await apiCall(`/tasks/${id}`, 'DELETE');
    showToast('Task deleted');
    const projectId = document.getElementById('task-project-select').value;
    loadTasksForProject(projectId);
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

init();
