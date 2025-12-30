document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const navbarMenu = document.getElementById("navbarMenu");

  if (!hamburger || !navbarMenu) return;

  hamburger.addEventListener("click", () => {
    navbarMenu.classList.toggle("show");
    hamburger.classList.toggle("open");
  });
});
