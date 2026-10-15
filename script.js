(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

  $("#year").textContent = new Date().getFullYear();

  /* ---- split hero heading into words ---- */
  let n = 0;
  const split = (node) => {
    const f = document.createDocumentFragment();
    node.childNodes.forEach((c) => {
      if (c.nodeType === 3) {
        c.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { f.append(" "); return; }
          const w = document.createElement("span"), i = document.createElement("span");
          w.className = "w"; i.textContent = t; i.style.setProperty("--i", n++); w.append(i); f.append(w);
        });
      } else { const cl = c.cloneNode(false); cl.append(split(c)); f.append(cl); }
    });
    return f;
  };
  $$(".split").forEach((el) => { const label = el.textContent; el.setAttribute("aria-label", label); const frag = split(el); el.textContent = ""; el.append(frag); });

  /* ---- stagger delays ---- */
  $$("[data-stagger]").forEach((g) => $$(".reveal", g).forEach((el, i) => el.style.setProperty("--d", i * 90 + "ms")));

  /* ---- preloader -> ready ---- */
  let started = false;
  const start = () => { if (started) return; started = true; document.body.classList.add("ready"); init(); };
  addEventListener("load", () => setTimeout(start, reduce ? 0 : 1200));
  setTimeout(start, 4000);

  function init() {
    /* reveal on scroll */
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    $$(".reveal").forEach((el) => io.observe(el));

    /* counters */
    const co = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      co.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || "", t0 = performance.now(), dur = 1600;
      const tick = (t) => { const p = Math.min((t - t0) / dur, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(tick); };
      reduce ? (el.textContent = end + suf) : requestAnimationFrame(tick);
    }), { threshold: 0.6 });
    $$("[data-count]").forEach((el) => co.observe(el));
  }

  /* ---- header, progress, to-top ---- */
  const header = $(".header"), bar = $(".progress"), top = $(".to-top");
  let lastY = 0, ticking = false;
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    header.classList.toggle("scrolled", y > 20);
    header.classList.toggle("hide", y > lastY && y > 400 && !document.body.classList.contains("menu-open"));
    top.classList.toggle("show", y > 700);
    lastY = y; ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  top.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

  /* ---- active link ---- */
  const links = $$("[data-link]");
  const so = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => so.observe(s));

  /* ---- mobile menu ---- */
  const burger = $(".burger");
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  burger.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  $$(".nav-links a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  matchMedia("(min-width:821px)").addEventListener("change", (m) => m.matches && setMenu(false));

  /* ---- FAQ ---- */
  $$(".qa button").forEach((b) => b.addEventListener("click", () => {
    const item = b.parentElement, open = !item.classList.contains("open");
    $$(".qa").forEach((q) => { q.classList.remove("open"); $("button", q).setAttribute("aria-expanded", "false"); });
    if (open) { item.classList.add("open"); b.setAttribute("aria-expanded", "true"); }
  }));

  /* ---- fine-pointer effects ---- */
  if (fine && !reduce) {
    const cur = $(".cursor");
    let cx = 0, cy = 0, tx = 0, ty = 0;
    addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY; cur.classList.add("on");
      cur.classList.toggle("big", !!e.target.closest("a,button,[data-tilt],.card"));
    });
    const loop = () => { cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2; cur.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); };
    loop();

    $$(".spot").forEach((c) => c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect(); c.style.setProperty("--mx", e.clientX - r.left + "px"); c.style.setProperty("--my", e.clientY - r.top + "px");
    }));

    $$("[data-magnetic]").forEach((b) => {
      b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px,${(e.clientY - r.top - r.height / 2) * 0.35}px)`; });
      b.addEventListener("pointerleave", () => (b.style.transform = ""));
    });

    $$("[data-tilt]").forEach((t) => {
      t.addEventListener("pointermove", (e) => {
        const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        t.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
      });
      t.addEventListener("pointerleave", () => (t.style.transform = ""));
    });

    const hero = $(".hero");
    hero.addEventListener("pointermove", (e) => {
      hero.style.setProperty("--px", (e.clientX / innerWidth - 0.5).toFixed(3));
      hero.style.setProperty("--py", (e.clientY / innerHeight - 0.5).toFixed(3));
    });
  }

  /* ---- contact form ---- */
  const ENDPOINT = ""; // e.g. a Formspree URL: "https://formspree.io/f/xxxxxxx"
  const form = $("#form");
  const rules = {
    name: (v) => (v.trim().length < 2 ? "Please enter your name." : ""),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Please enter a valid email."),
    message: (v) => (v.trim().length < 10 ? "Tell us a bit more (10+ characters)." : ""),
  };
  const check = (field) => {
    const label = field.closest("label"), msg = rules[field.name](field.value);
    label.classList.toggle("err", !!msg); $("small", label).textContent = msg;
    return !msg;
  };
  $$("input,textarea", form).forEach((f) => f.addEventListener("input", () => f.closest("label").classList.contains("err") && check(f)));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const ok = $$("input,textarea", form).map(check).every(Boolean);
    if (!ok) return;
    const btn = $("button[type=submit]", form); btn.disabled = true;
    try {
      if (ENDPOINT) {
        const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        if (!r.ok) throw new Error("failed");
      } else await new Promise((r) => setTimeout(r, 700));
      form.classList.add("sent"); form.reset();
    } catch { alert("Something went wrong. Please try again."); }
    btn.disabled = false;
  });
})();
