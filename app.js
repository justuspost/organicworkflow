/* ===== Organic Workflow — interactions ===== */
(function () {
  "use strict";

  /* ---------- theme toggle (in-memory, no storage) ---------- */
  var root = document.documentElement;
  var prefersDark =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var theme = prefersDark ? "dark" : "light";
  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      theme = theme === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", theme);
      toggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    });
  }

  /* ---------- header scroll state ---------- */
  var header = document.getElementById("header");
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle("header--scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- mobile nav ---------- */
  var navToggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", open ? "false" : "true");
      navToggle.setAttribute("aria-expanded", open ? "false" : "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.setAttribute("data-open", "false");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- scroll reveal ---------- */
  var revealables = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, i) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var delay = Math.min(i * 70, 280);
            setTimeout(function () {
              el.classList.add("is-visible");
            }, delay);
            io.unobserve(el);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealables.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealables.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- application form ---------- */
  var form = document.getElementById("apply-form");
  var status = document.getElementById("form-status");
  var submitBtn = document.getElementById("submit-btn");

  function setStatus(state, html) {
    if (!status) return;
    status.setAttribute("data-state", state);
    status.innerHTML = html;
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        setStatus(
          "error",
          "Please complete the required fields — name, phone, email, city, trade, experience, license and consent."
        );
        var firstInvalid = form.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var data = {};
      new FormData(form).forEach(function (value, key) {
        data[key] = typeof value === "string" ? value.trim() : value;
      });
      data.consent = form.querySelector("#consent").checked;
      data.page = window.location.href;

      submitBtn.setAttribute("data-busy", "true");
      submitBtn.textContent = "Sending…";
      setStatus("", "");

      fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          return res
            .json()
            .catch(function () {
              return {};
            })
            .then(function (body) {
              return { ok: res.ok, body: body };
            });
        })
        .then(function (result) {
          if (!result.ok) throw new Error((result.body && result.body.error) || "Request failed");
          form.reset();
          setStatus(
            "ok",
            "<strong>Application received.</strong> Thanks for reaching out — we review every application personally and will follow up within two business days."
          );
        })
        .catch(function () {
          setStatus(
            "error",
            'Something went wrong sending your application. Please email us directly at <a href="mailto:justus@organicworkflow.com">justus@organicworkflow.com</a> and we will pick it up from there.'
          );
        })
        .then(function () {
          submitBtn.removeAttribute("data-busy");
          submitBtn.textContent = "Send my application";
        });
    });
  }
})();
