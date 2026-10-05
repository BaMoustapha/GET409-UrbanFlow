// Script de la page /trajet (sorti du HTML pour la Content-Security-Policy : aucun script inline).
(function(){
  const DAKAR = [14.7167, -17.4677];
  // La carte est un plus : si Leaflet ne se charge pas (reseau, bloqueur), le calcul du trajet reste disponible.
  const carteOK = typeof L !== 'undefined';
  const map = carteOK ? L.map('carte').setView(DAKAR, 12) : null;
  if(carteOK) L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);
  else {
    const zoneCarte = document.getElementById('carte');
    zoneCarte.classList.add('carte-off'); zoneCarte.removeAttribute('role');
    zoneCarte.replaceChildren(el('p', {className:'vide', textContent:'Carte indisponible pour le moment. Le calcul du trajet fonctionne quand même : saisissez un départ et une arrivée.'}));
  }
  let depart = null, arrivee = null, mDep = null, mArr = null, trace = null;

  const iDep = document.getElementById('t-depart');
  const iArr = document.getElementById('t-arrivee');
  const noteLoc = document.getElementById('note-loc');
  const selQuand = document.getElementById('t-quand');
  const blocHeure = document.getElementById('bloc-heure');
  const iHeure = document.getElementById('t-heure');
  const sect = document.getElementById('sect-res');
  const resVoit = document.getElementById('res-voiture');
  const resLignes = document.getElementById('res-lignes');

  function marque(p, ancien, titre){
    if(!carteOK) return null;
    if(ancien) map.removeLayer(ancien);
    return L.marker([p.lat, p.lng]).addTo(map).bindPopup(titre);
  }
  function setDepart(p){ depart = p; mDep = marque(p, mDep, 'Départ'); iDep.value = 'Ma position'; }

  function localiser(){
    if(!navigator.geolocation){ noteLoc.textContent = 'Géolocalisation indisponible : saisissez un lieu de départ.'; return; }
    noteLoc.textContent = 'Localisation en cours...';
    navigator.geolocation.getCurrentPosition(
      pos => { setDepart({lat:pos.coords.latitude, lng:pos.coords.longitude}); if(map) map.setView([pos.coords.latitude, pos.coords.longitude], 14); noteLoc.textContent = 'Position trouvée.'; },
      () => { noteLoc.textContent = 'Position refusée ou indisponible : saisissez un lieu de départ.'; },
      {enableHighAccuracy:true, timeout:10000}
    );
  }
  document.getElementById('btn-loc').addEventListener('click', localiser);

  iDep.addEventListener('input', () => { depart = null; });
  iArr.addEventListener('input', () => { arrivee = null; });
  if(map) map.on('click', e => {
    arrivee = {lat:e.latlng.lat, lng:e.latlng.lng};
    mArr = marque(arrivee, mArr, 'Arrivée');
    iArr.value = 'Point choisi sur la carte';
  });

  selQuand.addEventListener('change', () => {
    blocHeure.hidden = selQuand.value !== 'later';
    if(!blocHeure.hidden && !iHeure.value){
      const d = new Date(Date.now() + 3600e3); d.setMinutes(0, 0, 0);
      const p = n => String(n).padStart(2, '0');
      iHeure.min = new Date(Date.now() + 6*60e3).toISOString().slice(0, 16);
      iHeure.value = d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':00';
    }
  });

  function carteVoiture(j, heureDemandee){
    const enfants = [el('h3', {textContent:'En voiture'})];
    enfants.push(el('span', {className:'gros', textContent:j.voitureMin + ' min'}));
    enfants.push(el('small', {textContent:j.distanceKm + ' km, trafic estimé par TomTom'}));
    enfants.push(el('small', {textContent:'Sans trafic : ' + j.habituelMin + ' min' + (j.retardMin > 0 ? ' · retard dû au trafic : +' + j.retardMin + ' min' : '')}));
    if(j.congestion){
      const niv = j.congestion.niveau;
      const cls = niv === 'fluide' ? 'fluide' : niv === 'dense' ? 'dense' : niv === 'très dense' ? 'tres-dense' : 'bloque';
      enfants.push(el('span', {className:'trafic trafic-' + cls, textContent:'Circulation : ' + niv}));
      if(j.congestion.ratio > 1) enfants.push(el('small', {textContent:'Le trafic multiplie le temps sans trafic par ' + String(j.congestion.ratio).replace('.', ',') + '.'}));
    }
    if(Array.isArray(j.incidents)){
      if(j.incidents.length){
        enfants.push(el('small', {}, el('b', {textContent:'Incidents routiers sur le trajet :'})));
        j.incidents.forEach(i => enfants.push(el('small', {textContent:'· ' + i.type
          + (i.description ? ' : ' + i.description : '')
          + (i.de ? ' (' + i.de + (i.vers ? ' vers ' + i.vers : '') + ')' : '')
          + (i.retardMin ? ', +' + i.retardMin + ' min' : '')})));
      } else enfants.push(el('small', {textContent:'Aucun incident routier signalé sur le trajet'}));
    }
    if(j.previsionPour) enfants.push(el('span', {className:'badge', textContent:'Prévision pour ' + new Date(j.previsionPour).toLocaleString('fr-FR', {weekday:'short', hour:'2-digit', minute:'2-digit'})}));
    else enfants.push(el('span', {className:'badge', textContent:'Trafic actuel, calculé à ' + hhmm(new Date(j.calculeA))}));
    if(heureDemandee && !j.previsionPour) enfants.push(el('small', {textContent:"L'heure choisie est hors plage (5 minutes à 7 jours) : calcul pour maintenant."}));
    resVoit.replaceChildren(...enfants);
  }

  async function carteLignes(dTxt, aTxt){
    const enfants = [el("h3", {textContent:"Lignes DDD possibles"})];
    let liste;
    try { liste = await chargerLignes(); } catch(e) {
      resLignes.replaceChildren(...enfants, el("p", {className:"vide", textContent:"Liste des lignes indisponible."})); return;
    }
    // Une ligne est proposee si un de ses terminus correspond au lieu de depart ou d'arrivee saisi ; celles qui correspondent aux deux d'abord.
    const sur = (l, txt) => contient(txt, l.depart) || (l.arrivee && contient(txt, l.arrivee));
    const trouvees = liste.map(l => ({l, nb:(sur(l, dTxt) ? 1 : 0) + (sur(l, aTxt) ? 1 : 0)}))
      .filter(x => x.nb > 0).sort((x, y) => y.nb - x.nb).slice(0, 4).map(x => x.l);
    if(!trouvees.length){
      enfants.push(el("p", {className:"vide"}, "Aucune ligne du réseau n'a un terminus correspondant à ces lieux. Consultez la ", el("a", {href:"/lignes", textContent:"liste des lignes"}), " ou interrogez l'agent."));
    } else {
      trouvees.forEach(l => {
        const h = selQuand.value === "later" && iHeure.value ? " à " + hhmm(new Date(iHeure.value)) : "";
        enfants.push(el("div", {className:"ligne-prop"},
          el("div", {}, titreLigne(l), el("span", {textContent:l.trajet})),
          el("a", {className:"btn btn-sec", href:lienAgent(l.question + h + " ?"), textContent:"Durée et circulation"})));
      });
      enfants.push(el("small", {textContent:"Lignes dont un terminus correspond à vos lieux. Aucun temps en bus n'est affiché : il n'est pas publié."}));
    }
    resLignes.replaceChildren(...enfants);
  }

  document.getElementById('form-trajet').addEventListener('submit', async ev => {
    ev.preventDefault();
    const btn = document.getElementById('btn-trajet');
    const d = depart || iDep.value.trim();
    const a = arrivee || iArr.value.trim();
    sect.hidden = false;
    if(!d){ resVoit.replaceChildren(el('h3', {textContent:'En voiture'}), el('p', {className:'vide', textContent:'Indiquez un départ ou cliquez sur « Me localiser ».'})); resLignes.replaceChildren(); return; }
    const heureDemandee = selQuand.value === 'later' && iHeure.value ? new Date(iHeure.value).toISOString() : null;
    btn.disabled = true; btn.textContent = 'Calcul en cours...';
    resVoit.replaceChildren(el('h3', {textContent:'En voiture'}), el('p', {className:'vide', textContent:'Calcul du trajet...'}));
    carteLignes(typeof d === 'string' ? d : '', typeof a === 'string' ? a : '');
    try{
      const r = await fetch('/api/trajet', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({depart:d, arrivee:a, departAt:heureDemandee})});
      const j = await r.json();
      const msg = {
        no_key: "Le calcul de trajet n'est pas disponible pour le moment.",
        not_found: "Adresse introuvable. Précisez le lieu ou cliquez sur la carte.",
      }[j.statut];
      if(j.statut !== 'ok'){
        resVoit.replaceChildren(el('h3', {textContent:'En voiture'}), el('p', {className:'vide', role:'alert', textContent: msg || 'Calcul indisponible pour le moment, réessayez.'}));
      } else {
        mDep = marque(j.depart, mDep, 'Départ'); mArr = marque(j.arrivee, mArr, 'Arrivée');
        if(carteOK){
          if(trace) map.removeLayer(trace);
          trace = L.polyline(j.trace, {color:'#00A651', weight:5}).addTo(map);
          map.fitBounds(trace.getBounds(), {padding:[30,30]});
        }
        carteVoiture(j, heureDemandee);
        // Les lignes se cherchent aussi sur l'adresse trouvee par TomTom.
        carteLignes((typeof d === 'string' ? d : '') + ' ' + (j.depart.label || ''), (typeof a === 'string' ? a : '') + ' ' + (j.arrivee.label || ''));
      }
    } catch(e){
      resVoit.replaceChildren(el('h3', {textContent:'En voiture'}), el('p', {className:'vide', role:'alert', textContent:'Calcul indisponible pour le moment, réessayez.'}));
    } finally { btn.disabled = false; btn.textContent = 'Calculer mon trajet'; }
  });

  // Pre-remplissage depuis la page d'accueil (?depart=...&arrivee=...).
  const q = new URLSearchParams(location.search);
  const d0 = (q.get('depart') || '').slice(0, 120), a0 = (q.get('arrivee') || '').slice(0, 120);
  if(d0) iDep.value = d0;
  if(a0) iArr.value = a0;
  if(d0 && a0) document.getElementById('form-trajet').requestSubmit();
})();
