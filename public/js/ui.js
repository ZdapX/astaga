document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("main > .container > *").forEach((el, i) => {
    el.style.setProperty("--reveal-delay", `${Math.min(i * 70, 280)}ms`);
  });

  document.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("focus", () => field.closest(".form-group")?.classList.add("is-focused"));
    field.addEventListener("blur", () => field.closest(".form-group")?.classList.remove("is-focused"));
  });
});
