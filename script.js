const root = document.documentElement;
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const siteHeader = document.querySelector('.site-header');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

menuButton?.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.site-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    navigation.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
);

document.querySelectorAll('.stagger-group').forEach((group) => {
  group.querySelectorAll('.reveal').forEach((element, index) => {
    element.style.setProperty('--stagger-delay', `${Math.min(index * 90, 360)}ms`);
  });
});

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

document.querySelector('#year').textContent = new Date().getFullYear();

let ticking = false;

function updateScrollEffects() {
  const scrollTop = window.scrollY;
  const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(Math.max(scrollTop / scrollable, 0), 1);

  root.style.setProperty('--scroll', progress.toFixed(4));
  siteHeader?.classList.toggle('scrolled', scrollTop > 28);

  const process = document.querySelector('.process');
  if (process) {
    const rect = process.getBoundingClientRect();
    const processProgress = Math.min(Math.max((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0), 1);
    process.style.setProperty('--process-progress', processProgress.toFixed(4));
  }

  document.querySelectorAll('[data-depth]').forEach((element) => {
    if (prefersReducedMotion || window.innerWidth < 980) return;
    const depth = Number(element.dataset.depth || 0);
    const rect = element.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const elementCenter = rect.top + rect.height / 2;
    const offset = (viewportCenter - elementCenter) * depth;
    element.style.transform = `translate3d(0, ${offset}px, 0)`;
  });

  ticking = false;
}

function requestScrollUpdate() {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(updateScrollEffects);
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate);
updateScrollEffects();

const storyCourt = document.querySelector('.story-court');
const storyStatusText = document.querySelector('#story-status-text');
const storySteps = [...document.querySelectorAll('[data-story-step]')];
const storyStates = [
  { x: '13%', y: '70%', rotate: '-20deg', label: 'READ IT EARLY' },
  { x: '43%', y: '49%', rotate: '155deg', label: 'ARRIVE BALANCED' },
  { x: '78%', y: '24%', rotate: '330deg', label: 'CONTROL THE OUTCOME' },
];

function setStoryStage(stage) {
  const state = storyStates[stage];
  if (!storyCourt || !state) return;

  storyCourt.dataset.stage = String(stage);
  storyCourt.style.setProperty('--ball-x', state.x);
  storyCourt.style.setProperty('--ball-y', state.y);
  storyCourt.style.setProperty('--ball-rotate', state.rotate);
  storyStatusText.textContent = state.label;
  storySteps.forEach((step, index) => step.classList.toggle('is-active', index === stage));
}

const storyObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible) setStoryStage(Number(visible.target.dataset.storyStep));
  },
  { threshold: [0.35, 0.5, 0.65], rootMargin: '-16% 0px -30% 0px' }
);

storySteps.forEach((step) => storyObserver.observe(step));
setStoryStage(0);

const navSections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
);

navSections.forEach((section) => sectionObserver.observe(section));

if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.interactive-tilt').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 8;
      const rotateX = (0.5 - y) * 8;

      card.style.setProperty('--pointer-x', `${x * 100}%`);
      card.style.setProperty('--pointer-y', `${y * 100}%`);
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });

  document.querySelectorAll('.interactive-glow').forEach((panel) => {
    panel.addEventListener('pointermove', (event) => {
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty('--glow-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      panel.style.setProperty('--glow-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });
  });

  document.querySelectorAll('.magnetic').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      button.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
    });

    button.addEventListener('pointerleave', () => {
      button.style.transform = '';
    });
  });
}

const form = document.querySelector('#interest-form');
const formStatus = document.querySelector('#form-status');

form?.addEventListener('submit', (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const name = data.get('name');
  const email = data.get('email');
  const service = data.get('service');
  const message = data.get('message');

  const subject = encodeURIComponent(`Volleyball training request: ${service}`);
  const body = encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\nService: ${service}\n\nAthlete details, goals, and availability:\n${message}`
  );

  formStatus.textContent = 'Opening your email app with the request filled in.';
  window.location.href = `mailto:coachziahvolleyball@gmail.com?subject=${subject}&body=${body}`;
});
