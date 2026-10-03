// Code partage par toutes les pages : catalogue, menu, helpers, appel a l'agent.
// Lignes du reseau DDD : donnees reelles de lignes.json (n, cat, trajet "A ↔ B", t8, t18, verif).
// Les durees t8 / t18 sont des temps voiture releves, jamais des temps en bus.
let _lignes = null;
function chargerLignes(){
  if(!_lignes) _lignes = fetch("/lignes.json").then(r => { if(!r.ok) throw new Error("lignes"); return r.json(); }).then(liste => {
    liste.forEach(l => {
      const [dep, arr] = l.trajet.split(" ↔ ");
      l.depart = dep; l.arrivee = arr || "";
      l.nom = (/^\d/.test(l.n) ? "Ligne " : "") + l.n;
      l.question = "Ligne " + l.n + ", " + l.trajet.replace(" ↔ ", " vers ");
      l.temps = l.t8 ? "8h : " + l.t8 + " · 18h : " + l.t18 + " (voiture)" : "Temps non relevé";
    });
    return liste;
  }).catch(e => { _lignes = null; throw e; });
  return _lignes;
}
const CATEGORIES = [
  ["urbain", "Lignes urbaines"], ["banlieue", "Lignes de banlieue"],
  ["TAF TAF", "Express TAF TAF (aéroport)"], ["TER", "Rabattement TER"],
];
const SUGGESTIONS = ['Ligne 8 à 8h, y a-t-il du monde ?', 'Ligne 18 à 17h30 ?', 'Ligne 7, Ouakam vers Palais 2 ?'];

const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Le mot-cle doit apparaitre comme mot entier ("port" ne correspond pas a "aeroport").
function contient(texte, motCle){
  const t = ' ' + norm(texte).replace(/[^a-z0-9]+/g, ' ') + ' ';
  return t.includes(' ' + norm(motCle).replace(/[^a-z0-9]+/g, ' ').trim() + ' ');
}
function el(tag, props, ...kids){
  const e = document.createElement(tag);
  Object.assign(e, props || {});
  kids.flat().forEach(k => e.append(k));
  return e;
}
const hhmm = d => d.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
const lienAgent = q => '/agent?q=' + encodeURIComponent(q);

// ---------- Pastilles de ligne ----------
const CAT_NOM = {urbain:'Ligne urbaine', banlieue:'Ligne de banlieue', taf:'Express TAF TAF', ter:'Rabattement TER', autre:'Ligne'};
function catCle(cat){
  const c = String(cat || '').toLowerCase();
  return c.startsWith('urbain') ? 'urbain' : c.startsWith('banlieue') ? 'banlieue' : c.startsWith('taf') ? 'taf' : c.startsWith('ter') ? 'ter' : 'autre';
}
// "Ligne" + pastille de couleur ; la categorie est aussi donnee en texte (title), pas seulement par la couleur.
function titreLigne(l){
  const k = catCle(l.cat);
  const t = el('span', {className:'tl'});
  if(/^\d/.test(l.n)) t.append('Ligne');
  t.append(el('span', {className:'bl bl-' + k, title:CAT_NOM[k], textContent:l.n}));
  return t;
}

// ---------- Theme clair / sombre ----------
function appliquerTheme(t){ if(t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
try { appliquerTheme(localStorage.getItem('uf-theme')); } catch(e) {}
function themeActuel(){
  return document.documentElement.getAttribute('data-theme')
    || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
}

// ---------- Barre de navigation et pied de page ----------
const PAGES = [['/', 'Accueil'], ['/trajet', 'Trajet'], ['/agent', 'Agent IA'], ['/lignes', 'Lignes'], ['/a-propos', 'À propos']];
(function(){
  const chemin = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/(.)\/$/, '$1');

  const liens = el('nav', {id:'menu-liens', className:'nav-liens', 'aria-label':'Navigation principale'});
  PAGES.forEach(([href, nom]) => {
    const a = el('a', {href, textContent:nom});
    if(href === chemin) a.setAttribute('aria-current', 'page');
    liens.append(a);
  });

  const theme = el('button', {type:'button', className:'theme-btn', textContent:themeActuel() === 'light' ? 'Thème sombre' : 'Thème clair'});
  theme.setAttribute('aria-label', 'Basculer entre le thème clair et le thème sombre');
  theme.addEventListener('click', () => {
    const suivant = themeActuel() === 'light' ? 'dark' : 'light';
    appliquerTheme(suivant);
    try { localStorage.setItem('uf-theme', suivant); } catch(e) {}
    theme.textContent = suivant === 'light' ? 'Thème sombre' : 'Thème clair';
  });

  const cta = el('a', {className:'btn btn-main nav-cta', href:'/trajet', textContent:'Calculer mon trajet'});
  const toggle = el('button', {type:'button', className:'nav-toggle', textContent:'Menu'});
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'menu-liens');
  toggle.addEventListener('click', () => {
    const ouvert = liens.classList.toggle('ouvert');
    toggle.setAttribute('aria-expanded', String(ouvert));
    toggle.textContent = ouvert ? 'Fermer' : 'Menu';
  });

  const droite = el('div', {className:'nav-droite'}, toggle, liens, el('div', {className:'nav-actions'}, theme, cta));
  const h = document.getElementById('menu');
  if(h) h.replaceWith(droite);

  // Pied de page en colonnes : projet independant, source officielle et contact de DDD.
  const col = (titre, ...contenu) => el('div', {className:'pied-col'}, el('h2', {textContent:titre}), ...contenu);
  const lien = (href, texte, externe) => { const a = el('a', {href, textContent:texte}); if(externe){ a.target = '_blank'; a.rel = 'noopener'; } return a; };
  document.body.append(el('footer', {className:'pied'},
    el('div', {className:'pied-in'},
      col('UrbanFlow', el('p', {textContent:"Estimez la durée réelle de votre trajet à Dakar et trouvez les lignes Dakar Dem Dikk qui vous concernent."})),
      col('Navigation', ...PAGES.map(([href, nom]) => lien(href, nom))),
      col('Source officielle', lien('https://demdikk.sn/', 'demdikk.sn', true), lien('https://demdikk.sn/info-voyageurs', 'Info voyageurs de DDD', true)),
      col('Contact DDD', el('p', {textContent:'Interurbain : +221 33 824 10 10'}), el('p', {textContent:'Express AIBD : +221 78 184 58 23'}))),
    el('div', {className:'pied-bas'},
      el('p', {textContent:"UrbanFlow est un projet étudiant indépendant (GET409, UMEF Swiss University, Dakar), non affilié à Dakar Dem Dikk. Aucune donnée de bus en temps réel n'existe : les temps affichés sont des temps voiture."}))));
})();

// ---------- Agent ----------
const TITRES = ['FICHE TRAJET', 'TEMPS DE TRAJET', 'ANALYSE', 'ALERTES', 'RECOMMANDATIONS'];

function decouper(texte){
  const sections = []; let cur = null;
  texte.split('\n').forEach(l => {
    const t = l.trim().replace(/[:*#]/g, '').trim().toUpperCase();
    if(TITRES.includes(t)){ cur = {titre:t, lignes:[]}; sections.push(cur); }
    else if(cur){ cur.lignes.push(l); }
  });
  return sections.map(s => ({titre:s.titre, texte:s.lignes.join('\n').trim()})).filter(s => s.texte);
}

function afficherErreur(zone, msg, aide){
  zone.replaceChildren(el('div', {className:'msg-erreur', role:'alert'}, msg, aide ? el('p', {className:'note', textContent:aide}) : ''));
}

function afficherFiche(zone, texte){
  if(/^\s*INSUFFISANT/i.test(texte)){
    const raison = texte.replace(/^\s*INSUFFISANT\s*:?\s*/i, '');
    afficherErreur(zone, "L'agent n'a pas assez de données pour répondre : " + raison,
      "Essayez une autre ligne, ou consultez la liste des lignes.");
    return;
  }
  const sections = decouper(texte);
  if(!sections.length){ zone.replaceChildren(el('div', {className:'fiche'}, el('div', {className:'bloc'}, el('p', {textContent:texte})))); return; }
  const fiche = el('div', {className:'fiche'});
  sections.forEach(s => {
    const cls = 'bloc' + (s.titre === 'TEMPS DE TRAJET' ? ' temps' : s.titre === 'ALERTES' ? ' alertes' : '');
    const p = el('p');
    if(s.titre === 'TEMPS DE TRAJET'){
      const [premiere, ...reste] = s.texte.split('\n');
      p.append(premiere);
      if(reste.join('').trim()) p.append(el('small', {textContent:reste.join(' ').trim()}));
    } else { p.textContent = s.texte; }
    fiche.append(el('div', {className:cls}, el('h4', {textContent:s.titre.charAt(0) + s.titre.slice(1).toLowerCase()}), p));
  });
  zone.replaceChildren(fiche);
}

let minuteur = null;
// Interroge l'agent Dify et affiche la fiche dans `zone`. `bouton` est desactive pendant l'attente.
async function interrogerAgent(question, donneesTrafic, zone, bouton){
  question = String(question || '').trim();
  if(!question) return;
  if(bouton) bouton.disabled = true;
  const t0 = Date.now();
  const lib = el('span', {textContent:"L'agent consulte le catalogue (environ 20 secondes)..."});
  zone.replaceChildren(el('div', {className:'attente'}, el('div', {className:'spin', 'aria-hidden':'true'}), lib));
  clearInterval(minuteur);
  minuteur = setInterval(() => { lib.textContent = "L'agent consulte le catalogue... " + Math.round((Date.now()-t0)/1000) + ' s'; }, 1000);
  try{
    const res = await fetch('/api/analyser-trafic', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ query:question, donneesTrafic:donneesTrafic || '' }),
    });
    const data = await res.json();
    if(!res.ok) afficherErreur(zone, data.error || 'Service temporairement indisponible.', 'Réessayez dans un instant.');
    else afficherFiche(zone, typeof data.outputs === 'string' ? data.outputs : JSON.stringify(data.outputs, null, 2));
  } catch(err){
    afficherErreur(zone, 'Service temporairement indisponible.', 'Vérifiez votre connexion et réessayez.');
  } finally {
    clearInterval(minuteur);
    if(bouton) bouton.disabled = false;
  }
}
