
// toggle button 


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



const addGuestBtn =
document.getElementById(
    "addGuestBtn"
);

const guestContainer =
document.getElementById(
    "guestContainer"
);

const guestCount =
document.getElementById(
    "guestCount"
);

function updateGuestNumbers(){

    const rows =
    document.querySelectorAll(
        ".guest-row"
    );

    rows.forEach(
        (row,index)=>{

            row.querySelector(
                ".serial-box"
            ).textContent =
            index + 1;

        }
    );

    guestCount.textContent =
    `Total Guests: ${rows.length}`;
}

function createGuest(){

    const row =
    document.createElement(
        "div"
    );

    row.classList.add(
        "guest-row"
    );

    row.innerHTML = `
    
        <div class="serial-box"></div>

        <input
            type="text"
            class="guest-name"
            placeholder="Guest Name"
            required>

        <input
            type="text"
            class="guest-address"
            placeholder="Address">

        <input
            type="tel"
            class="guest-phone"
            placeholder="Phone">

        <button
            class="deleteBtn">
            Delete
        </button>
    
    `;

    row.querySelector(
        ".deleteBtn"
    ).addEventListener(
        "click",
        ()=>{

            row.remove();

            updateGuestNumbers();

        }
    );

    guestContainer.appendChild(
        row
    );

    updateGuestNumbers();
}

addGuestBtn.addEventListener(
    "click",
    createGuest
);

createGuest();

const saveGuestBtn = document.getElementById("saveGuestBtn");
saveGuestBtn.addEventListener("click",(e)=>{

    e.preventDefault();   // Page reload nahi hoga

    // Yahan apna save wala code likhna hai
    // Firestore ya LocalStorage

    console.log("Guest data saved!");

});
