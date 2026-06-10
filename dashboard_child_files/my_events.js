const container =
document.getElementById(
    "eventsContainer"
);

const savedTheme =
localStorage.getItem(
    "theme"
);

if(savedTheme==="dark"){

    document.body.classList.add(
        "dark-mode"
    );

}

const events =
JSON.parse(
    localStorage.getItem(
        "events"
    )
) || [];

if(events.length===0){

    container.innerHTML =
    "<h2>No Events Created Yet</h2>";

}

else{

    events.forEach(event=>{

        const card =
        document.createElement(
            "div"
        );

        card.className =
        "event-card";

        card.innerHTML = `
            <h2>${event.eventName}</h2>

            <p>
            Type:
            ${event.eventType}
            </p>

            <p>
            State:
            ${event.state}
            </p>

            <p>
            Event:
            ${event.category}
            </p>

            <p>
            Guests:
            ${event.guestCount}
            </p>
        `;

        container.appendChild(
            card
        );

    });

}
