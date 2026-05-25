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
            tagline: "Karamellig · weich · luxuriös",
            price: 14.9,
            image: "images/Produktbild 6.png",
            href: "product-premium.html",
            keywords: ["weich", "süß", "süss", "karamell", "luxus", "luxuriös", "premium", "geschenk", "medjool"]
        },
        editor: {
            id: "editor",
            name: "Editor's Box",
            tagline: "Drei Sorten · limitierte Edition",
            price: 38.0,
            image: "images/Produktbild 4.png",
            href: "product-premium.html",
            keywords: ["geschenk", "box", "feinschmecker", "tasting", "limitiert", "edel"]
        },
        bio: {
            id: "bio",
            name: "Bio Sukkari",
            tagline: "Knackig · natürlich · zertifiziert bio",
            price: 12.9,
            image: "images/Produktbild 7.png",
            href: "product-bio.html",
            keywords: ["bio", "organisch", "natürlich", "natural", "leicht", "knackig", "energy", "sport", "fitness", "training"]
        }
    };

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
        status.textContent = "Analysiere Geschmacksprofil…";
        status.classList.add("is-thinking");
        result.classList.remove("is-visible");

        const product = pickProduct(query);

        setTimeout(() => {
            const description = craftRecommendationCopy(query, product);
            result.innerHTML = `
                <div class="ai-rec">
                    <div class="ai-rec__head">
                        <i class="fa-solid fa-sparkles"></i>
                        Empfehlung · ${matchConfidence(query, product)}% Übereinstimmung
                    </div>
                    <h3 class="ai-rec__title">${product.name}</h3>
                    <p class="ai-rec__desc">${description}</p>
                    <div class="ai-rec__foot">
                        <span class="ai-rec__price">CHF ${product.price.toFixed(2)}</span>
                        <a href="${product.href}" class="ai-rec__link">
                            Ansehen
                            <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;
            requestAnimationFrame(() => result.classList.add("is-visible"));
            status.textContent = "Bereit für deinen nächsten Geschmack";
            status.classList.remove("is-thinking");
        }, 1100);
    }

    function craftRecommendationCopy(query, product) {
        const q = query.toLowerCase();
        const intro = pickOne([
            "Basierend auf deinem Geschmacksprofil",
            "Unser Sommelier-Modell empfiehlt",
            "Nach der Analyse deiner Worte"
        ]);

        if (product.id === "premium") {
            return `${intro}: Unsere <strong>${product.name}</strong> Linie. Weich, karamellig im Kern und mit einem Hauch von dunkler Schokolade im Abgang — eine Dattel für besondere Momente.`;
        }
        if (product.id === "bio") {
            return `${intro}: Unsere <strong>${product.name}</strong>. Knackiger Biss, klare Honig-Note, zertifizierte Bio-Qualität — perfekt als ehrlicher, natürlicher Begleiter im Alltag.`;
        }
        if (product.id === "editor") {
            const isGift = q.includes("geschenk") || q.includes("gift");
            return `${intro}: Unsere <strong>${product.name}</strong>. Drei Sorten in einer Geschenkbox — kuratiert für ${isGift ? "ein unvergessliches Präsent" : "neugierige Feinschmecker"}.`;
        }
        return `${intro}: Unsere <strong>${product.name}</strong>. ${product.tagline}.`;
    }

    function matchConfidence(query, product) {
        const q = query.toLowerCase();
        const hits = product.keywords.reduce((acc, kw) => (q.includes(kw) ? acc + 1 : acc), 0);
        const base = 72;
        const score = Math.min(98, base + hits * 7 + Math.floor(q.length / 6));
        return score;
    }

    function pickOne(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /* -------------------------------------------------------------------------
       AI Content Agent (typing animation demo)
       ------------------------------------------------------------------------- */
    const CONTENT_LIBRARY = {
        instagram: {
            premium: `Aswan. 6:42 Uhr.\nDie ersten Sonnenstrahlen erreichen den Palmenhain — und in diesem Moment werden unsere Premium Medjool geerntet.\n\nWeich. Karamellig. Ehrlich.\n\n— Bena. Die ehrlichste Dattel.\n\n#bena #medjool #aswan #premiumfood #cleansweets`,
            bio: `Wir lassen die Natur die Arbeit machen.\nUnsere Bio Sukkari wachsen ohne Eile, ohne Eingriffe, ohne Kompromisse.\n\nNur Sonne. Nur Erde. Nur Geduld.\n\n— Bena Bio. Aus Aswan.\n\n#bena #organic #biodates #sustainable #honestfood`,
            sport: `Drei Datteln vor dem Lauf. Drei nach dem Lauf.\nNatürliche Glukose, Kalium, kein verarbeiteter Zucker.\n\nSo trainieren unsere Athleten — so kannst auch du.\n\n— Bena. Energie aus Aswan.\n\n#bena #naturalenergy #fitnessfuel #cleansnack #medjool`,
            default: `Manche Marken sprechen über Premium.\nWir liefern es. Direkt aus den Palmenhainen Aswans.\n\nHandverlesen. Klimaneutral versendet.\n\n— Bena. Premium ohne Pose.\n\n#bena #premium #aswan #honestluxury`
        },
        tiktok: {
            premium: `Hook · 0–2 s: „So sieht eine Dattel aus, die CHF 14.90 kostet."\nReveal · 2–6 s: Slow-Mo Schnitt durch die Medjool, karamelliger Kern.\nValue · 6–12 s: „Aus Aswan. 24h Versand. Keine Verarbeitung."\nCTA · 12–15 s: „Bena. Link in der Bio."`,
            bio: `Hook · 0–3 s: „Bio-Datteln, die nicht teuer schmecken müssen."\nValue · 3–8 s: Vergleich Supermarkt vs. Bena Sukkari.\nMoment · 8–13 s: ASMR-Schnitt + Honig-Tropfen.\nCTA · 13–15 s: „Bena Bio. CHF 12.90. Link in der Bio."`,
            sport: `Hook · 0–2 s: „Energy-Riegel? Brauchst du nicht."\nValue · 2–8 s: 3 × Dattel vor dem Workout, Heart-Rate-Overlay.\nProof · 8–13 s: „Natürlich. Kein verarbeiteter Zucker."\nCTA · 13–15 s: „Bena. Link in der Bio."`,
            default: `Hook · 0–2 s: „Das ist keine normale Dattel."\nReveal · 2–6 s: Unboxing, Premium-Verpackung.\nStory · 6–12 s: „Aswan. Familie seit 3 Generationen."\nCTA · 12–15 s: „Bena. Link in der Bio."`
        },
        seo: {
            premium: `Premium Medjool Datteln aus Aswan, Ägypten — direkt importiert in die Schweiz.\n\nUnsere Medjool werden in den Palmenhainen unserer Familie im Süden Ägyptens kultiviert. Handverlesen, unverarbeitet und mit natürlich karamelligem Kern. Versandfertig innerhalb von 24 Stunden in der Schweiz, kostenloser Versand ab CHF 89.\n\nIdeal als Geschenk, als Energiequelle im Alltag oder als luxuriöses Detail auf jeder Käseplatte.`,
            bio: `Zertifizierte Bio Sukkari Datteln aus Ägypten — nachhaltig kultiviert, fair gehandelt, direkt in die Schweiz geliefert.\n\nUnsere Bio-Datteln wachsen ohne synthetische Düngemittel oder Pestizide auf den Familienfeldern in Aswan. Knackiger Biss, klare Honignote und transparente Lieferkette von der Palme bis zur Haustür.`,
            sport: `Datteln für Sport und Fitness — natürliche Energie aus Aswan.\n\nDrei Bena Datteln liefern rund 60 kcal aus natürlicher Glukose, Fructose und Kalium. Ohne verarbeiteten Zucker, ohne Zusätze. Ideal vor dem Training, während langer Läufe oder als ehrlicher Energy-Snack im Alltag.`,
            default: `Premium-Datteln aus Aswan, Ägypten — handverlesen, nachhaltig, direkt importiert.\n\nBena verbindet jahrhundertealte Anbaukunst mit moderner Sorgfalt. Jede Dattel wird in den Palmenhainen unserer Familie kultiviert und unverarbeitet in die Schweiz geliefert.`
        },
        email: {
            premium: `Betreff: Eine Dattel, die du vorzeigen möchtest.\n\nHallo,\n\nunsere Premium Medjool sind angekommen — und sie waren noch nie so weich. Karamellig im Kern, mit einem Hauch dunkler Schokolade im Abgang.\n\nLimitiert auf 1 200 Dosen. Versand startet morgen.\n\nMit warmen Grüßen aus Aswan,\nDein Bena Team`,
            bio: `Betreff: Bio ohne Kompromiss. Ehrlich aus Aswan.\n\nHallo,\n\nunsere neue Bio-Ernte ist eingetroffen. Knackig, honigsüß, zertifiziert. Versandfertig in der Schweiz.\n\nDanke, dass du Ehrlichkeit über Marketing wählst.\n\nMit warmen Grüßen,\nDein Bena Team`,
            sport: `Betreff: Drei Datteln. Kein Energy-Riegel mehr.\n\nHallo,\n\nseit unsere Athleten Bena vor dem Training essen, fragen sie nie wieder nach industriellen Snacks. Probier es selbst — natürliche Energie aus Aswan, ohne Zusätze.\n\nMit warmen Grüßen,\nDein Bena Team`,
            default: `Betreff: Eine kurze Nachricht aus Aswan.\n\nHallo,\n\nwir wollten uns kurz melden — mit einer neuen Ernte, einer neuen Geschichte und einem 5%-Code für dich.\n\nDanke, dass du dabei bist.\n\nMit warmen Grüßen,\nDein Bena Team`
        }
    };

    function detectArchetype(product) {
        const p = product.toLowerCase();
        if (/(bio|natur|organic)/.test(p)) return "bio";
        if (/(sport|fitness|energy|training|läuf|run)/.test(p)) return "sport";
        if (/(premium|medjool|luxus|edel|gift|geschenk)/.test(p)) return "premium";
        return "default";
    }

    function initContentAgent() {
        const form = document.getElementById("ai-agent-form");
        const result = document.getElementById("ai-agent-result");
        const loading = document.getElementById("ai-agent-loading");
        const loadingLabel = document.getElementById("ai-agent-loading-label");
        const platformSelect = document.getElementById("platform-select");
        const productInput = document.getElementById("product-input");
        if (!form || !result || !loading || !platformSelect || !productInput) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const product = productInput.value.trim() || "Premium Medjool";
            const platform = platformSelect.value;
            await generateContent({ product, platform, result, loading, loadingLabel });
        });
    }

    async function generateContent({ product, platform, result, loading, loadingLabel }) {
        const archetype = detectArchetype(product);
        const library = CONTENT_LIBRARY[platform] || CONTENT_LIBRARY.instagram;
        const copy = library[archetype] || library.default;

        result.classList.remove("is-visible");
        result.innerHTML = "";
        loading.hidden = false;

        const stages = [
            "Bena Agent analysiert Markenstimme…",
            "Sammelt Brand-Tokens aus Aswan-Archiv…",
            "Kalibriert Tonalität für " + platformLabel(platform) + "…",
            "Schreibt finalen Entwurf…"
        ];

        for (let i = 0; i < stages.length; i++) {
            loadingLabel.textContent = stages[i];
            await sleep(420);
        }

        loading.hidden = true;
        renderAgentScaffold({ result, platform, product });
        requestAnimationFrame(() => result.classList.add("is-visible"));
        await typeOut(result.querySelector(".ai-output__body"), copy, 14);
    }

    function renderAgentScaffold({ result, platform, product }) {
        result.innerHTML = `
            <div class="ai-output">
                <div class="ai-output__head">
                    <span class="ai-output__platform">
                        <i class="fa-solid fa-${platformIcon(platform)}"></i>
                        ${platformLabel(platform)} · ${escapeHTML(product)}
                    </span>
                    <button type="button" class="ai-output__copy" data-copy>
                        <i class="fa-regular fa-copy"></i>
                        Kopieren
                    </button>
                </div>
                <div class="ai-output__body"></div>
                <div class="ai-output__meta">
                    <span><strong>Tonalität</strong> Bena Editorial</span>
                    <span><strong>Brand-Score</strong> ${Math.floor(88 + Math.random() * 9)}/100</span>
                    <span><strong>Modell</strong> Bena Studio v1.2</span>
                </div>
            </div>
        `;

        const copyBtn = result.querySelector("[data-copy]");
        copyBtn?.addEventListener("click", async () => {
            const body = result.querySelector(".ai-output__body");
            try {
                await navigator.clipboard.writeText(body.textContent.trim());
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Kopiert';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Kopieren';
                }, 1600);
            } catch (err) {
                console.warn("Clipboard nicht verfügbar", err);
            }
        });
    }

    function platformLabel(p) {
        return ({
            instagram: "Instagram",
            tiktok: "TikTok",
            seo: "SEO Landingpage",
            email: "E-Mail Marketing"
        })[p] || "Content";
    }

    function platformIcon(p) {
        return ({
            instagram: "image",
            tiktok: "music",
            seo: "magnifying-glass",
            email: "envelope"
        })[p] || "sparkles";
    }

    async function typeOut(target, text, speed = 18) {
        target.innerHTML = '<span class="ai-output__cursor"></span>';
        const cursor = target.querySelector(".ai-output__cursor");
        for (let i = 0; i < text.length; i++) {
            const node = document.createTextNode(text[i]);
            target.insertBefore(node, cursor);
            await sleep(speed);
        }
        await sleep(800);
        cursor?.remove();
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, (c) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[c]);
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
       Hero parallax (subtle, perf-friendly)
       ------------------------------------------------------------------------- */
    function initHeroParallax() {
        const card = document.querySelector(".hero__card");
        if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        if (window.matchMedia("(pointer: coarse)").matches) return;

        const max = 8;
        let frame = null;
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                card.style.transform = `perspective(1200px) rotateY(${x * max * 0.4}deg) rotateX(${-y * max * 0.4}deg) translateY(-4px)`;
            });
        });
        card.addEventListener("mouseleave", () => {
            cancelAnimationFrame(frame);
            card.style.transform = "";
        });
    }

    /* -------------------------------------------------------------------------
       Bootstrap
       ------------------------------------------------------------------------- */
    document.addEventListener("DOMContentLoaded", () => {
        mountHeader();
        initReveal();
        initDateFinder();
        initContentAgent();
        initNewsletter();
        initHeroParallax();
    });

})();
