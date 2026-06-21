// theme toggle button
const themeBtn = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeBtn.textContent = "☀️";
}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
        themeBtn.textContent = "☀️";
    } else {
        localStorage.setItem("theme", "light");
        themeBtn.textContent = "🌙";
    }
});

// Fixed: Added "document." and corrected "window.location.href"
document.getElementById("guestListBtn").addEventListener("click", () => {
    window.location.href = "AI_functions_and_APIs_child_files/guest_list_manager.html";
});


// Set up the Intersection Observer
const observerOptions = {
    root: null, // use the viewport
    rootMargin: '0px',
    threshold: 0.2 // Trigger when 20% of the box is visible
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        // If the box just scrolled into view
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            // Stop observing it so the animation only happens once
            observer.unobserve(entry.target); 
        }
    });
}, observerOptions);

// Grab all the overview boxes and start observing them
const overviewBoxes = document.querySelectorAll('.overview-box');
overviewBoxes.forEach(box => {
    observer.observe(box);
});
