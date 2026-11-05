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

  /* ---------- hero: fountain pen writes the letter ---------- */
  var letter = document.getElementById("letter");
  var pen = document.getElementById("pen");
  var lines = Array.prototype.slice.call(document.querySelectorAll("#poem .ln"));
  var PEN = 150;                       // rendered pen size; nib tip = bottom-left corner
  var penPos = { x: 0, y: 0, r: 0 };

  function tf(p) { return "translate(" + p.x + "px," + (p.y - PEN) + "px) rotate(" + p.r + "deg)"; }
  function place(p) { penPos = p; pen.style.transform = tf(p); }
  function restPos() { return { x: 18, y: letter.clientHeight + 58, r: 30 }; }
  function lineStart(ln) { return { x: ln.offsetLeft, y: ln.offsetTop + ln.offsetHeight * 0.8, r: 0 }; }

  function finishAll() {
    lines.forEach(function (ln) { ln.classList.add("done"); });
    place(restPos());
  }

  function move(to, ms) {
    var from = penPos;
    var mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 16, r: (from.r + to.r) / 2 };
    var a = pen.animate([{ transform: tf(from) }, { transform: tf(mid) }, { transform: tf(to) }],
      { duration: ms, easing: "ease-in-out", fill: "forwards" });
    return a.finished.then(function () { place(to); a.cancel(); });
  }

  function write(ln) {
    var start = lineStart(ln);
    var w = ln.offsetWidth;
    var dur = Math.max(650, ln.textContent.length * 46);
    var frames = [];
    var steps = Math.max(6, Math.round(ln.textContent.length / 2));
    for (var i = 0; i <= steps; i++) {
      var k = i / steps;
      var wob = (i % 2 ? -3 : 2) * (i === 0 || i === steps ? 0 : 1);
      frames.push({ transform: tf({ x: start.x + w * k, y: start.y + wob, r: wob * 0.6 }) });
    }
    var pa = pen.animate(frames, { duration: dur, easing: "linear", fill: "forwards" });
    var la = ln.animate([{ clipPath: "inset(-30% 100% -40% 0)" }, { clipPath: "inset(-30% -8% -40% 0)" }],
      { duration: dur, easing: "linear", fill: "forwards" });
    return Promise.all([pa.finished, la.finished]).then(function () {
      ln.classList.add("done"); la.cancel();
      place({ x: start.x + w, y: start.y, r: 0 }); pa.cancel();
    });
  }

  function runPen() {
    if (!letter || !pen || !lines.length) return;
    if (reduceMotion || !pen.animate) { finishAll(); return; }
    place({ x: letter.clientWidth + 40, y: -20, r: 10 });
    var chain = new Promise(function (r) { setTimeout(r, 500); });
    lines.forEach(function (ln) {
      chain = chain.then(function () { return move(lineStart(ln), 380); })
                   .then(function () { return write(ln); });
    });
    chain.then(function () { return move(restPos(), 900); }).catch(finishAll);
  }
  var started = false;
  function start() { if (!started) { started = true; runPen(); } }
  // begin once fonts are ready (so line widths are right) and the letter is on screen
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  var timeout = new Promise(function (r) { setTimeout(r, 2500); });
  var visible = new Promise(function (r) {
    if (!("IntersectionObserver" in window) || !letter) { r(); return; }
    var vo = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { vo.disconnect(); r(); }
    }, { threshold: 0.35 });
    vo.observe(letter);
  });
  Promise.all([Promise.race([fontsReady, timeout]), visible]).then(start);
  window.addEventListener("resize", function () {
    if (lines.every(function (l) { return l.classList.contains("done"); })) place(restPos());
  });

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
