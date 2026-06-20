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
