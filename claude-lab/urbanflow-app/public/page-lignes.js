// Script de la page /lignes (sorti du HTML pour la Content-Security-Policy : aucun script inline).
chargerLignes().then(liste => {
  const zone = document.getElementById('groupes');
  zone.replaceChildren();
  CATEGORIES.forEach(([cle, titre]) => {
    const lignes = liste.filter(l => l.cat.startsWith(cle));
    if(!lignes.length) return;
    zone.append(el('h3', {textContent:titre + ' (' + lignes.length + ')', style:'margin:20px 0 10px; font-size:17px'}));
    const grille = el('div', {className:'lignes'});
    lignes.forEach(l => grille.append(el('a', {className:'lg', href:lienAgent(l.question + ' ?')},
      titreLigne(l),
      el('span', {className:'cat', textContent:CAT_NOM[catCle(l.cat)]}),
      el('span', {textContent:l.trajet}),
      l.verif ? el('span', {textContent:'Trajet à vérifier'}) : '')));
    zone.append(grille);
  });
}).catch(() => { document.getElementById('groupes').replaceChildren(el('p', {className:'msg-erreur', role:'alert', textContent:'Liste des lignes indisponible. Réessayez dans un instant.'})); });
