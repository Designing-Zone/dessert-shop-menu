/* Dessert Shop — dashboard helpers */
(function () {
  "use strict";

  /* Live preview for product/hero image uploads. */
  var fileInputs = document.querySelectorAll('input[type="file"]');
  Array.prototype.forEach.call(fileInputs, function (input) {
    input.addEventListener("change", function () {
      var form = input.closest("form");
      var preview = form ? form.querySelector("#image-preview") : null;
      if (!preview) return;
      var file = input.files && input.files[0];
      if (file && file.type && file.type.indexOf("image/") === 0) {
        var url = URL.createObjectURL(file);
        preview.onload = function () {
          URL.revokeObjectURL(url);
        };
        preview.src = url;
        preview.hidden = false;
      } else {
        preview.hidden = true;
        preview.removeAttribute("src");
      }
    });
  });

  /* Success messages fade away on their own. */
  var messages = document.querySelectorAll(".db-msg.success, .db-msg.info");
  Array.prototype.forEach.call(messages, function (message) {
    setTimeout(function () {
      message.style.opacity = "0";
      setTimeout(function () {
        if (message.parentNode) message.parentNode.removeChild(message);
      }, 450);
    }, 4500);
  });
})();
