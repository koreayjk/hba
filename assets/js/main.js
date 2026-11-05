(function () {
  "use strict";
  var CONTACT_EMAIL = "hello@hba-story.org";
  var EN_MSG = {
    _formOk: "Your email app has opened — just press send. Thank you!",
    _newsOk: "Thank you! We'll be in touch soon."
  };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- language ---------- */
  var nodes = document.querySelectorAll("[data-i18n]");
  nodes.forEach(function (el) { el.dataset.en = el.innerHTML; });
  var lang = "en";
  function t(key) { return lang === "ko" ? (window.HBA_KO[key] || EN_MSG[key]) : EN_MSG[key]; }
  function setLang(next) {
    lang = next === "ko" ? "ko" : "en";
    document.documentElement.lang = lang;
    nodes.forEach(function (el) {
      var ko = window.HBA_KO && window.HBA_KO[el.getAttribute("data-i18n")];
      el.innerHTML = lang === "ko" && ko !== undefined ? ko : el.dataset.en;
    });
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    });
    var poemEl = document.getElementById("poem");
    if (poemEl) poemEl.setAttribute("aria-label", Array.prototype.map.call(poemEl.querySelectorAll(".ln"), function (l) { return l.textContent; }).join(" "));
    try { localStorage.setItem("hba-lang", lang); } catch (e) {}
  }
  var saved = null;
  try { saved = localStorage.getItem("hba-lang"); } catch (e) {}
  var param = new URLSearchParams(location.search).get("lang");
  setLang(param || saved || ((navigator.language || "").toLowerCase().indexOf("ko") === 0 ? "ko" : "en"));
  document.querySelectorAll(".lang button").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.lang); });
  });

  /* ---------- mobile menu ---------- */
  var btn = document.getElementById("menuBtn");
  var nav = document.getElementById("nav");
  function closeMenu() { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
  btn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- hero: a real fountain pen writes the letter on the photo ---------- */
  var stage = document.getElementById("stage");
  var pen = document.getElementById("pen");
  var poem = document.getElementById("poem");
  var lines = Array.prototype.slice.call(document.querySelectorAll("#poem .ln"));
  var penPos = { x: 0, y: 0, r: 0 };

  // nib tip = bottom-left corner of the pen image (transform-origin 0 100%)
  function tf(p) { return "translate(" + p.x + "px," + (p.y - pen.offsetHeight) + "px) rotate(" + p.r + "deg)"; }
  function place(p) { penPos = p; pen.style.transform = tf(p); }
  function rel(el) {
    var r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
  }
  function lineStart(ln) { var b = rel(ln); return { x: b.x, y: b.y + b.h * 0.7, r: 0 }; }
  function restPos() {
    var b = rel(poem), s = stage.getBoundingClientRect();
    return { x: b.x + b.w + s.width * 0.012, y: s.height * 0.44, r: -8 };
  }
  function offstage() { var s = stage.getBoundingClientRect(); return { x: s.width * 0.42, y: -s.height * 0.05, r: -6 }; }

  function finishAll() { lines.forEach(function (ln) { ln.classList.add("done"); }); place(restPos()); }

  function move(to, ms) {
    var from = penPos;
    var mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - stage.clientWidth * 0.008, r: (from.r + to.r) / 2 };
    var an = pen.animate([{ transform: tf(from) }, { transform: tf(mid) }, { transform: tf(to) }],
      { duration: ms, easing: "cubic-bezier(.45,.05,.35,1)", fill: "forwards" });
    return an.finished.then(function () { place(to); an.cancel(); });
  }

  function write(ln) {
    var st = lineStart(ln), w = rel(ln).w;
    var n = ln.textContent.length;
    var dur = Math.max(650, n * 52);
    var steps = Math.max(8, Math.round(n * 0.8));
    var amp = stage.clientWidth * 0.0016;
    var frames = [];
    for (var i = 0; i <= steps; i++) {
      var k = i / steps;
      var edge = i === 0 || i === steps;
      var wob = edge ? 0 : Math.sin(i * 2.3) * amp + (i % 2 ? -amp : amp) * 0.6;
      frames.push({ transform: tf({ x: st.x + w * k, y: st.y + wob, r: edge ? 0 : Math.sin(i * 1.7) * 1.6 }) });
    }
    var pa = pen.animate(frames, { duration: dur, easing: "linear", fill: "forwards" });
    var la = ln.animate([{ clipPath: "inset(-30% 100% -40% 0)" }, { clipPath: "inset(-30% -6% -40% 0)" }],
      { duration: dur, easing: "linear", fill: "forwards" });
    return Promise.all([pa.finished, la.finished]).then(function () {
      ln.classList.add("done"); la.cancel();
      place({ x: st.x + w, y: st.y, r: 0 }); pa.cancel();
    });
  }

  function runPen() {
    if (!stage || !pen || !lines.length) return;
    if (reduceMotion || !pen.animate) { finishAll(); return; }
    place(offstage());
    var chain = new Promise(function (r) { setTimeout(r, 400); });
    lines.forEach(function (ln, i) {
      chain = chain.then(function () { return move(lineStart(ln), i === 0 ? 900 : 360); })
                   .then(function () { return write(ln); });
    });
    chain.then(function () { return move(restPos(), 1000); }).catch(finishAll);
  }
  var started = false;
  function start() { if (!started) { started = true; runPen(); playVideo(); } }
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  var penLoaded = new Promise(function (r) { if (pen && !pen.complete) { pen.onload = r; pen.onerror = r; } else r(); });
  var timeout = new Promise(function (r) { setTimeout(r, 2500); });
  var visible = new Promise(function (r) {
    if (!("IntersectionObserver" in window) || !stage) { r(); return; }
    var vo = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { vo.disconnect(); r(); }
    }, { threshold: 0.35 });
    vo.observe(stage);
  });
  Promise.all([Promise.race([Promise.all([fontsReady, penLoaded]), timeout]), visible]).then(start);
  window.addEventListener("resize", function () {
    if (lines.every(function (l) { return l.classList.contains("done"); })) place(restPos());
  });

  /* living photo: steam + swaying shadows (desktop only, when motion is welcome) */
  function playVideo() {
    var v = document.getElementById("heroVideo");
    if (!v || reduceMotion) return;
    if (!window.matchMedia("(min-width: 821px)").matches) return;
    if (navigator.connection && navigator.connection.saveData) return;
    v.preload = "auto";
    v.addEventListener("playing", function () { v.classList.add("playing"); }, { once: true });
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }

  /* ---------- get-involved buttons preselect topic ---------- */
  var topic = document.getElementById("cTopic");
  document.querySelectorAll("[data-topic]").forEach(function (a) {
    a.addEventListener("click", function () { topic.value = a.dataset.topic; });
  });

  /* ---------- forms (mailto until a form backend is connected) ---------- */
  document.getElementById("contactForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    var topicText = topic.options[topic.selectedIndex].text;
    var subject = "[HBA] " + topicText + " — " + f.name.value;
    var body = f.message.value + "\n\n— " + f.name.value + " <" + f.email.value + ">";
    location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    document.getElementById("formNote").textContent = t("_formOk");
  });
  document.getElementById("newsForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var email = document.getElementById("nlEmail").value;
    location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("[HBA] Newsletter sign-up") + "&body=" + encodeURIComponent("Please add me to the HBA mailing list: " + email);
    e.target.querySelector("button").textContent = t("_newsOk");
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
