// Code partage par toutes les pages : catalogue, menu, helpers, appel a l'agent.
// Lignes du reseau DDD : donnees reelles de lignes.json (n, cat, trajet "A ↔ B", verif).
// Aucun temps de trajet par ligne : le temps est calcule en direct par TomTom.
let _lignes = null;
function chargerLignes(){
  if(!_lignes) _lignes = fetch("/lignes.json").then(r => { if(!r.ok) throw new Error("lignes"); return r.json(); }).then(liste => {
    liste.forEach(l => {
      const [dep, arr] = l.trajet.split(" ↔ ");
      l.depart = dep; l.arrivee = arr || "";
      l.nom = (/^\d/.test(l.n) ? "Ligne " : "") + l.n;
      l.question = "Ligne " + l.n + ", " + l.trajet.replace(" ↔ ", " vers ");
    });
    // Les lignes de rabattement TER ne sont pas affichees sur le site.
    return liste.filter(l => !String(l.cat).toLowerCase().startsWith("ter"));
  }).catch(e => { _lignes = null; throw e; });
  return _lignes;
}
const CATEGORIES = [
  ["urbain", "Lignes urbaines"], ["banlieue", "Lignes de banlieue"],
  ["TAF TAF", "Express TAF TAF (aéroport)"],
];
const SUGGESTIONS = ['Temps ligne 8', 'Arrêts de la ligne 18', 'Ouakam vers Plateau'];

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

  // Bouton de theme a icone : lune en theme clair (passer au sombre), soleil en theme sombre (passer au clair).
  const SOLEIL = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const LUNE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  const theme = el('button', {type:'button', className:'theme-btn'});
  const majTheme = () => {
    const clair = themeActuel() === 'light';
    theme.innerHTML = clair ? LUNE : SOLEIL;
    const libelle = clair ? 'Passer au thème sombre' : 'Passer au thème clair';
    theme.setAttribute('aria-label', libelle);
    theme.title = libelle;
  };
  majTheme();
  theme.addEventListener('click', () => {
    const suivant = themeActuel() === 'light' ? 'dark' : 'light';
    appliquerTheme(suivant);
    try { localStorage.setItem('uf-theme', suivant); } catch(e) {}
    majTheme();
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

  const droite = el('div', {className:'nav-droite'}, toggle, liens, el('div', {className:'nav-actions'}, theme, chemin === '/' ? '' : cta));
  const h = document.getElementById('menu');
  if(h) h.replaceWith(droite);

  // Pied de page en colonnes : presentation, navigation et source officielle.
  const col = (titre, ...contenu) => el('div', {className:'pied-col'}, el('h2', {textContent:titre}), ...contenu);
  const lien = (href, texte, externe) => { const a = el('a', {href, textContent:texte}); if(externe){ a.target = '_blank'; a.rel = 'noopener'; } return a; };
  document.body.append(el('footer', {className:'pied'},
    el('div', {className:'pied-in'},
      col('UrbanFlow', el('p', {textContent:"Estimez la durée réelle de votre trajet à Dakar et trouvez les lignes Dakar Dem Dikk qui vous concernent."})),
      col('Navigation', ...PAGES.map(([href, nom]) => lien(href, nom))),
      col('Source officielle', lien('https://demdikk.sn/', 'demdikk.sn', true), lien('https://demdikk.sn/info-voyageurs', 'Info voyageurs de DDD', true))),
    el('div', {className:'pied-bas'},
      el('p', {textContent:"Aucune donnée de bus en temps réel n'existe : le temps affiché est celui d'une voiture avec le trafic actuel (TomTom)."}))));
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

// Reponse sans les 5 titres (guide reseau, temps TomTom) : un bloc par paragraphe,
// titre en capitales repris en en-tete, paragraphe « Limites » en note discrete.
function ficheSimple(texte){
  const fiche = el('div', {className:'fiche'});
  String(texte).split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).forEach(b => {
    const lignes = b.split('\n');
    const m = lignes[0].match(/^([A-ZÀ-ÖØ-Þ' ]{6,}?)\s*(?::\s*(.*))?$/);
    if(m){
      const titre = m[1].trim();
      const t = titre.charAt(0) + titre.slice(1).toLowerCase() + (m[2] ? ' : ' + m[2] : '');
      if(lignes.length === 1) fiche.append(el('h3', {className:'fiche-titre', textContent:t}));
      else fiche.append(el('div', {className:'bloc'}, el('h4', {textContent:t}), el('p', {textContent:lignes.slice(1).join('\n')})));
    } else if(/^Limites\s*:/.test(b)) fiche.append(el('p', {className:'note', textContent:b}));
    else fiche.append(el('div', {className:'bloc'}, el('p', {textContent:b})));
  });
  return fiche;
}

function afficherFiche(zone, texte){
  if(/^\s*INSUFFISANT/i.test(texte)){
    const raison = texte.replace(/^\s*INSUFFISANT\s*:?\s*/i, '');
    afficherErreur(zone, "L'agent n'a pas assez de données pour répondre : " + raison,
      "Essayez une autre ligne, ou consultez la liste des lignes.");
    return;
  }
  const sections = decouper(texte);
  if(!sections.length){ zone.replaceChildren(ficheSimple(texte)); return; }
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
    if(res.ok && data.source === 'secours') zone.append(el('p', {className:'note', textContent:"Réponse du modèle de secours (Gemini) : l'agent principal est indisponible. Elle s'appuie seulement sur les données du réseau."}));
  } catch(err){
    afficherErreur(zone, 'Service temporairement indisponible.', 'Vérifiez votre connexion et réessayez.');
  } finally {
    clearInterval(minuteur);
    if(bouton) bouton.disabled = false;
  }
}
