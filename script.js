const slides = document.querySelectorAll(".slide");

let current = 0;

slides[current].classList.add("active");

setInterval(() => {

    slides[current].classList.remove("active");

    current++;

    if(current >= slides.length){
        current = 0;
    }

    slides[current].classList.add("active");

}, 3000);