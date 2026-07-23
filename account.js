const PROFILE_KEY = 'lvlup_demo_profile_v1';

const tabs = [...document.querySelectorAll('[data-tab]')];
const panels = [...document.querySelectorAll('[data-panel]')];
const signinForm = document.querySelector('#signin-form');
const createForm = document.querySelector('#create-form');
const dashboard = document.querySelector('#account-dashboard');
const guardianFields = document.querySelector('#guardian-fields');
const ageRange = createForm?.elements.ageRange;
const signinStatus = document.querySelector('#signin-status');
const createStatus = document.querySelector('#create-status');

function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function initials(name = 'LV') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map((part) => part[0]).join('') || 'LV').toUpperCase();
}

function levelForExperience(experience) {
  const map = {
    new: { name: 'Foundation', number: 'LVL 1', progress: 18 },
    beginner: { name: 'Foundation', number: 'LVL 1', progress: 34 },
    intermediate: { name: 'Reliable', number: 'LVL 2', progress: 48 },
    competitive: { name: 'Competitive', number: 'LVL 3', progress: 68 },
    advanced: { name: 'Competitive', number: 'LVL 3', progress: 82 },
    coach: { name: 'Leader', number: 'LVL 5', progress: 88 }
  };
  return map[experience] || map.new;
}

function experienceLabel(value) {
  const labels = {
    new: 'Completely new',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    competitive: 'Competitive',
    advanced: 'College or advanced adult',
    coach: 'Coach'
  };
  return labels[value] || 'Volleyball profile';
}

function showPanel(name) {
  tabs.forEach((tab) => {
    const active = tab.dataset.tab === name;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });

  panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== name;
  });

  dashboard.hidden = true;
  window.location.hash = name;
}

function populateDashboard(profile) {
  const level = levelForExperience(profile.experience);
  document.querySelector('#dashboard-avatar').textContent = initials(profile.name);
  document.querySelector('#dashboard-name').textContent = profile.name;
  document.querySelector('#dashboard-subtitle').textContent = `${profile.position || 'Volleyball'} · ${experienceLabel(profile.experience)}`;
  document.querySelector('#dashboard-level-name').textContent = level.name;
  document.querySelector('#dashboard-level-number').textContent = level.number;
  document.querySelector('#dashboard-progress-bar').style.width = `${level.progress}%`;
  document.querySelector('#dashboard-focus').textContent = profile.focus || 'Build repeatable movement.';
  document.querySelector('#dashboard-goal').textContent = profile.goal || 'Add your first development goal.';

  panels.forEach((panel) => panel.hidden = true);
  tabs.forEach((tab) => tab.classList.remove('is-active'));
  dashboard.hidden = false;
  window.location.hash = 'profile';
}

function updateGuardianFields() {
  if (!ageRange || !guardianFields) return;
  const needsGuardian = ageRange.value === 'under13' || ageRange.value === '13to17';
  guardianFields.hidden = !needsGuardian;
  guardianFields.querySelectorAll('input').forEach((input) => {
    input.required = needsGuardian;
  });
}

function fillCreateForm(profile) {
  if (!profile || !createForm) return;
  Object.entries(profile).forEach(([key, value]) => {
    const field = createForm.elements[key];
    if (field && typeof value === 'string') field.value = value;
  });
  updateGuardianFields();
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => showPanel(tab.dataset.tab));
});

ageRange?.addEventListener('change', updateGuardianFields);

signinForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const profile = readProfile();
  const email = String(new FormData(signinForm).get('email') || '').trim().toLowerCase();

  if (!profile) {
    signinStatus.textContent = 'No demo profile exists in this browser yet. Create one first.';
    return;
  }

  if (String(profile.email || '').toLowerCase() !== email) {
    signinStatus.textContent = 'That email does not match the demo profile saved in this browser.';
    return;
  }

  signinStatus.textContent = 'Profile opened. The demo password was not stored or checked.';
  populateDashboard(profile);
});

createForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  updateGuardianFields();

  if (!createForm.reportValidity()) return;

  const data = new FormData(createForm);
  const profile = {
    name: String(data.get('name') || '').trim(),
    email: String(data.get('email') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    role: String(data.get('role') || ''),
    ageRange: String(data.get('ageRange') || ''),
    experience: String(data.get('experience') || ''),
    position: String(data.get('position') || 'Not selected'),
    focus: String(data.get('focus') || ''),
    goal: String(data.get('goal') || '').trim(),
    guardianName: String(data.get('guardianName') || '').trim(),
    guardianEmail: String(data.get('guardianEmail') || '').trim(),
    createdAt: new Date().toISOString()
  };

  writeProfile(profile);
  createStatus.textContent = 'Demo profile created on this device.';
  populateDashboard(profile);
});

document.querySelector('#edit-profile')?.addEventListener('click', () => {
  const profile = readProfile();
  fillCreateForm(profile);
  showPanel('create');
  createStatus.textContent = 'Update the profile and save it again.';
});

document.querySelector('#sign-out')?.addEventListener('click', () => {
  dashboard.hidden = true;
  showPanel('signin');
  signinStatus.textContent = 'Signed out of the demo view. The local profile remains saved on this device.';
});

document.querySelector('#account-year').textContent = new Date().getFullYear();

const initialHash = window.location.hash.replace('#', '');
const savedProfile = readProfile();

if (initialHash === 'profile' && savedProfile) {
  populateDashboard(savedProfile);
} else if (initialHash === 'create') {
  showPanel('create');
} else {
  showPanel('signin');
}
