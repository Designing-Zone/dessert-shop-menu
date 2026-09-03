/* Dessert Shop — light/dark theme switcher.
   Applies the stored (or system) theme before first paint and
   toggles it from the [data-theme-toggle] buttons. */
(function () {
  "use strict";

  var KEY = "dessert-shop-theme";
  var META_SELECTOR = 'meta[name="theme-color"]';

  function systemTheme() {
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function storedTheme() {
    try {
      var t = window.localStorage.getItem(KEY);
      return t === "dark" || t === "light" ? t : null;
    } catch (e) {
      return null;
    }
  }

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var meta = document.querySelector(META_SELECTOR);
    if (meta) {
      meta.setAttribute(
        "content",
        getComputedStyle(document.documentElement).getPropertyValue("--paper").trim()
      );
    }
  }

  /* Initial paint — must run before CSS renders. */
  apply(storedTheme() || systemTheme());

  /* Recompute theme-color after the first frame (tokens are now resolved). */
  window.addEventListener("load", function () {
    apply(storedTheme() || systemTheme());
  });

  /* Listen for system preference changes while no explicit choice is saved. */
  if (window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", function () {
        if (!storedTheme()) apply(systemTheme());
      });
  }

  /* Wire up the toggle buttons. */
  function current() {
    return document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  }

  document.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-theme-toggle]");
    if (!btn) return;
    var next = current() === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(KEY, next);
    } catch (e) {}
    apply(next);
  });
})();