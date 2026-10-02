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

// ---------- Menu ----------
(function(){
  const PAGES = [['/', 'Trajet'], ['/agent', 'Agent IA'], ['/lignes', 'Lignes'], ['/releves', 'Relevés terrain'], ['/a-propos', 'À propos']];
  const chemin = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/(.)\/$/, '$1');
  const nav = el('nav', {'aria-label':'Navigation principale'});
  PAGES.forEach(([href, nom]) => {
    const a = el('a', {href, textContent:nom});
    if(href === chemin) a.setAttribute('aria-current', 'page');
    nav.append(a);
  });
  const h = document.getElementById('menu');
  if(h) h.replaceWith(nav);
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
      "Essayez une autre ligne du catalogue, ou ajoutez un relevé terrain dans l'onglet « Relevés terrain ».");
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
