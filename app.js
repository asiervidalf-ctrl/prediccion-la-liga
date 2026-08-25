const rawTeams = [
  ['Athletic Club','#d7192d','ATH'],['Atlético de Madrid','#ca2430','ATM'],['CA Osasuna','#c8102e','OSA'],['RC Celta','#74b9e2','CEL'],
  ['Deportivo Alavés','#1261a0','ALA'],['Elche CF','#1d7b43','ELC'],['FC Barcelona','#a50044','FCB'],['Getafe CF','#005999','GET'],
  ['Levante UD','#b41f3a','LEV'],['Málaga CF','#60b6df','MCF'],['Racing Club','#1b7642','RAC'],['Rayo Vallecano','#e53935','RAY'],
  ['RC Deportivo','#2069b2','DEP'],['RCD Espanyol','#188bd2','ESP'],['Real Betis','#159447','BET'],['Real Madrid','#9d8b55','RMA'],
  ['Real Sociedad','#1672b8','RSO'],['Sevilla FC','#d71920','SEV'],['Valencia CF','#e77e22','VAL'],['Villarreal CF','#e0bb13','VIL']
];
const crestIds=[1,2,13,5,28,21,3,8,10,11,42,14,6,7,4,15,16,17,18,22];
const defaultTeams=rawTeams.map(([name,color,abbr],index)=>({name,color,abbr,crest:`https://static.futbolfantasy.com/uploads/images/cabecera/hd/${crestIds[index]}.png`}));

const awards = [
  {id:'pichichi',icon:'◎',label:'Máximo goleador',placeholder:'Nombre del jugador'},
  {id:'asistente',icon:'↗',label:'Máximo asistente',placeholder:'Nombre del jugador'},
  {id:'zamora',icon:'▣',label:'Trofeo Zamora',placeholder:'Nombre del portero'},
  {id:'zarra',icon:'★',label:'Trofeo Zarra',placeholder:'Nombre del jugador'},
  {id:'revelacion',icon:'✦',label:'Equipo revelación',type:'team'},
  {id:'decepcion',icon:'↓',label:'Equipo decepción',type:'team'},
  {id:'mvp',icon:'♛',label:'MVP de la temporada',placeholder:'Nombre del jugador'},
  {id:'jugador-revelacion',icon:'⚡',label:'Jugador revelación',placeholder:'Nombre del jugador'},
  {id:'jugador-decepcion',icon:'☂',label:'Jugador decepción',placeholder:'Nombre del jugador'},
  {id:'mejor-fichaje',icon:'↑',label:'Mejor fichaje',placeholder:'Nombre del jugador'},
  {id:'peor-fichaje',icon:'↓',label:'Peor fichaje',placeholder:'Nombre del jugador'},
  {id:'mejor-entrenador',icon:'◇',label:'Mejor entrenador',placeholder:'Nombre del entrenador',type:'text'},
  {id:'primer-despedido',icon:'✕',label:'Primer entrenador despedido',placeholder:'Nombre del entrenador',type:'text'},
  {id:'campeon-copa',icon:'♜',label:'Campeón de Copa del Rey',type:'team'}
];

const list = document.querySelector('#teamList');
const stored = loadState();
let teams = stored.teams || [...defaultTeams];

function loadState(){
  try{
    const shared = new URLSearchParams(location.search).get('p');
    if(shared){ const base64=shared.replace(/-/g,'+').replace(/_/g,'/'); const parsed=JSON.parse(decodeURIComponent(escape(atob(base64)))); localStorage.setItem('porra2627',JSON.stringify(parsed)); return parsed; }
    return JSON.parse(localStorage.getItem('porra2627')) || {};
  }catch{return {}}
}

function zoneAt(i){if(i<5)return 'champions';if(i<7)return 'europa';if(i===7)return 'conference';if(i>16)return 'relegation';return ''}
function renderTeams(){
  list.innerHTML='';
  teams.forEach((team,i)=>{
    const row=document.createElement('div'); row.className='team-row'; row.draggable=true; row.dataset.index=i;
    const crest=team.crest||defaultTeams.find(item=>item.name===team.name)?.crest;
    row.innerHTML=`<i class="zone ${zoneAt(i)}"></i><span class="position">${String(i+1).padStart(2,'0')}</span><span class="team"><img class="crest" src="${crest}" alt="Escudo de ${team.name}" loading="lazy">${team.name}</span><span class="row-controls"><button class="move up" aria-label="Subir ${team.name}" ${i===0?'disabled':''}>↑</button><button class="move down" aria-label="Bajar ${team.name}" ${i===teams.length-1?'disabled':''}>↓</button><i class="grip">⠿</i></span>`;
    row.querySelector('.up').onclick=()=>move(i,-1); row.querySelector('.down').onclick=()=>move(i,1);
    row.addEventListener('dragstart',()=>row.classList.add('dragging'));
    row.addEventListener('dragend',()=>{row.classList.remove('dragging');syncOrder();}); list.append(row);
  });
}
list.addEventListener('dragover',e=>{e.preventDefault();const dragging=list.querySelector('.dragging');if(!dragging)return;const siblings=[...list.querySelectorAll('.team-row:not(.dragging)')];const next=siblings.find(el=>e.clientY<=el.getBoundingClientRect().top+el.offsetHeight/2);list.insertBefore(dragging,next||null)});
function syncOrder(){teams=[...list.children].map(row=>teams[+row.dataset.index]);renderTeams();save();}
function move(i,delta){const target=i+delta;if(target<0||target>=teams.length)return;[teams[i],teams[target]]=[teams[target],teams[i]];renderTeams();save();}

const grid=document.querySelector('#awardGrid');
awards.forEach((a,i)=>{
  const card=document.createElement('div');card.className='award';
  const field=a.type==='team'?`<div class="team-award-field"><img id="team-crest-${a.id}" src="" alt="" hidden><select id="${a.id}"><option value="">Elige un equipo</option>${defaultTeams.map(t=>`<option>${t.name}</option>`).join('')}</select></div>`:a.type==='text'?`<input id="${a.id}" maxlength="40" placeholder="${a.placeholder}" autocomplete="off">`:`<div class="player-field"><div class="selected-player" id="selected-${a.id}"></div><input id="${a.id}" maxlength="40" placeholder="${a.placeholder}" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false"><div class="suggestions" id="suggestions-${a.id}" role="listbox"></div></div>`;
  card.innerHTML=`<span class="award-num">0${i+1}</span><div class="award-icon">${a.icon}</div><label for="${a.id}">${a.label}</label>${field}`;grid.append(card);
  const input=card.querySelector(`#${a.id}`);input.value=stored.awards?.[a.id]||'';input.addEventListener('input',()=>{save();updateProgress()});
  if(a.type==='team'){
    const updateCrest=()=>{const crest=card.querySelector(`#team-crest-${a.id}`),team=defaultTeams.find(item=>item.name===input.value);crest.hidden=!team;crest.src=team?.crest||'';crest.alt=team?`Escudo de ${team.name}`:''};
    input.addEventListener('change',updateCrest);updateCrest();
  }
});
let playerCatalog=[];
fetch('data/players.json').then(response=>response.ok?response.json():[]).then(players=>{playerCatalog=players;restorePlayerCards()}).catch(()=>{});
function normalize(value){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function showPlayerCard(id,player){
  const box=document.querySelector(`#selected-${id}`);if(!box)return;
  if(!player){box.innerHTML='';box.classList.remove('visible');return}
  box.innerHTML=`<img src="${player.photo}" alt="${player.name}"><span><strong>${player.name}</strong><small>${player.club}</small></span><button type="button" aria-label="Quitar selección">×</button>`;box.classList.add('visible');
  box.querySelector('button').onclick=()=>{const input=document.querySelector(`#${id}`);input.value='';delete input.dataset.photo;delete input.dataset.club;showPlayerCard(id,null);save();updateProgress();input.focus()};
}
function selectPlayer(id,player){const input=document.querySelector(`#${id}`);input.value=player.name;input.dataset.photo=player.photo;input.dataset.club=player.club;document.querySelector(`#suggestions-${id}`).innerHTML='';input.setAttribute('aria-expanded','false');showPlayerCard(id,player);save();updateProgress()}
function restorePlayerCards(){awards.filter(a=>!a.type).forEach(a=>{const input=document.querySelector(`#${a.id}`);const saved=stored.awardPlayers?.[a.id];const player=saved||playerCatalog.find(p=>p.name===input.value);if(player){input.dataset.photo=player.photo;input.dataset.club=player.club;showPlayerCard(a.id,player)}})}
awards.filter(a=>!a.type).forEach(a=>{
  const input=document.querySelector(`#${a.id}`),menu=document.querySelector(`#suggestions-${a.id}`);
  input.addEventListener('input',()=>{
    showPlayerCard(a.id,null);delete input.dataset.photo;delete input.dataset.club;
    const query=normalize(input.value.trim());if(query.length<2){menu.innerHTML='';input.setAttribute('aria-expanded','false');return}
    const matches=playerCatalog.filter(player=>normalize(player.name).includes(query)).slice(0,7);
    menu.innerHTML=matches.length?matches.map((player,index)=>`<button type="button" role="option" data-index="${index}"><img src="${player.photo}" alt=""><span><strong>${player.name}</strong><small>${player.club}</small></span></button>`).join(''):`<span class="no-results">Sin coincidencias</span>`;
    input.setAttribute('aria-expanded','true');menu.querySelectorAll('button').forEach((button,index)=>button.onclick=()=>selectPlayer(a.id,matches[index]));
  });
  input.addEventListener('blur',()=>setTimeout(()=>{menu.innerHTML='';input.setAttribute('aria-expanded','false')},180));
});
const author=document.querySelector('#author');author.value=stored.author||'';author.addEventListener('input',save);
function getAwards(){return Object.fromEntries(awards.map(a=>[a.id,document.querySelector(`#${a.id}`).value.trim()]));}
function state(){return {author:author.value.trim(),teams,awards:getAwards(),awardPlayers:Object.fromEntries(awards.filter(a=>!a.type).map(a=>{const input=document.querySelector(`#${a.id}`);return [a.id,input.dataset.photo?{name:input.value.trim(),photo:input.dataset.photo,club:input.dataset.club} : null]}))}}
function save(){localStorage.setItem('porra2627',JSON.stringify(state()));}
function updateProgress(){const n=Object.values(getAwards()).filter(Boolean).length;document.querySelector('#progressText').textContent=`${n} de ${awards.length} premios`;document.querySelector('#progressBar').style.width=`${n/awards.length*100}%`;}
function summary(){const s=state();return `⚽ PORRA CARALLEIRO 26/27${s.author?` — ${s.author}`:''}\n\n🏆 CLASIFICACIÓN\n${s.teams.map((t,i)=>`${i+1}. ${t.name}`).join('\n')}\n\n⭐ CUADRO DE HONOR\n${awards.map(a=>`${a.label}: ${s.awards[a.id]||'—'}`).join('\n')}`;}
function toast(msg){const el=document.querySelector('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove('show'),2400)}
document.querySelector('#copyBtn').onclick=async()=>{try{await navigator.clipboard.writeText(summary());toast('Resumen copiado al portapapeles')}catch{toast('No se pudo copiar el resumen')}};
document.querySelector('#shareBtn').onclick=async()=>{
  save();const button=document.querySelector('#shareBtn');button.disabled=true;button.firstChild.textContent='Publicando... ';
  try{
    const response=await fetch('/api/predictions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state())});const result=await response.json();
    if(!response.ok)throw new Error(result.error||'No se pudo publicar');
    toast('Tu porra ya está en el muro');await loadPredictions();location.hash='la-pena';
    const url=`${location.href.split('#')[0]}#la-pena`;if(navigator.share)await navigator.share({title:'Porra Caralleiro 26/27',text:`${author.value} ya se ha mojado. Mira su porra.`,url});
  }catch(error){if(error.name!=='AbortError')toast(error.message||'No se pudo publicar')}
  finally{button.disabled=false;button.firstChild.textContent='Publicar mi porra '}
};
document.querySelector('#resetBtn').onclick=()=>{if(!confirm('¿Seguro que quieres borrar toda tu predicción?'))return;localStorage.removeItem('porra2627');history.replaceState({},'',location.pathname);location.reload()};
renderTeams();updateProgress();

let predictionWindowOpen=false,deadlineTimer=null;
function applyPredictionLock(isOpen){
  predictionWindowOpen=isOpen;document.body.classList.toggle('predictions-closed',!isOpen);
  document.querySelectorAll('#author,#awardGrid input,#awardGrid select,#shareBtn,#resetBtn').forEach(element=>element.disabled=!isOpen);
  document.querySelectorAll('.team-row').forEach(row=>row.draggable=isOpen);document.querySelectorAll('.move').forEach(button=>button.disabled=!isOpen||button.disabled);
}
function updateDeadlineBanner(deadline,isOpen){
  const banner=document.querySelector('#deadlineBanner'),target=new Date(deadline),remaining=target-Date.now();
  if(!isOpen||remaining<=0){banner.innerHTML='<strong>PORRA CERRADA</strong><span>Estamos fuera. Las predicciones ya no se pueden modificar.</span>';applyPredictionLock(false);if(deadlineTimer)clearInterval(deadlineTimer);return}
  const days=Math.floor(remaining/86400000),hours=Math.floor(remaining%86400000/3600000),minutes=Math.floor(remaining%3600000/60000);banner.innerHTML=`<strong>MERCADO ABIERTO</strong><span>Cierra el 1 de septiembre a las 23:59 · ${days}d ${hours}h ${minutes}m</span>`;applyPredictionLock(true);
}
async function loadPredictionStatus(){try{const response=await fetch('/api/status');const status=await response.json();updateDeadlineBanner(status.deadline,status.open);deadlineTimer=setInterval(()=>updateDeadlineBanner(status.deadline,status.open),30000)}catch{document.querySelector('#deadlineBanner').innerHTML='<strong>ESTADO DESCONOCIDO</strong><span>No se publicará nada hasta comprobar la fecha límite.</span>';applyPredictionLock(false)}}
loadPredictionStatus();

const awardLabels=Object.fromEntries(awards.map(award=>[award.id,award.label]));let activePrediction=null;
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
function predictionCard(item,index){const prediction=item.prediction;const champion=prediction.teams[0]?.name||'Sin campeón';const pichichi=prediction.awards.pichichi||'Sin elegir';return `<button class="prediction-card" data-id="${item.id}"><span class="card-index">#${String(index+1).padStart(2,'0')}</span><span class="card-tag">ESTAMOS FUERA</span><h3>${escapeHtml(item.author)}</h3><div class="card-pick"><small>CAMPEÓN</small><strong>${escapeHtml(champion)}</strong></div><div class="card-pick"><small>PICHICHI</small><strong>${escapeHtml(pichichi)}</strong></div><span class="card-open">VER LA PORRA ENTERA ↗</span></button>`}
async function loadPredictions(){
  const grid=document.querySelector('#predictionGrid');
  try{const response=await fetch('/api/predictions');const items=await response.json();window.publicPredictions=items;document.querySelector('#predictionCount').textContent=`${items.length} ${items.length===1?'PORRA PUBLICADA':'PORRAS PUBLICADAS'}`;grid.innerHTML=items.length?items.map(predictionCard).join(''):'<div class="empty-state">Todavía no hay porras en el muro.<br><strong>Echa gasolina Dani.</strong></div>';grid.querySelectorAll('.prediction-card').forEach(card=>card.onclick=()=>openPrediction(items.find(item=>item.id===+card.dataset.id)))}catch{grid.innerHTML='<div class="empty-state">No se pudo cargar el muro.<br><strong>Estamos fuera.</strong></div>'}
}
function openPrediction(item){
  activePrediction=item;const prediction=item.prediction;const modal=document.querySelector('#predictionModal');const date=new Date(item.created_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'});
  document.querySelector('#modalContent').innerHTML=`<span class="detail-label">PORRA #${item.id} · ${date}</span><h2 id="modalTitle">${escapeHtml(item.author)}</h2><div class="detail-columns"><div><h3>CLASIFICACIÓN</h3><ol class="detail-table">${prediction.teams.map((team,index)=>`<li><span>${String(index+1).padStart(2,'0')}</span><strong>${escapeHtml(team.name)}</strong></li>`).join('')}</ol></div><div><h3>CUADRO DE HONOR</h3><dl class="detail-awards">${awards.map(award=>`<div><dt>${award.label}</dt><dd>${escapeHtml(prediction.awards[award.id]||'—')}</dd></div>`).join('')}</dl></div></div>`;
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');
}
function closePrediction(){const modal=document.querySelector('#predictionModal');modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
document.querySelectorAll('[data-close-modal]').forEach(element=>element.onclick=closePrediction);document.addEventListener('keydown',event=>{if(event.key==='Escape')closePrediction()});document.querySelector('#refreshPredictions').onclick=loadPredictions;
document.querySelector('#downloadPoster').onclick=()=>{if(activePrediction)downloadPredictionPoster(activePrediction)};
function downloadPredictionPoster(item){
  const prediction=item.prediction,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=1200;canvas.height=1900;
  ctx.fillStyle='#0b0b0b';ctx.fillRect(0,0,1200,1900);ctx.fillStyle='#7c3aed';ctx.fillRect(0,0,1200,22);ctx.save();ctx.translate(1120,180);ctx.rotate(-.12);ctx.fillStyle='#2de2c4';ctx.fillRect(-390,-85,500,145);ctx.fillStyle='#0b0b0b';ctx.font='bold 48px Arial';ctx.fillText('26/27',-330,10);ctx.restore();
  ctx.fillStyle='#f5f0e6';ctx.font='bold 34px Arial';ctx.fillText('PORRA CARALLEIRO',70,105);ctx.fillStyle='#a78bfa';ctx.font='bold 112px Impact, Arial';ctx.fillText(item.author.toUpperCase(),70,240);ctx.fillStyle='#f5f0e6';ctx.font='bold 27px Arial';ctx.fillText('ASÍ QUEDA LA LIGA',70,325);
  const drawTeam=(team,index,x,y)=>{ctx.fillStyle=index===0?'#a78bfa':index>16?'#2de2c4':'#f5f0e6';ctx.font='bold 23px monospace';ctx.fillText(String(index+1).padStart(2,'0'),x,y);ctx.fillStyle='#f5f0e6';ctx.font='bold 25px Arial';ctx.fillText(team.name,x+55,y)};
  prediction.teams.forEach((team,index)=>drawTeam(team,index,index<10?70:620,390+(index%10)*61));ctx.strokeStyle='#41413d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(570,365);ctx.lineTo(570,980);ctx.stroke();
  ctx.fillStyle='#7c3aed';ctx.fillRect(0,1040,1200,6);ctx.fillStyle='#f5f0e6';ctx.font='bold 28px Arial';ctx.fillText('CUADRO DE HONOR',70,1110);
  awards.forEach((award,index)=>{const x=index%2?620:70,y=1180+Math.floor(index/2)*92;ctx.fillStyle='#8e9189';ctx.font='bold 16px monospace';ctx.fillText(award.label.toUpperCase(),x,y);ctx.fillStyle='#f5f0e6';ctx.font='bold 27px Arial';ctx.fillText(prediction.awards[award.id]||'—',x,y+35)});
  ctx.fillStyle='#a78bfa';ctx.font='bold 15px monospace';ctx.fillText('ESTAMOS FUERA · ECHA GASOLINA DANI · ESCOTET FÓRA XA · EXPANDE LA ESPALDA',70,1850);const link=document.createElement('a');link.download=`porra-caralleiro-${item.author.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.png`;link.href=canvas.toDataURL('image/png');link.click();toast('Cartel descargado')
}
loadPredictions();

const sections=[...document.querySelectorAll('main section[id]')];const nav=[...document.querySelectorAll('.section-nav a')];
const sectionObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)nav.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${e.target.id}`))}),{rootMargin:'-35% 0px -55%'});
sections.forEach(section=>sectionObserver.observe(section));
