'use strict';
const icons = {
  phone:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>',
  pin:'<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  camera:'<rect x="2" y="6" width="14" height="12" rx="3"/><path d="m16 10 6-3v10l-6-3z"/>',
  barrier:'<rect x="2" y="8" width="20" height="5" rx="1"/><path d="M4 13v7h4v-7m3-5-3 5m9-5-3 5"/>',
  shield:'<path d="m12 2 8 3v6c0 5-3 8-8 11-5-3-8-6-8-11V5z"/><path d="m8.5 11.5 2.5 2.5 4.5-5"/>',
  power:'<path d="M12 2.5v9.8m-5.5-7a8.5 8.5 0 1 0 11 0"/>',
  expand:'<path d="M4 9V4h5m6 0h5v5m0 6v5h-5M9 20H4v-5"/>',
  chevron:'<path d="m9 6 6 6-6 6"/>',
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 7 0 0 1 16 0v2"/>',
  car:'<path d="m4 11 2-6h12l2 6m-16 0h16l1 2v5H3v-5zm1 7v2m14-2v2m-13-6h2m8 0h2"/>',
  ticket:'<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4z"/><path d="M15 8v1m0 3v1m0 3v1"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>'
};
const $ = id => document.getElementById(id);
function svg(name) {return '<svg aria-hidden="true" viewBox="0 0 24 24">'+icons[name]+'</svg>'}
document.querySelectorAll('svg[data-icon]').forEach(el=>el.outerHTML=svg(el.dataset.icon));
const key='teo-security-demo-v1';
const now=Date.now();
const labels={open:'Шлагбаум открыт',car:'Автомобиль добавлен',remove:'Автомобиль удалён',pass:'Гостевой пропуск выдан',revoke:'Гостевой пропуск отменён'};
function initial(){return {cars:['А123ВС 174'],passes:[],events:[{type:'open',at:now-17*60000,detail:'Основной въезд · Из приложения'},{type:'car',at:now-91*60000,detail:'А123ВС 174'}]}}
function read(){
  try {const s=JSON.parse(localStorage.getItem(key));if(s && ['cars','passes','events'].every(k=>Array.isArray(s[k])))return s}catch{}
  return initial();
}
let state=read();
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{}}
save();
function record(type,detail){state.events.unshift({type,detail,at:Date.now()});state.events=state.events.slice(0,100);save();render();}
const fmt=(date,opts)=>new Intl.DateTimeFormat('ru-RU',opts).format(date);
function elem(tag,cls,txt){const node=document.createElement(tag);if(cls)node.className=cls;if(txt)node.textContent=txt;return node}
function eventRow(entry){
  const row=elem('div','event'),mark=elem('span','event-icon');
  mark.innerHTML=svg(entry.type==='open'?'barrier':['pass','revoke'].includes(entry.type)?'ticket':'car');
  const desc=elem('div');desc.append(elem('div','event-name',labels[entry.type]),elem('div','event-sub',entry.detail));
  const date=new Date(entry.at),clock=elem('div','event-time',fmt(date,{hour:'2-digit',minute:'2-digit'}));
  clock.append(elem('small','',date.toDateString()===new Date().toDateString()?'Сегодня':fmt(date,{day:'numeric',month:'short'})));
  row.append(mark,desc,clock);return row;
}
function item(plate,note,action,handler){
  const row=elem('div','item'),copy=elem('div');copy.append(elem('span','plate',plate),elem('small','',note));
  const b=elem('button','',action);b.onclick=handler;row.append(copy,b);return row;
}
function render(){
  $('recent').replaceChildren(...state.events.slice(0,2).map(eventRow));
  $('cars').replaceChildren(...state.cars.map(p=>item(p,'Постоянный доступ','Удалить',()=>confirmRemove(p,false))));
  if(!state.cars.length)$('cars').append(elem('div','empty','Автомобили ещё не добавлены'));
  const active=state.passes.filter(p=>p.end>Date.now());
  $('passes').replaceChildren(...active.map(p=>item(p.plate,'До '+fmt(new Date(p.end),{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}),'Отменить',()=>confirmRemove(p.plate,true))));
  if(!active.length)$('passes').append(elem('div','empty','Активных пропусков нет'));
}
function go(){
  const profile=location.hash==='#profile';
  $('home').hidden=profile;$('profile').hidden=!profile;
  document.querySelectorAll('nav button').forEach(b=>{const active=(b.dataset.page==='profile')===profile;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  window.scrollTo(0,0);render();gateView();
}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{location.hash=b.dataset.page});
window.addEventListener('hashchange',go);
const modal=$('modal'),body=$('modal-body');
function show(title,wide=false){$('modal-title').textContent=title;body.replaceChildren();modal.classList.toggle('image-modal',wide);modal.setAttribute('aria-labelledby','modal-title');modal.showModal()}
$('close').onclick=()=>modal.close();
modal.addEventListener('click',e=>{if(e.target===modal){const b=modal.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)modal.close()}});
const cameraScene = document.querySelector('.feed .gate-scene');
let expandedArm = null;
$('expand').onclick = () => {
  show('Камера въезда · Демонстрация', true);
  const scene = cameraScene.cloneNode(true);
  scene.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  body.append(scene);
  expandedArm = scene.querySelector('.gate-arm');
};
modal.addEventListener('close', () => { expandedArm = null; });
$('history').onclick=()=>{show('Журнал событий');body.append(...state.events.map(eventRow))};
function confirmRemove(plate,guest){
  show(guest?'Отменить гостевой пропуск?':'Удалить автомобиль?');
  const b=elem('button','secondary',guest?'Отменить пропуск':'Удалить автомобиль');
  body.append(elem('p','line-note',plate+' · Доступ по этому номеру будет прекращён.'),b);
  b.onclick=()=>{state=read();if(guest)state.passes=state.passes.filter(x=>x.plate!==plate);else state.cars=state.cars.filter(x=>x!==plate);record(guest?'revoke':'remove',plate);modal.close();gateView()};
}
function normalize(value){const latin='ABEKMHOPCTYX',cyr='АВЕКМНОРСТУХ';return value.toUpperCase().replace(/[ABEKMHOPCTYX]/g,l=>cyr[latin.indexOf(l)]).replace(/[\s-]/g,'')}
function plateForm(guest){
  show(guest?'Выдать гостевой пропуск':'Добавить автомобиль');
  body.innerHTML='<form><label for="number">Госномер автомобиля</label><input id="number" required maxlength="14" autocomplete="off" autocapitalize="characters" placeholder="А123ВС 174" aria-describedby="plate-help plate-error"><p class="line-note" id="plate-help"></p><p class="error" id="plate-error" role="alert"></p><button class="primary"></button></form>';
  $('plate-help').textContent=guest?'Доступ начнётся сразу и закончится через 24 часа.':'Введите номер легкового автомобиля с кодом региона.';
  body.querySelector('.primary').textContent=guest?'Выдать на 24 часа':'Добавить';
  const input=$('number');input.focus();body.querySelector('form').onsubmit=e=>{
    e.preventDefault();state=read();const raw=normalize(input.value);
    if(!/^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$/.test(raw)){$('plate-error').textContent='Проверьте формат номера, например А123ВС 174.';return}
    const plate=raw.slice(0,6)+' '+raw.slice(6);
    if(state.cars.includes(plate)||state.passes.some(x=>x.plate===plate&&x.end>Date.now())){$('plate-error').textContent='У этого номера уже есть доступ.';return}
    if(guest)state.passes.push({plate,end:Date.now()+86400000});else state.cars.push(plate);
    record(guest?'pass':'car',plate);modal.close();gateView();$('announce').textContent=guest?'Пропуск выдан':'Автомобиль добавлен';
  };
}
$('add-car').onclick=()=>plateForm(false);$('add-pass').onclick=()=>plateForm(true);
const arm = cameraScene.querySelector('.gate-arm');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const travelMs = 1800;
const holdMs = 5000;
const openAngle = 84;
const gateStates = {
  closed: ['Закрыт', 'Открыть шлагбаум', 'Нажмите кнопку для въезда'],
  opening: ['Открывается', 'Открываем…', 'Стрела поднимается'],
  opened: ['Открыт', 'Шлагбаум открыт', 'Демоконтроллер подтвердил открытие'],
  closing: ['Закрывается', 'Шлагбаум закрывается', 'Стрела опускается']
};
let phase = 'closed';
let frame = 0;
let startedAt = 0;

function gateView() {
  const [status, title, note] = gateStates[phase];
  $('gate-state').lastElementChild.textContent = navigator.onLine ? status : 'Нет сети';
  $('open').disabled = !navigator.onLine || state.cars.length === 0 || phase !== 'closed';
  $('action-label').textContent = title;
  $('action-note').textContent = !navigator.onLine ? 'Открытие недоступно без интернета'
    : !state.cars.length ? 'Добавьте автомобиль в профиле' : note;
}
function setLift(fraction) {
  // Both camera views use the hinge coordinates in the original photograph.
  const smooth = fraction * fraction * (3 - 2 * fraction);
  const position = 'rotate(' + (openAngle * smooth) + ' 1012 547)';
  arm.setAttribute('transform', position);
  expandedArm?.setAttribute('transform', position);
}
function endCycle() {
  cancelAnimationFrame(frame);
  setLift(0);
  phase = 'closed';
  gateView();
}
function animateGate(timestamp) {
  const elapsed = Math.max(0, timestamp - startedAt);
  if (phase === 'opening' && elapsed >= travelMs) {
    state = read();
    if (!navigator.onLine || !state.cars.length) { endCycle(); return; }
    phase = 'opened';
    record('open', 'Основной въезд · Из приложения');
    gateView();
  }
  if (elapsed >= 2 * travelMs + holdMs) { endCycle(); return; }
  if (elapsed >= travelMs + holdMs && phase !== 'closing') {
    phase = 'closing';
    gateView();
  }
  let lift = 1;
  if (phase === 'opening') lift = reducedMotion.matches ? 0 : elapsed / travelMs;
  if (phase === 'closing') lift = reducedMotion.matches ? 1 : 1 - (elapsed - travelMs - holdMs) / travelMs;
  setLift(lift);
  frame = requestAnimationFrame(animateGate);
}
$('open').onclick = () => {
  state = read();
  gateView();
  if ($('open').disabled) return;
  phase = 'opening';
  startedAt = performance.now();
  gateView();
  frame = requestAnimationFrame(animateGate);
};
window.addEventListener('offline', endCycle);
window.addEventListener('online', gateView);
window.addEventListener('storage',e=>{if(e.key===key){state=read();render();gateView()}});
setInterval(render,1000*15);document.addEventListener('visibilitychange',()=>{if(!document.hidden){state=read();render();gateView()}});
go();
if('serviceWorker' in navigator && location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
