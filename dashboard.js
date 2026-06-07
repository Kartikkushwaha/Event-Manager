const name =
localStorage.getItem("userName");

const email =
localStorage.getItem("userEmail");

const photo =
localStorage.getItem("userPhoto");

document.getElementById("name")
.textContent = name;

document.getElementById("email")
.textContent = email;

if(photo){

    const img =
    document.getElementById(
        "profilePhoto"
    );

    img.src = photo;

    img.style.display = "block";

}

else{

    document.getElementById(
        "profileLetter"
    ).textContent =
    name.charAt(0).toUpperCase();

}
