const scrollButtons = document.querySelectorAll('[data-scroll]');
scrollButtons.forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector(button.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' });
  });
});

const filters = document.querySelectorAll('.filter');
const cards = document.querySelectorAll('.work-card');
filters.forEach((filter) => {
  filter.addEventListener('click', () => {
    filters.forEach((item) => item.classList.remove('active'));
    filter.classList.add('active');
    const category = filter.dataset.filter;
    cards.forEach((card) => card.classList.toggle('is-hidden', category !== 'all' && card.dataset.category !== category));
  });
});

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
menuToggle?.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  nav.classList.toggle('is-open', !isOpen);
});
