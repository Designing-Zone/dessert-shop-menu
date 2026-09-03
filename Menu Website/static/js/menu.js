/* Dessert Shop — minimal progressive enhancement */
(function () {
  "use strict";

  var header = document.querySelector("[data-header]");
  var links = Array.prototype.slice.call(document.querySelectorAll(".cat-link"));
  var sections = links
    .map(function (link) {
      return document.getElementById(link.getAttribute("href").slice(1));
    })
    .filter(Boolean);

  function onScroll() {
    if (header) header.classList.toggle("is-stuck", window.scrollY > 4);
  }

  /* Highlight the category whose section is currently in view. */
  function spy() {
    if (!sections.length) return;
    var offset = window.scrollY + (header ? header.offsetHeight : 0) + 110;
    var current = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= offset) current = sections[i];
    }
    /* At the very bottom, always land on the last section. */
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
      current = sections[sections.length - 1];
    }
    links.forEach(function (link) {
      link.classList.toggle(
        "is-active",
        current !== null && link.hash === "#" + current.id
      );
    });
  }

  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        onScroll();
        spy();
        ticking = false;
      });
    },
    { passive: true }
  );

  onScroll();
  spy();
})();
