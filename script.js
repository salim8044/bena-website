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

let cart = [];

const cartCounter = document.getElementById('cart-count');

const addToCartButtons = document.querySelectorAll('.add-to-cart');

addToCartButtons.forEach(button => {

    button.addEventListener('click', () => {

        const productName = button.dataset.name;

        const productPrice = button.dataset.price;

        const productImage = document.getElementById("main-product-image").src;

        cart.push({

            name: productName,
            price: productPrice,
            image: productImage

        });

        updateCart();

        openCart();

    });

});

/* UPDATE CART */

function updateCart() {

    const cartContent = document.querySelector(".cart-content");

    cartContent.innerHTML = "";

    cart.forEach(product => {

        cartContent.innerHTML += `

            <div class="cart-item">

                <img src="${product.image}" alt="${product.name}">

                <div>

                    <h4>${product.name}</h4>

                    <p>CHF ${product.price}</p>

                </div>

            </div>

        `;

    });

    if (cartCounter) {

        cartCounter.textContent = cart.length;

    }

}


/* NAVBAR SCROLL EFFECT */

const navbar = document.querySelector("nav");

window.addEventListener("scroll", () => {

    if (window.scrollY > 40) {

        navbar.classList.add("scrolled");

    } else {

        navbar.classList.remove("scrolled");

    }

});

/* PRODUCT IMAGE SWITCH */

function changeImage(element) {

    const mainImage = document.getElementById("main-product-image");

    mainImage.src = element.src;

}

/* QUANTITY SYSTEM */

let quantity = 1;

function increaseQuantity() {

    quantity++;

    document.getElementById("quantity").textContent = quantity;

}

function decreaseQuantity() {

    if (quantity > 1) {

        quantity--;

        document.getElementById("quantity").textContent = quantity;

    }

}

/* CART SIDEBAR */

function openCart() {

    document.getElementById("cart-sidebar").classList.add("active");

    document.getElementById("cart-overlay").classList.add("active");

}

function closeCart() {

    document.getElementById("cart-sidebar").classList.remove("active");

    document.getElementById("cart-overlay").classList.remove("active");

}

/* MOBILE MENU */

function toggleMobileMenu() {

    document.getElementById("mobile-menu").classList.toggle("active");

}