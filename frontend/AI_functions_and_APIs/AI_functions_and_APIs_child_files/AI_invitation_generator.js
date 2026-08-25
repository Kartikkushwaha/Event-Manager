// --- Theme Toggle Logic ---
const themeBtn = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

// Apply saved theme on initial load
if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeBtn.textContent = "☀️";
} else {
    themeBtn.textContent = "🌙";
}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    
    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
        themeBtn.textContent = "☀️"; // Sun icon for switching back to light mode
    } else {
        localStorage.setItem("theme", "light");
        themeBtn.textContent = "🌙"; 
    }
});

// --- Mobile Hamburger Menu Logic (Click-to-Close Fix) ---
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navLinks = document.getElementById('navLinks');

    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents document click from firing immediately
            navLinks.classList.toggle('active-menu');
        });

        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active-menu') && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active-menu');
            }
        });
    }
});