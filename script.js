const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

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
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

document.querySelector('#year').textContent = new Date().getFullYear();

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
