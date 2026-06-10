const container =
document.getElementById(
    "eventsContainer"
);

let events =
JSON.parse(
    localStorage.getItem(
        "events"
    )
) || [];

let workingEvents =
[...events];

function renderEvents(){

    container.innerHTML = "";

    if(
        workingEvents.length===0
    ){

        container.innerHTML =
        "<h2>No Events Found</h2>";

        return;
    }

    workingEvents.forEach(
        (event,index)=>{

            const card =
            document.createElement(
                "div"
            );

            card.className =
            "event-card";

            card.innerHTML = `
                <h2>
                ${event.eventName}
                </h2>

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

                <button
                class="deleteBtn">
                    Delete Event
                </button>
            `;

            const deleteBtn =
            card.querySelector(
                ".deleteBtn"
            );

            deleteBtn
            .addEventListener(
                "click",
                ()=>{

                    workingEvents.splice(
                        index,
                        1
                    );

                    renderEvents();

                }
            );

            container
            .appendChild(card);

        }
    );

}

renderEvents();

document
.getElementById(
    "updateBtn"
)
.addEventListener(
    "click",
    ()=>{

        localStorage.setItem(
            "events",
            JSON.stringify(
                workingEvents
            )
        );

        alert(
            "Changes Updated!"
        );

    }
);
