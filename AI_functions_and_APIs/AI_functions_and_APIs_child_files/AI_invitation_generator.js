// theme toggle logic
const themeBtn = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");
// Apply saved theme on initial load
if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeBtn.textContent = "☀️";
    themeBtn.addEventListener("click", () => {
         document.body.classList.toggle("dark-mode");
           if (document.body.classList.contains("dark-mode")) {
             localStorage.setItem("theme", "dark");
             themeBtn.textContent = "☀️"; // Sun icon for switching back to light mode
               } else {
                localStorage.setItem("theme", "light");
                  themeBtn.textContent = "🌙"; 
                   }
                }
                )}