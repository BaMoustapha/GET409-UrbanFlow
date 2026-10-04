// Script de la page /agent (sorti du HTML pour la Content-Security-Policy : aucun script inline).
const zone = document.getElementById('agent-zone');
const btn = document.getElementById('btn-agent');
const champ = document.getElementById('f-question');
function poser(q){ champ.value = q; interrogerAgent(q, '', zone, btn); }
document.getElementById('form-agent').addEventListener('submit', ev => { ev.preventDefault(); poser(champ.value); });
SUGGESTIONS.forEach(q => document.getElementById('chips').append(el('button', {type:'button', className:'chip', textContent:q, onclick:() => poser(q)})));
// Question transmise par une autre page (?q=...).
const q = new URLSearchParams(location.search).get('q');
if(q) poser(q.slice(0, 500));
