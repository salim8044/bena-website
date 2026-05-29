/* =========================================================================
   BENA · Front-end script
   Modular, dependency-free.

   NOTE: All AI features below are pure on-device demos.
   In production, route requests through a server function that holds the
   API key — never expose private keys in client-side JavaScript.
   ========================================================================= */

(() => {
    "use strict";

    /* -------------------------------------------------------------------------
       Product catalogue (single source of truth for recommendations / cart)
       ------------------------------------------------------------------------- */
    const PRODUCTS = {
        premium: {
            id: "premium",
            name: "Premium Medjool",
            tagline: "Karamellig · weich · aus dem ältesten Hain",
            price: 14.9,
            image: "images/Produktbild 6.png",
            href: "product-premium.html",
            keywords: ["weich", "süß", "süss", "karamell", "luxus", "luxuriös", "premium", "geschenk", "medjool"],
            index: "01",
            edition: "Ernte 2026",
            variety: "Medjool · Aswan · Grade A",
            notes: "Butterweich, karamellig — mit einem Hauch dunkler Schokolade im Abgang.",
            meta: [
                { label: "Inhalt", value: "250 g" },
                { label: "Ernte", value: "09 / 2026" },
                { label: "Sortierung", value: "Grade A" }
            ],
            feature: false
        },
        editor: {
            id: "editor",
            name: "Editor's Box",
            tagline: "Drei Sorten · limitierte Edition",
            price: 38.0,
            image: "images/Produktbild 4.png",
            href: "product-premium.html",
            keywords: ["geschenk", "box", "feinschmecker", "tasting", "limitiert", "edel"],
            index: "02",
            edition: "Limitiert · 1 200 Boxen",
            variety: "Cuvée · 3 Sorten · Edition 2026",
            notes: "Die einzige Box, in der unsere drei Sorten nebeneinander stehen. Zum Verschenken — oder um sich selbst kennenzulernen.",
            meta: [
                { label: "Inhalt", value: "3 × 180 g" },
                { label: "Edition", value: "2026" },
                { label: "Auflage", value: "1 200" }
            ],
            feature: true
        },
        bio: {
            id: "bio",
            name: "Bio Sukkari",
            tagline: "Knackig · honigsüß · EU-Bio",
            price: 12.9,
            image: "images/Produktbild 7.png",
            href: "product-bio.html",
            keywords: ["bio", "organisch", "natürlich", "natural", "leicht", "knackig", "energy", "sport", "fitness", "training"],
            index: "03",
            edition: "Bio · Ernte 2026",
            variety: "Sukkari · Aswan · EU-Bio",
            notes: "Knackig, honigsüß, kompakt — aus unserem zertifizierten Bio-Hain Nord.",
            meta: [
                { label: "Inhalt", value: "250 g" },
                { label: "Ernte", value: "09 / 2026" },
                { label: "Zertifikat", value: "CH-BIO-006" }
            ],
            feature: false
        }
    };

    const SHOWCASE_ORDER = ["premium", "editor", "bio"];

    function formatPrice(amount) {
        return `CHF ${amount.toFixed(2)}`;
    }

    function renderProductCard(product, delay = 0) {
        const featureClass = product.feature ? " product--feature" : "";
        const metaHtml = product.meta.map((cell) => `
            <div class="product__meta-cell">
                <dt>${cell.label}</dt>
                <dd>${cell.value}</dd>
            </div>
        `).join("");

        return `
            <article class="product${featureClass} reveal" data-reveal-delay="${delay}">
                <a href="${product.href}" class="product__link" aria-label="${product.name} ansehen">
                    <div class="product__top">
                        <span class="product__index">№ ${product.index}</span>
                        <span class="product__edition">${product.edition}</span>
                    </div>
                    <div class="product__media">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="product__body">
                        <h3 class="product__name">${product.name}</h3>
                        <p class="product__variety">${product.variety}</p>
                        <p class="product__notes">${product.notes}</p>
                        <dl class="product__meta">${metaHtml}</dl>
                        <div class="product__foot">
                            <span class="product__price">${formatPrice(product.price)}</span>
                            <span class="product__arrow" aria-hidden="true">
                                Ansehen
                                <i class="fa-solid fa-arrow-right"></i>
                            </span>
                        </div>
                    </div>
                </a>
            </article>
        `;
    }

    function mountShowcaseGrids() {
        document.querySelectorAll("[data-showcase-grid]").forEach((grid) => {
            const exclude = (grid.dataset.showcaseExclude || "")
                .split(",")
                .map((id) => id.trim())
                .filter(Boolean);

            const items = SHOWCASE_ORDER
                .filter((id) => !exclude.includes(id))
                .map((id) => PRODUCTS[id])
                .filter(Boolean);

            grid.innerHTML = items
                .map((product, i) => renderProductCard(product, i * 80))
                .join("");
        });
    }

    /* -------------------------------------------------------------------------
       Header injection (re-usable across pages)
       ------------------------------------------------------------------------- */
    async function mountHeader() {
        const mount = document.getElementById("site-header");
        if (!mount) return;

        const base = mount.dataset.base || "";
        try {
            const res = await fetch(`${base}includes/site-header.html`);
            if (!res.ok) throw new Error(res.statusText);
            mount.innerHTML = await res.text();
        } catch (err) {
            console.warn("Bena · navigation konnte nicht geladen werden.", err);
            return;
        }

        initMobileNav();
        initCartIcon();
        initNavScroll();
        setActiveNavLink();
        syncCartCount();
    }

    /* -------------------------------------------------------------------------
       Navigation: scroll state
       ------------------------------------------------------------------------- */
    function initNavScroll() {
        const nav = document.querySelector(".nav");
        if (!nav) return;
        const onScroll = () => {
            nav.classList.toggle("is-scrolled", window.scrollY > 24);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* -------------------------------------------------------------------------
       Navigation: active link
       ------------------------------------------------------------------------- */
    function setActiveNavLink() {
        const current = window.location.pathname.split("/").pop() || "index.html";
        const hash = window.location.hash;

        document.querySelectorAll(".nav__links a").forEach((link) => {
            const url = new URL(link.href, window.location.href);
            const page = url.pathname.split("/").pop() || "index.html";
            const isSamePage = page === current;
            const isActive = isSamePage && (url.hash ? url.hash === hash : !hash || hash === "");
            link.classList.toggle("is-active", isActive);
            if (isActive) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
    }

    /* -------------------------------------------------------------------------
       Mobile drawer
       ------------------------------------------------------------------------- */
    function initMobileNav() {
        const btn = document.getElementById("mobile-menu-btn");
        const drawer = document.getElementById("nav-drawer");
        const overlay = document.getElementById("nav-overlay");
        const closeBtn = document.getElementById("nav-drawer-close");
        if (!btn || !drawer || !overlay) return;

        const open = () => {
            drawer.classList.add("is-open");
            btn.classList.add("is-open");
            btn.setAttribute("aria-expanded", "true");
            overlay.hidden = false;
            requestAnimationFrame(() => overlay.classList.add("is-visible"));
            document.body.classList.add("nav-open");
        };

        const close = () => {
            drawer.classList.remove("is-open");
            btn.classList.remove("is-open");
            btn.setAttribute("aria-expanded", "false");
            overlay.classList.remove("is-visible");
            document.body.classList.remove("nav-open");
            overlay.addEventListener(
                "transitionend",
                () => { if (!overlay.classList.contains("is-visible")) overlay.hidden = true; },
                { once: true }
            );
        };

        btn.addEventListener("click", () => {
            drawer.classList.contains("is-open") ? close() : open();
        });
        closeBtn?.addEventListener("click", close);
        overlay.addEventListener("click", close);
        drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && drawer.classList.contains("is-open")) close();
        });
        window.addEventListener("resize", () => {
            if (window.innerWidth > 960 && drawer.classList.contains("is-open")) close();
        });
    }

    /* -------------------------------------------------------------------------
       Reveal-on-scroll (IntersectionObserver)
       ------------------------------------------------------------------------- */
    function initReveal() {
        const items = document.querySelectorAll(".reveal");
        if (!items.length) return;

        if (!("IntersectionObserver" in window)) {
            items.forEach((el) => el.classList.add("is-visible"));
            return;
        }

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const delay = Number(entry.target.dataset.revealDelay) || 0;
                    setTimeout(() => entry.target.classList.add("is-visible"), delay);
                    io.unobserve(entry.target);
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
        );

        items.forEach((el) => io.observe(el));
    }

    /* -------------------------------------------------------------------------
       Cart (lightweight in-memory + drawer)
       ------------------------------------------------------------------------- */
    const cart = [];

    function syncCartCount() {
        const el = document.getElementById("cart-count");
        if (el) el.textContent = cart.length;
    }

    function renderCart() {
        const list = document.getElementById("cart-items");
        const empty = document.getElementById("cart-empty");
        const foot = document.getElementById("cart-foot");
        const total = document.getElementById("cart-total");
        if (!list || !empty || !foot || !total) return;

        if (cart.length === 0) {
            list.innerHTML = "";
            empty.hidden = false;
            foot.hidden = true;
            return;
        }

        empty.hidden = true;
        foot.hidden = false;
        list.innerHTML = cart
            .map(
                (item) => `
                <li class="cart__item">
                    <img src="${item.image}" alt="${item.name}">
                    <div>
                        <div class="cart__item-name">${item.name}</div>
                        <div class="cart__item-price">CHF ${item.price.toFixed(2)}</div>
                    </div>
                </li>
            `
            )
            .join("");

        const sum = cart.reduce((acc, item) => acc + item.price, 0);
        total.textContent = `CHF ${sum.toFixed(2)}`;
    }

    function initCartIcon() {
        const icon = document.querySelector(".cart-icon");
        if (!icon) return;
        icon.addEventListener("click", (e) => {
            e.preventDefault();
            openCart();
        });
    }

    function openCart() {
        const sidebar = document.getElementById("cart-sidebar");
        const overlay = document.getElementById("cart-overlay");
        if (!sidebar || !overlay) return;
        overlay.hidden = false;
        requestAnimationFrame(() => {
            sidebar.classList.add("is-open");
            sidebar.setAttribute("aria-hidden", "false");
            overlay.classList.add("is-visible");
        });
        document.body.style.overflow = "hidden";
        renderCart();
    }

    function closeCart() {
        const sidebar = document.getElementById("cart-sidebar");
        const overlay = document.getElementById("cart-overlay");
        if (!sidebar || !overlay) return;
        sidebar.classList.remove("is-open");
        sidebar.setAttribute("aria-hidden", "true");
        overlay.classList.remove("is-visible");
        document.body.style.overflow = "";
        overlay.addEventListener(
            "transitionend",
            () => {
                if (!overlay.classList.contains("is-visible")) overlay.hidden = true;
            },
            { once: true }
        );
    }
    window.closeCart = closeCart;

    /* -------------------------------------------------------------------------
       AI Date Finder
       ------------------------------------------------------------------------- */
    function initDateFinder() {
        const form = document.getElementById("ai-finder-form");
        const input = document.getElementById("taste-input");
        const chips = document.getElementById("ai-finder-chips");
        const result = document.getElementById("ai-finder-result");
        const status = document.getElementById("ai-finder-status");
        if (!form || !input || !result || !status) return;

        chips?.addEventListener("click", (e) => {
            const btn = e.target.closest("button[data-chip]");
            if (!btn) return;
            input.value = btn.dataset.chip;
            input.focus();
            form.dispatchEvent(new Event("submit"));
        });

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const value = input.value.trim();
            if (!value) {
                input.focus();
                return;
            }
            runRecommendation(value, { result, status });
        });
    }

    function pickProduct(query) {
        const q = query.toLowerCase();
        let best = null;
        let bestScore = 0;
        Object.values(PRODUCTS).forEach((p) => {
            const score = p.keywords.reduce((acc, kw) => (q.includes(kw) ? acc + 1 : acc), 0);
            if (score > bestScore) {
                best = p;
                bestScore = score;
            }
        });
        return best || PRODUCTS.premium;
    }

    function runRecommendation(query, { result, status }) {
        status.textContent = "Wir suchen die passende Sorte für dich…";
        status.classList.add("is-thinking");
        result.classList.remove("is-visible");

        const product = pickProduct(query);

        setTimeout(() => {
            const description = craftRecommendationCopy(query, product);
            result.innerHTML = `
                <article class="rec">
                    <div class="rec__label">Unsere Empfehlung</div>
                    <h3 class="rec__title">${product.name}</h3>
                    <p class="rec__desc">${description}</p>
                    <div class="rec__foot">
                        <span class="rec__price">CHF ${product.price.toFixed(2)}</span>
                        <a href="${product.href}" class="rec__link">
                            <span>Ansehen</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                </article>
            `;
            requestAnimationFrame(() => result.classList.add("is-visible"));
            status.textContent = "";
            status.classList.remove("is-thinking");
        }, 900);
    }

    function craftRecommendationCopy(query, product) {
        const q = query.toLowerCase();

        if (product.id === "premium") {
            return `Die <strong>${product.name}</strong>. Weich, karamellig, mit einem Hauch dunkler Schokolade im Abgang — aus den ältesten Palmen unseres Hains.`;
        }
        if (product.id === "bio") {
            return `Die <strong>${product.name}</strong>. Knackiger Biss, klare Honignote, EU-Bio aus unserem Hain Nord — für den ehrlichen Alltag.`;
        }
        if (product.id === "editor") {
            const isGift = q.includes("geschenk") || q.includes("gift");
            return `Die <strong>${product.name}</strong>. Drei Sorten, ein Hain — ${isGift ? "zum Verschenken, mit Geschichte" : "um Bena kennenzulernen"}.`;
        }
        return `Die <strong>${product.name}</strong>. ${product.tagline}.`;
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /* -------------------------------------------------------------------------
       Newsletter (front-end micro-interaction; replace with real endpoint)
       ------------------------------------------------------------------------- */
    function initNewsletter() {
        const form = document.getElementById("newsletter-form");
        if (!form) return;

        const input = form.querySelector('input[type="email"]');
        const btn = form.querySelector("button");

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!input?.value || !input.checkValidity()) {
                input?.focus();
                input?.reportValidity?.();
                return;
            }

            const originalLabel = btn.querySelector("span").textContent;
            btn.querySelector("span").textContent = "Wird abgeschickt…";
            btn.disabled = true;

            await sleep(900);

            form.classList.add("is-success");
            if (!form.querySelector(".newsletter__success")) {
                const success = document.createElement("p");
                success.className = "newsletter__success";
                success.innerHTML =
                    '<i class="fa-solid fa-circle-check"></i> Willkommen bei Bena. Dein 5%-Code ist unterwegs.';
                form.appendChild(success);
            }

            input.value = "";
            btn.querySelector("span").textContent = originalLabel;
            btn.disabled = false;
        });
    }

    /* -------------------------------------------------------------------------
       Product detail page — gallery
       ------------------------------------------------------------------------- */
    function initPDPGallery() {
        const stage = document.getElementById("pdp-stage");
        const main = document.getElementById("pdp-main");
        const thumbs = document.querySelectorAll(".pdp__thumb");
        if (!stage || !main || !thumbs.length) return;

        thumbs.forEach((thumb) => {
            thumb.addEventListener("click", () => {
                const src = thumb.dataset.image;
                const alt = thumb.dataset.alt || main.alt;
                if (!src || main.src.endsWith(src)) return;

                stage.classList.add("is-switching");
                setTimeout(() => {
                    main.src = src;
                    main.alt = alt;
                    requestAnimationFrame(() => stage.classList.remove("is-switching"));
                }, 220);

                thumbs.forEach((t) => {
                    t.classList.toggle("is-active", t === thumb);
                    t.setAttribute("aria-selected", t === thumb ? "true" : "false");
                });
            });
        });
    }

    /* -------------------------------------------------------------------------
       Product detail page — quantity + add-to-cart
       ------------------------------------------------------------------------- */
    function initPDPActions() {
        const qtyEl = document.getElementById("pdp-qty");
        const dec = document.querySelector(".pdp__qty-dec");
        const inc = document.querySelector(".pdp__qty-inc");
        const ctaPrice = document.querySelector(".pdp__cta-price");
        const priceEl = document.querySelector(".pdp__price");
        const stickyAmount = document.querySelector(".sticky-buy__amount");

        const basePrice = priceEl ? parseFloat(priceEl.dataset.basePrice || "0") : 0;

        function renderPrice() {
            if (!qtyEl) return;
            const qty = parseInt(qtyEl.textContent, 10) || 1;
            const sum = (basePrice * qty).toFixed(2);
            if (ctaPrice) ctaPrice.textContent = `CHF ${sum}`;
            if (stickyAmount) stickyAmount.textContent = `CHF ${sum}`;
            if (dec) dec.disabled = qty <= 1;
        }

        if (qtyEl && dec && inc) {
            dec.addEventListener("click", () => {
                const v = Math.max(1, (parseInt(qtyEl.textContent, 10) || 1) - 1);
                qtyEl.textContent = v;
                renderPrice();
            });
            inc.addEventListener("click", () => {
                const v = Math.min(20, (parseInt(qtyEl.textContent, 10) || 1) + 1);
                qtyEl.textContent = v;
                renderPrice();
            });
            renderPrice();
        }

        document.querySelectorAll(".js-add-to-cart").forEach((btn) => {
            btn.addEventListener("click", () => {
                const name = btn.dataset.name || "Bena Produkt";
                const price = parseFloat(btn.dataset.price || "0");
                const image = btn.dataset.image || "images/Produktbild 6.png";
                const qty = parseInt(qtyEl?.textContent || "1", 10) || 1;

                for (let i = 0; i < qty; i++) cart.push({ name, price, image });

                syncCartCount();

                const label = btn.querySelector("span > span") || btn.querySelector("span");
                const originalHTML = btn.innerHTML;
                btn.classList.add("is-added");
                btn.innerHTML = '<i class="fa-solid fa-check"></i><span>Hinzugefügt</span>';

                setTimeout(() => {
                    btn.classList.remove("is-added");
                    btn.innerHTML = originalHTML;
                    openCart();
                }, 700);
            });
        });
    }

    /* -------------------------------------------------------------------------
       FAQ accordion
       ------------------------------------------------------------------------- */
    function initFAQ() {
        const items = document.querySelectorAll(".faq__item");
        if (!items.length) return;

        items.forEach((item) => {
            const btn = item.querySelector(".faq__question");
            const answer = item.querySelector(".faq__answer");
            const inner = item.querySelector(".faq__answer-inner");
            if (!btn || !answer || !inner) return;

            btn.addEventListener("click", () => {
                const isOpen = item.classList.contains("is-open");

                items.forEach((other) => {
                    if (other === item) return;
                    other.classList.remove("is-open");
                    const otherBtn = other.querySelector(".faq__question");
                    const otherAnswer = other.querySelector(".faq__answer");
                    if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
                    if (otherAnswer) otherAnswer.style.maxHeight = null;
                });

                if (isOpen) {
                    item.classList.remove("is-open");
                    btn.setAttribute("aria-expanded", "false");
                    answer.style.maxHeight = null;
                } else {
                    item.classList.add("is-open");
                    btn.setAttribute("aria-expanded", "true");
                    answer.style.maxHeight = inner.scrollHeight + "px";
                }
            });
        });
    }

    /* -------------------------------------------------------------------------
       Tasting bars — animate when section enters viewport
       ------------------------------------------------------------------------- */
    function initTasting() {
        const tasting = document.querySelector(".tasting");
        if (!tasting) return;

        if (!("IntersectionObserver" in window)) {
            tasting.classList.add("is-visible");
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        io.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.25 }
        );
        io.observe(tasting);
    }

    /* -------------------------------------------------------------------------
       Standalone newsletter form (newsletter.html)
       ------------------------------------------------------------------------- */
    function initStandaloneNewsletter() {
        const form = document.getElementById("news-form");
        if (!form) return;
        const email = form.querySelector("#news-email");
        const btn = form.querySelector("button[type='submit']");
        const success = form.querySelector(".newsletter__success");

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            if (!email || !email.value.trim() || !email.value.includes("@")) {
                email?.focus();
                email?.classList.add("has-error");
                setTimeout(() => email?.classList.remove("has-error"), 1200);
                return;
            }

            btn.disabled = true;
            const original = btn.innerHTML;
            btn.innerHTML = '<span>Wird gespeichert…</span>';

            setTimeout(() => {
                form.classList.add("is-success");
                if (success) success.hidden = false;
                btn.innerHTML = '<i class="fa-solid fa-check"></i><span>Angemeldet</span>';
                email.value = "";
                const nameField = form.querySelector("#news-name");
                if (nameField) nameField.value = "";

                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = original;
                }, 2400);
            }, 900);
        });
    }

    /* -------------------------------------------------------------------------
       Bootstrap
       ------------------------------------------------------------------------- */
    document.addEventListener("DOMContentLoaded", () => {
        mountHeader();
        mountShowcaseGrids();
        initReveal();
        initDateFinder();
        initNewsletter();

        initPDPGallery();
        initPDPActions();
        initFAQ();
        initTasting();
        initStandaloneNewsletter();
    });

})();
