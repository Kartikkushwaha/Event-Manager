// --- Theme Toggle Logic ---
const themeBtn = document.getElementById('themeToggle');
const root = document.documentElement;

const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
  root.setAttribute('data-theme', 'dark');
  themeBtn.textContent = '☀️';
}

themeBtn.addEventListener('click', () => {
  let theme = root.getAttribute('data-theme');
  if (theme === 'dark') {
    root.removeAttribute('data-theme');
    themeBtn.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  } else {
    root.setAttribute('data-theme', 'dark');
    themeBtn.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  }
});

// --- Drag to Scroll Logic ---
const slider = document.getElementById('carousel');
let isDown = false;
let startX;
let scrollLeft;
let isDragging = false; 

slider.addEventListener('mousedown', (e) => {
  isDown = true;
  isDragging = false; 
  startX = e.pageX - slider.offsetLeft;
  scrollLeft = slider.scrollLeft;
});

slider.addEventListener('mouseleave', () => {
  isDown = false;
});

slider.addEventListener('mouseup', (e) => {
  isDown = false;
  // Prevent the click event if the user was dragging
  if (isDragging) {
    const card = e.target.closest('.card');
    if (card) {
      card.style.pointerEvents = 'none';
      setTimeout(() => card.style.pointerEvents = 'auto', 50);
    }
  }
});

slider.addEventListener('mousemove', (e) => {
  if (!isDown) return; 
  e.preventDefault(); 
  isDragging = true; 
  const x = e.pageX - slider.offsetLeft;
  const walk = (x - startX) * 1.5; 
  slider.scrollLeft = scrollLeft - walk;
});
