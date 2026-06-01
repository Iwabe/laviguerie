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
const LOCAL_STORAGE_HOURS_KEY = 'laviguerie_horaires';

function getSavedServices() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_HOURS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Erreur chargement horaires localStorage', e);
  }
  return [
    { oh: 11, om: 45, ch: 14, cm: 0,  label: 'midi' },
    { oh: 18, om: 45, ch: 21, cm: 15, label: 'soir' },
  ];
}

const JOURS = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

function getStatus() {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const day = now.getDay();
  const servicesList = getSavedServices();

  // Vérifier si on est dans un service ouvert
  for (const svc of servicesList) {
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
    for (const svc of servicesList) {
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

/* ══════════════════════════════
   6. LAISSER DES AVIS CLIENTS
   ══════════════════════════════ */
const btnToggleAvis = $('#btn-toggle-avis');
const formAvisContainer = $('#form-avis-container');
const formAvis = $('#form-avis');
const stars = $$('.star-rating .star');
const noteInput = $('#avis-note');
const reviewsGrid = $('.avis-grid');

// 1. Ouvrir / fermer le formulaire
btnToggleAvis?.addEventListener('click', () => {
  const isClosed = formAvisContainer.style.maxHeight === '0px' || !formAvisContainer.style.maxHeight;
  if (isClosed) {
    formAvisContainer.style.maxHeight = '600px';
    btnToggleAvis.textContent = 'Fermer le formulaire';
  } else {
    formAvisContainer.style.maxHeight = '0px';
    btnToggleAvis.textContent = 'Laisser un avis client';
  }
});

// 2. Gestion des étoiles
function highlightStars(val) {
  stars.forEach(s => {
    const sVal = parseInt(s.dataset.value);
    s.classList.toggle('active', sVal <= val);
  });
}

// Par défaut, note à 5
highlightStars(5);
noteInput.value = "5";

stars.forEach(star => {
  // Survol
  star.addEventListener('mouseenter', () => {
    const val = parseInt(star.dataset.value);
    highlightStars(val);
  });

  // Sortie du survol (remet la note choisie)
  star.addEventListener('mouseleave', () => {
    const currentNote = parseInt(noteInput.value) || 5;
    highlightStars(currentNote);
  });

  // Clic
  star.addEventListener('click', () => {
    const val = parseInt(star.dataset.value);
    noteInput.value = val;
    highlightStars(val);
  });
});

// 3. Soumission, Réponses Administrateur et Modération des Avis
const LOCAL_STORAGE_KEY = 'laviguerie_avis';
const LOCAL_STORAGE_REPLIES_KEY = 'laviguerie_reponses';
const LOCAL_STORAGE_DELETED_KEY = 'laviguerie_supprimes';

function getReplies() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_REPLIES_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}

function getDeletedList() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_DELETED_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function renderAdminReplyHTML(replyText) {
  return `
    <div class="admin-reply" style="margin-top: 1rem; padding: 1rem; background: rgba(251,248,242,0.03); border-left: 2px solid var(--terracotta-l); border-radius: 4px; font-size: 0.85rem; line-height: 1.5; color: var(--cream);">
      <strong style="color: var(--terracotta-l); display: block; margin-bottom: 0.25rem; font-family: var(--sans); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em;">Réponse du propriétaire</strong>
      "${replyText}"
    </div>
  `;
}

function renderReviewCard(review) {
  const article = document.createElement('article');
  article.className = 'avis-card reveal vis';
  article.setAttribute('data-id', review.id || `user-${Date.now()}`);
  article.style.animation = 'fadeUp 0.5s ease forwards';
  
  const starsHtml = '★'.repeat(review.note) + '☆'.repeat(5 - review.note);
  const initials = review.nom.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  // Vérifier s'il y a une réponse admin pour cet avis
  const replies = getReplies();
  const replyText = replies[review.id];
  const replyHtml = replyText ? renderAdminReplyHTML(replyText) : '';

  article.innerHTML = `
    <div class="source-ta">⭐ Site officiel</div>
    <div class="avis-stars">${starsHtml}</div>
    <p class="avis-text">"${review.message}"</p>
    <div class="avis-author">
      <div class="avis-av">${initials || 'A'}</div>
      <div>
        <div class="avis-name">${review.nom}</div>
        <div class="avis-detail">${review.ville} · ${review.date}</div>
      </div>
    </div>
    ${replyHtml}
  `;
  return article;
}

// Assigner des IDs aux avis statiques du HTML au démarrage
function initStaticReviews() {
  const staticCards = $$('.avis-grid .avis-card');
  staticCards.forEach((card, index) => {
    const reviewId = `static-${index + 1}`;
    card.setAttribute('data-id', reviewId);
    
    // Si la carte est dans la liste des supprimées, on la cache
    if (getDeletedList().includes(reviewId)) {
      card.style.display = 'none';
      card.classList.remove('reveal');
    }

    // Si la carte a une réponse du propriétaire
    const replyText = getReplies()[reviewId];
    if (replyText) {
      // Supprimer l'ancienne réponse si elle existe
      card.querySelector('.admin-reply')?.remove();
      card.insertAdjacentHTML('beforeend', renderAdminReplyHTML(replyText));
    }
  });
}

// Charger les avis du localStorage au démarrage
function loadReviews() {
  initStaticReviews();
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const reviews = JSON.parse(saved);
      const deletedList = getDeletedList();
      reviews.forEach(review => {
        if (!deletedList.includes(review.id)) {
          const card = renderReviewCard(review);
          reviewsGrid?.prepend(card);
        }
      });
    }
  } catch (e) {
    console.error('Erreur chargement localStorage', e);
  }
}

// Soumission du formulaire avis client
formAvis?.addEventListener('submit', e => {
  e.preventDefault();

  const nom = $('#avis-nom').value.trim();
  const ville = $('#avis-ville').value.trim();
  const note = parseInt(noteInput.value) || 5;
  const message = $('#avis-message').value.trim();
  const reviewId = `user-${Date.now()}`;
  
  // Date format : "Juin 2026"
  const dateOptions = { month: 'long', year: 'numeric' };
  const formattedDate = new Date().toLocaleDateString('fr-FR', dateOptions);
  const dateStr = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const newReview = { id: reviewId, nom, ville, note, message, date: dateStr };

  // 1. Ajouter visuellement au site
  const card = renderReviewCard(newReview);
  reviewsGrid?.prepend(card);

  // 2. Enregistrer dans le localStorage
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list = saved ? JSON.parse(saved) : [];
    list.unshift(newReview);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Erreur sauvegarde localStorage', err);
  }

  // 3. Message de succès & reset
  alert('Merci ! Votre avis a bien été publié directement sur le site.');
  formAvis.reset();
  noteInput.value = "5";
  highlightStars(5);
  formAvisContainer.style.maxHeight = '0px';
  if (btnToggleAvis) btnToggleAvis.textContent = 'Laisser un avis client';
  
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

/* ══════════════════════════════
   7. PANNEAU DE CONTRÔLE ADMIN
   ══════════════════════════════ */
const linkAdminPanel = $('#link-admin-panel');
const adminModal = $('#admin-modal');
const adminClose = $('#admin-close');
const adminLoginForm = $('#admin-login-form');
const adminPassword = $('#admin-password');
const adminLoginError = $('#admin-login-error');
const adminLoginPage = $('#admin-login-page');
const adminDashboard = $('#admin-dashboard');

// Ouvrir le pannel
linkAdminPanel?.addEventListener('click', e => {
  e.preventDefault();
  adminModal.style.display = 'block';
  document.body.style.overflow = 'hidden';
});

// Fermer le pannel
adminClose?.addEventListener('click', () => {
  adminModal.style.display = 'none';
  document.body.style.overflow = '';
  // Reset connexion
  adminPassword.value = '';
  adminLoginError.style.display = 'none';
  adminLoginPage.style.display = 'block';
  adminDashboard.style.display = 'none';
});

// Connexion simple
adminLoginForm?.addEventListener('submit', e => {
  e.preventDefault();
  if (adminPassword.value === 'admin') {
    adminLoginPage.style.display = 'none';
    adminDashboard.style.display = 'block';
    loadAdminReviews();
    loadAdminHoraires();
    loadAdminAnnonce();
  } else {
    adminLoginError.style.display = 'block';
  }
});

// Onglets Dashboard
const adminTabBtns = $$('.admin-tab-btn');
const adminTabContents = $$('.admin-tab-content');

adminTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    adminTabBtns.forEach(b => {
      b.classList.remove('active');
      b.style.background = 'rgba(251,248,242,0.05)';
      b.style.borderColor = 'rgba(251,248,242,0.1)';
    });
    btn.classList.add('active');
    btn.style.borderColor = 'var(--terracotta-l)';
    
    const targetTab = btn.dataset.tab;
    adminTabContents.forEach(content => {
      content.style.display = content.id === targetTab ? 'block' : 'none';
    });
  });
});

// A. GESTION DES AVIS (Admin)
function loadAdminReviews() {
  const listContainer = $('#admin-reviews-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  // 1. Lire tous les avis présents
  // Lire les avis statiques du DOM
  const staticReviews = [
    { id: 'static-1', nom: 'Marie-Laure G.', message: "Les profiteroles étaient ÉNORMES...", ville: 'Montpellier', date: 'Mai 2026', note: 5 },
    { id: 'static-2', nom: 'Thomas P.', message: "La pizza crème-miel-noix...", ville: 'Paris', date: 'Avril 2026', note: 5 },
    { id: 'static-3', nom: 'Christine F.', message: "Repas en famille avec 3 générations...", ville: 'Lyon', date: 'Août 2025', note: 5 },
    { id: 'static-4', nom: 'Jean-René M.', message: "Belle découverte lors de notre séjour...", ville: 'Bordeaux', date: 'Juillet 2025', note: 4 },
    { id: 'static-5', nom: 'Sophie C.', message: "Accueil chaleureux, cuisine généreuse...", ville: 'Nîmes', date: 'Mars 2026', note: 5 },
    { id: 'static-6', nom: 'Antoine B.', message: "On revient chaque été depuis 4 ans...", ville: 'Toulouse', date: 'Été 2025', note: 5 }
  ];

  // Lire les avis utilisateurs sauvés
  let userReviews = [];
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) userReviews = JSON.parse(saved);
  } catch (err) {}

  const allReviews = [...userReviews, ...staticReviews];
  const deletedList = getDeletedList();
  const replies = getReplies();

  // Filtrer les supprimés
  const activeReviews = allReviews.filter(r => !deletedList.includes(r.id));

  if (activeReviews.length === 0) {
    listContainer.innerHTML = '<p style="color:var(--stone-l);font-size:0.85rem;text-align:center;">Aucun avis à modérer.</p>';
    return;
  }

  activeReviews.forEach(r => {
    const div = document.createElement('div');
    div.style.background = 'rgba(255,255,255,0.02)';
    div.style.padding = '1.25rem';
    div.style.border = '1px solid rgba(255,255,255,0.06)';
    div.style.borderRadius = 'var(--radius)';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.gap = '0.75rem';

    const starsHtml = '★'.repeat(r.note) + '☆'.repeat(5 - r.note);
    const replyText = replies[r.id] || '';

    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong style="color:var(--cream); font-size:0.9rem;">${r.nom} <span style="font-size:0.75rem; color:var(--stone-l); font-weight:400;">(${r.ville})</span></strong>
        <span style="color:#ffd700; font-size:0.85rem;">${starsHtml}</span>
      </div>
      <p style="color:rgba(251,248,242,0.7); font-size:0.82rem; font-style:italic; line-height:1.5; margin:0;">"${r.message}"</p>
      
      <!-- Zone réponse propriétaire -->
      <div id="reply-box-${r.id}" style="margin-top:0.4rem;">
        ${replyText ? `
          <div style="background:rgba(155,21,21,0.08); border-left:2px solid var(--terracotta-l); padding:0.6rem 0.8rem; font-size:0.8rem; border-radius:3px; color:var(--cream);">
            <strong>Propriétaire :</strong> "${replyText}"
            <button onclick="deleteReply('${r.id}')" style="background:none; border:none; color:var(--terracotta-l); cursor:pointer; font-size:0.72rem; margin-left:10px; text-decoration:underline;">Supprimer</button>
          </div>
        ` : `
          <button onclick="showReplyForm('${r.id}')" class="btn btn-outline" style="font-size:0.72rem; padding:0.4rem 1rem; border-radius:3px; border-color:var(--stone-l); color:var(--stone-l);">Répondre</button>
        `}
      </div>

      <div style="text-align:right;">
        <button onclick="deleteReview('${r.id}')" style="background:none; border:none; color:var(--terracotta-l); cursor:pointer; font-size:0.75rem; font-weight:500; text-decoration:underline;">Supprimer cet avis</button>
      </div>
    `;
    listContainer.appendChild(div);
  });
}

// Rendre ces fonctions globales pour l'attribut onclick
window.deleteReview = function(id) {
  if (confirm('Voulez-vous vraiment supprimer cet avis du site ?')) {
    const list = getDeletedList();
    list.push(id);
    localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(list));
    
    // Supprimer visuellement du site
    $(`.avis-grid .avis-card[data-id="${id}"]`)?.remove();
    loadAdminReviews();
  }
};

window.showReplyForm = function(id) {
  const box = $(`#reply-box-${id}`);
  if (!box) return;
  box.innerHTML = `
    <textarea id="reply-text-${id}" placeholder="Tapez votre réponse..." rows="3" style="width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.15); border-radius:var(--radius); padding:0.5rem; color:var(--cream); font-size:0.8rem; resize:vertical; margin-bottom:0.5rem;"></textarea>
    <div style="display:flex; gap:0.5rem;">
      <button onclick="saveReply('${id}')" class="btn btn-primary" style="font-size:0.72rem; padding:0.4rem 1rem; border-radius:3px;">Publier</button>
      <button onclick="loadAdminReviews()" class="btn btn-outline" style="font-size:0.72rem; padding:0.4rem 1rem; border-radius:3px; border-color:var(--stone-l); color:var(--stone-l);">Annuler</button>
    </div>
  `;
};

window.saveReply = function(id) {
  const text = $(`#reply-text-${id}`).value.trim();
  if (!text) return;
  
  const replies = getReplies();
  replies[id] = text;
  localStorage.setItem(LOCAL_STORAGE_REPLIES_KEY, JSON.stringify(replies));
  
  // Mettre à jour la carte sur le site directement
  const siteCard = $(`.avis-grid .avis-card[data-id="${id}"]`);
  if (siteCard) {
    siteCard.querySelector('.admin-reply')?.remove();
    siteCard.insertAdjacentHTML('beforeend', renderAdminReplyHTML(text));
  }

  loadAdminReviews();
};

window.deleteReply = function(id) {
  if (confirm('Voulez-vous supprimer votre réponse ?')) {
    const replies = getReplies();
    delete replies[id];
    localStorage.setItem(LOCAL_STORAGE_REPLIES_KEY, JSON.stringify(replies));

    // Retirer de la carte sur le site
    const siteCard = $(`.avis-grid .avis-card[data-id="${id}"]`);
    siteCard?.querySelector('.admin-reply')?.remove();

    loadAdminReviews();
  }
};

// B. GESTION DES HORAIRES (Admin)
function loadAdminHoraires() {
  const services = getSavedServices();
  const midi = services.find(s => s.label === 'midi') || { oh:11, om:45, ch:14, cm:0 };
  const soir = services.find(s => s.label === 'soir') || { oh:18, om:45, ch:21, cm:15 };

  $('#h-midi-o').value = midi.oh;
  $('#m-midi-o').value = midi.om;
  $('#h-midi-f').value = midi.ch;
  $('#m-midi-f').value = midi.cm;

  $('#h-soir-o').value = soir.oh;
  $('#m-soir-o').value = soir.om;
  $('#h-soir-f').value = soir.ch;
  $('#m-soir-f').value = soir.cm;
}

$('#admin-horaires-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const newServices = [
    {
      oh: parseInt($('#h-midi-o').value),
      om: parseInt($('#m-midi-o').value),
      ch: parseInt($('#h-midi-f').value),
      cm: parseInt($('#m-midi-f').value),
      label: 'midi'
    },
    {
      oh: parseInt($('#h-soir-o').value),
      om: parseInt($('#m-soir-o').value),
      ch: parseInt($('#h-soir-f').value),
      cm: parseInt($('#m-soir-f').value),
      label: 'soir'
    }
  ];

  localStorage.setItem(LOCAL_STORAGE_HOURS_KEY, JSON.stringify(newServices));
  updateStatus(); // Rafraîchir immédiatement le bandeau d'ouverture !
  alert('Horaires enregistrés et mis à jour sur tout le site !');
});

// C. GESTION DES ANNONCES (Admin)
const ANNONCE_KEY = 'laviguerie_annonce';

function loadAdminAnnonce() {
  try {
    const saved = localStorage.getItem(ANNONCE_KEY);
    if (saved) {
      const { active, texte } = JSON.parse(saved);
      $('#annonce-active').checked = active;
      $('#annonce-texte').value = texte || '';
    }
  } catch (err) {}
}

function updateAnnouncementBanner() {
  const banner = $('#announcement-banner');
  const nav = $('#nav');
  if (!banner || !nav) return;

  try {
    const saved = localStorage.getItem(ANNONCE_KEY);
    if (saved) {
      const { active, texte } = JSON.parse(saved);
      if (active && texte) {
        $('#announcement-text').textContent = texte;
        banner.style.display = 'block';
        nav.style.top = '64px'; // Déplace la nav vers le bas
        return;
      }
    }
  } catch (err) {}
  
  banner.style.display = 'none';
  nav.style.top = '28px'; // Position par défaut
}

$('#admin-annonce-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const active = $('#annonce-active').checked;
  const texte = $('#annonce-texte').value.trim();

  localStorage.setItem(ANNONCE_KEY, JSON.stringify({ active, texte }));
  updateAnnouncementBanner(); // Mettre à jour immédiatement sur le site !
  alert("L'annonce a bien été mise à jour !");
});

// Charger au chargement initial
document.addEventListener('DOMContentLoaded', () => {
  loadReviews();
  updateAnnouncementBanner();
});
