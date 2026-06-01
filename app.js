/**
 * La Viguerie — app.js
 * ════════════════════════════════════
 * 1. Statut temps réel (horaires réels)
 * 2. Navigation sticky + burger mobile
 * 3. Reveal au scroll
 * 4. Menu (onglets)
 * 5. Galerie (hover labels)
 */

'use strict';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ══════════════════════════════
   1. STATUT TEMPS RÉEL
   Ouvert : Lun–Dim 11h45–14h00 et 18h45–21h15
══════════════════════════════ */

// Horaires : ouvert tous les jours, service midi et soir
// Format : paires [hOuv, mOuv, hFerm, mFerm]
const SERVICES = [
  { oh: 11, om: 45, ch: 14, cm: 0,  label: 'midi' },
  { oh: 18, om: 45, ch: 21, cm: 15, label: 'soir' },
];

const JOURS = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

function getStatus() {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const day = now.getDay();

  // Vérifier si on est dans un service ouvert
  for (const svc of SERVICES) {
    const open  = svc.oh * 60 + svc.om;
    const close = svc.ch * 60 + svc.cm;
    if (cur >= open && cur < close) {
      return {
        open: true,
        msg: `Ouvert — Service du ${svc.label} jusqu'à ${svc.ch}h${String(svc.cm).padStart(2,'0')}`
      };
    }
  }

  // Prochain service aujourd'hui ou demain
  for (let off = 0; off <= 1; off++) {
    const d = (day + off) % 7;
    for (const svc of SERVICES) {
      const open = svc.oh * 60 + svc.om;
      if (off === 0 && open <= cur) continue; // passé aujourd'hui
      const lbl = off === 0
        ? `aujourd'hui à ${svc.oh}h${String(svc.om).padStart(2,'0')}`
        : `demain à ${svc.oh}h${String(svc.om).padStart(2,'0')}`;
      return { open: false, msg: `Fermé — Prochain service ${lbl}` };
    }
  }

  return { open: false, msg: 'Fermé pour le moment · 04 34 28 61 97' };
}

function updateStatus() {
  const bar = $('#status-bar');
  const txt = $('#status-text');
  if (!bar || !txt) return;
  const { open, msg } = getStatus();
  bar.className = open ? 'open' : 'closed';
  txt.textContent = msg;
}

updateStatus();
setInterval(updateStatus, 30_000);

/* ══════════════════════════════
   2. NAVIGATION
══════════════════════════════ */
const nav       = $('#nav');
const navBurger = $('#nav-burger');
const navLinks  = $('#nav-links');

// Sticky au scroll
window.addEventListener('scroll', () => {
  nav.classList.toggle('sticky', window.scrollY > 80);
}, { passive: true });

// Burger
navBurger?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navBurger.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';

  const bars = $$('span', navBurger);
  if (isOpen) {
    bars[0].style.transform = 'translateY(6.5px) rotate(45deg)';
    bars[1].style.opacity   = '0';
    bars[2].style.transform = 'translateY(-6.5px) rotate(-45deg)';
  } else {
    bars.forEach(b => { b.style.transform = ''; b.style.opacity = ''; });
  }
});

// Fermer le menu mobile au clic sur un lien
$$('a', navLinks).forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navBurger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    $$('span', navBurger).forEach(b => { b.style.transform = ''; b.style.opacity = ''; });
  });
});

/* ══════════════════════════════
   3. REVEAL AU SCROLL
══════════════════════════════ */
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('vis');
      revObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

$$('.reveal').forEach(el => revObs.observe(el));

// Révéler immédiatement les éléments déjà visibles au chargement
document.addEventListener('DOMContentLoaded', () => {
  $$('.reveal').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight) el.classList.add('vis');
  });
});

/* ══════════════════════════════
   4. MENU — ONGLETS
══════════════════════════════ */
const mtabs   = $$('.mtab');
const mpanels = $$('.menu-panel');

mtabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const cat = tab.dataset.cat;

    mtabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    mpanels.forEach(p => p.classList.remove('active'));
    $(`#mp-${cat}`)?.classList.add('active');
  });
});

/* ══════════════════════════════
   5. SMOOTH SCROLL pour les CTA
══════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = $(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
