(function () {
  "use strict";
  var CONTACT_EMAIL = "hello@hba-story.org";
  var EN_MSG = {
    _formOk: "Your email app has opened — just press send. Thank you!",
    _newsOk: "Thank you! We'll be in touch soon."
  };

  /* ---------- language ---------- */
  var nodes = document.querySelectorAll("[data-i18n]");
  nodes.forEach(function (el) { el.dataset.en = el.innerHTML; });
  var lang = "en";

  function t(key) { return lang === "ko" ? (window.HBA_KO[key] || EN_MSG[key]) : EN_MSG[key]; }

  function setLang(next) {
    lang = next === "ko" ? "ko" : "en";
    document.documentElement.lang = lang;
    nodes.forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var ko = window.HBA_KO && window.HBA_KO[key];
      el.innerHTML = lang === "ko" && ko !== undefined ? ko : el.dataset.en;
    });
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    });
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
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- lightbox (any img.zoom; data-full overrides src) ---------- */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  document.querySelectorAll("img.zoom").forEach(function (img) {
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    function open() {
      var src = img.dataset.full || img.currentSrc || img.src;
      lbImg.src = src;
      lbImg.alt = img.alt;
      if (lb.showModal) lb.showModal(); else window.open(src, "_blank");
    }
    img.addEventListener("click", open);
    img.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });
  document.getElementById("lbClose").addEventListener("click", function () { lb.close(); });
  lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });

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
