// Script de la page / (sorti du HTML pour la Content-Security-Policy : aucun script inline).
chargerLignes().then(liste => {
  const zone = document.getElementById('stats');
  const groupes = [['urbain', 'Lignes urbaines'], ['banlieue', 'Lignes de banlieue'], ['taf', 'Express TAF TAF']];
  zone.replaceChildren(...groupes.map(([cle, nom]) => {
    const n = liste.filter(l => catCle(l.cat) === cle).length;
    return el('div', {className:'stat'}, el('span', {className:'nb', textContent:String(n)}), el('span', {className:'lib', textContent:nom}));
  }));
}).catch(() => { document.getElementById('stats').replaceChildren(el('p', {className:'vide', textContent:'Liste des lignes indisponible pour le moment.'})); });
