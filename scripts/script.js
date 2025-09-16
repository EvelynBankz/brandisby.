// Small interaction helpers for initial MVP
document.addEventListener('DOMContentLoaded', function(){
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  toggle && toggle.addEventListener('click', ()=> nav.classList.toggle('show'));
});
