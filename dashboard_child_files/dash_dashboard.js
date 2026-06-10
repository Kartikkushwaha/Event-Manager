const themeBtn =
document.getElementById(
    "themeToggle"
);

const savedTheme =
localStorage.getItem(
    "theme"
);

if(savedTheme==="dark"){

    document.body.classList.add(
        "dark-mode"
    );

    themeBtn.textContent="☀️";

}

themeBtn.addEventListener(
    "click",
    ()=>{

        document.body.classList.toggle(
            "dark-mode"
        );

        if(
            document.body.classList.contains(
                "dark-mode"
            )
        ){

            localStorage.setItem(
                "theme",
                "dark"
            );

            themeBtn.textContent="☀️";

        }

        else{

            localStorage.setItem(
                "theme",
                "light"
            );

            themeBtn.textContent="🌙";

        }

    }
);

const saveBtn =
document.getElementById(
    "saveBtn"
);

saveBtn.addEventListener(
    "click",
    ()=>{

        const eventData={

            eventName:
            document.getElementById(
                "name"
            ).value,

            eventType:
            document.getElementById(
                "eventType"
            ).value,

            state:
            document.getElementById(
                "state"
            ).value,

            category:
            document.getElementById(
                "eventCategory"
            ).value,

            guestCount:
            document.getElementById(
                "guestCount"
            ).value

        };

        let events=
        JSON.parse(
            localStorage.getItem(
                "events"
            )
        ) || [];

        events.push(eventData);

        localStorage.setItem(
            "events",
            JSON.stringify(events)
        );

        alert(
            "Event Saved Successfully!"
        );

        window.location.href =
        "../my_events.html";

    }
);
