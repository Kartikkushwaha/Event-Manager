
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
