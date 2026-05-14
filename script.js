/* FADE IN ANIMATION */

const fadeElements = document.querySelectorAll('.fade-in');

function checkFade() {

    fadeElements.forEach(element => {

        const elementTop = element.getBoundingClientRect().top;

        const windowHeight = window.innerHeight;

        if (elementTop < windowHeight - 100) {

            element.classList.add('show');
        }

    });

}

window.addEventListener('scroll', checkFade);

window.addEventListener('load', checkFade);

/* FAQ ACCORDION */

const faqQuestions = document.querySelectorAll('.faq-question');

faqQuestions.forEach(question => {

    question.addEventListener('click', () => {

        const answer = question.nextElementSibling;

        if (answer.style.maxHeight) {

            answer.style.maxHeight = null;

            answer.style.padding = "0 25px";

        } else {

            answer.style.maxHeight = answer.scrollHeight + "px";

            answer.style.padding = "20px 25px";
        }

    });

});

/* CART SYSTEM */

let cartCount = 0;

const cartCounter = document.getElementById('cart-count');

const addToCartButtons = document.querySelectorAll('.add-to-cart');

addToCartButtons.forEach(button => {

    button.addEventListener('click', () => {

        cartCount++;

        cartCounter.textContent = cartCount;

    });

});