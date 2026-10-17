const C=window.DE_CONTENT;const $=s=>document.querySelector(s);let S={view:'dashboard',module:0,lesson:0,filter:'All',search:'',qi:0,choice:null,checked:false,score:0};let P=load();function load(){try{return JSON.parse(localStorage.getItem('deMasteryPro'))||{done:[],weeks:[],best:0,attempts:0,notes:{},projects:{},theme:'dark'}}catch(e){return{done:[],weeks:[],best:0,attempts:0,notes:{},projects:{},theme:'dark'}}}function save(){localStorage.setItem('deMasteryPro',JSON.stringify(P))}function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function all(){return C.modules.flatMap((m,mi)=>m.lessons.map((l,li)=>({...l,mi,li,key:mi+'-'+li,module:m})))}function percent(){return Math.round(P.done.length/Math.max(1,all().length)*100)}function toast(t){let e=$('#toast');e.textContent=t;e.classList.remove('hidden');setTimeout(()=>e.classList.add('hidden'),1800)}

let speaking=false,currentUtter=null;
function pickVoice(){
  const voices=window.speechSynthesis.getVoices()||[];
  // Prefer MALE English voices (clearer for mixed Hinglish + tech terms)
  const malePrefer=[
    'Google UK English Male','Google US English','Microsoft David','Microsoft Mark',
    'Microsoft Guy','Microsoft Ryan','Daniel','Alex','Fred','Microsoft Ravi',
    'Google हिन्दी','Microsoft Hindi'
  ];
  for(const name of malePrefer){
    const v=voices.find(x=>x.name===name||x.name.includes(name.split(' ').slice(-1)[0]));
    if(v && (!v.name.toLowerCase().includes('female')) && (!v.name.toLowerCase().includes('zira'))) return v;
  }
  // Any male-ish en voice
  const male=voices.find(v=>v.lang&&v.lang.startsWith('en')&&/male|david|mark|daniel|alex|fred|ravi|guy|ryan/i.test(v.name));
  if(male) return male;
  const en=voices.find(v=>v.lang&&v.lang.startsWith('en'));
  return en||voices[0]||null;
}
// Make Hinglish + tech terms more speakable for browser TTS
function prepSpeechText(t){
  if(!t) return '';
  let s=String(t);
  // Expand common abbreviations so TTS doesn't mumble
  const map={
    'ETL':'E T L','ELT':'E L T','SQL':'S Q L','AWS':'A W S','S3':'S 3',
    'IAM':'I A M','CDC':'C D C','SCD':'S C D','API':'A P I','JSON':'J S O N',
    'CSV':'C S V','dbt':'d b t','OLTP':'O L T P','OLAP':'O L A P',
    'PySpark':'Pie Spark','DataFrame':'Data Frame','Parquet':'Par kay',
    'Redshift':'Red shift','Athena':'Athena','Glue':'Glue','Lambda':'Lambda',
    'Airflow':'Air flow','Docker':'Docker','Git':'Git','NULL':'null',
    'JOIN':'join','GROUP BY':'group by','ORDER BY':'order by','WHERE':'where',
    'SELECT':'select','CTE':'C T E','DAG':'dag','PWA':'P W A'
  };
  for(const [k,v] of Object.entries(map)){
    s=s.replace(new RegExp('\\b'+k+'\\b','g'),v);
  }
  // Soften dense punctuation / bullets for smoother speech
  s=s.replace(/[•·]/g,'. ');
  s=s.replace(/\n+/g,'. ');
  s=s.replace(/\s{2,}/g,' ');
  s=s.replace(/:\\s*/g,'. ');
  // Slight pauses
  s=s.replace(/\.\s*/g,'. ');
  return s.trim();
}
function stopSpeak(){
  try{window.speechSynthesis.cancel()}catch(e){}
  speaking=false;currentUtter=null;
  const b=document.getElementById('speakBtn');
  if(b){b.textContent='🔊 Listen (Male)';b.classList.remove('speaking')}
}
function speakLesson(){
  if(!window.speechSynthesis){toast('Speech not supported on this browser');return}
  if(speaking){stopSpeak();return}
  const m=C.modules[S.module],l=m.lessons[S.lesson];
  if(!l) return;
  // Title + explanation + takeaway only (examples/code skip — clearer)
  const raw=(l.title||'')+'. '+(l.explanation||'')+'. Important point: '+(l.takeaway||'');
  const text=prepSpeechText(raw);
  const u=new SpeechSynthesisUtterance(text);
  u.rate=0.85;   // slower = clearer for Hinglish mix
  u.pitch=0.95;  // slightly lower = more male
  u.volume=1;
  const voice=pickVoice();
  if(voice){u.voice=voice;u.lang=voice.lang||'en-IN'}
  else {u.lang='en-IN'}
  u.onend=function(){speaking=false;currentUtter=null;const b=document.getElementById('speakBtn');if(b){b.textContent='🔊 Listen (Male)';b.classList.remove('speaking')}};
  u.onerror=function(){speaking=false;toast('Voice error — try Chrome/Edge')};
  window.speechSynthesis.cancel();
  speaking=true;currentUtter=u;
  function doSpeak(){
    const v=pickVoice();
    if(v){u.voice=v;u.lang=v.lang||'en-IN'}
    speechSynthesis.speak(u);
  }
  if(speechSynthesis.getVoices().length===0){
    speechSynthesis.onvoiceschanged=function(){doSpeak()};
    // fallback timeout
    setTimeout(doSpeak,400);
  } else {
    doSpeak();
  }
  const b=document.getElementById('speakBtn');
  if(b){b.textContent='⏹ Stop';b.classList.add('speaking')}
  toast('Male voice playing…');
}

function go(v){stopSpeak();S.view=v;S.module=null;render();syncNav()}function syncNav(){document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===S.view))}function openLesson(mi,li){stopSpeak();S.view='lesson';S.module=mi;S.lesson=li;render();syncNav()}function moduleCard(m,i){let total=m.lessons.length,done=m.lessons.filter((l,j)=>P.done.includes(i+'-'+j)).length;return `<div class="card s6"><div class="module"><div class="numtile">${String(i+1).padStart(2,'0')}</div><div><h3>${esc(m.title)}</h3><p>${esc(m.desc)}</p><span class="tag">${esc(m.period)}</span><span class="tag">${done}/${total} lessons</span><div class="progress"><span style="width:${done/total*100}%"></span></div><button class="btn secondary" onclick="openLesson(${i},0)">Open module →</button></div></div></div>`}function dashboard(){return `<section class="hero"><div class="eyebrow">YOUR ROADMAP · 2026</div><h1>From zero to <span class="gradient">Data Engineer.</span></h1><p>A structured Hinglish learning academy based on your uploaded fresher roadmap. Understand the why, learn with examples, test yourself, and build a portfolio — free, ad-free, and offline-ready.</p><div class="row"><button class="btn" onclick="go('roadmap')">Continue 16-week roadmap →</button><button class="btn secondary" onclick="go('learn')">Explore lessons</button></div></section><div class="grid"><div class="card s3"><div class="stat">LESSONS COMPLETED</div><div class="number">${P.done.length}<span class="stat"> / ${all().length}</span></div><div class="stat">Progress saved on this device</div></div><div class="card s3"><div class="stat">ROADMAP PROGRESS</div><div class="number">${percent()}%</div><div class="progress"><span style="width:${percent()}%"></span></div></div><div class="card s3"><div class="stat">BEST QUIZ SCORE</div><div class="number">${P.best}%</div><div class="stat">${P.attempts} completed attempts</div></div><div class="card s3"><div class="stat">WEEKLY PLAN</div><div class="number">${P.weeks.length}/16</div><div class="stat">Weeks marked complete</div></div></div><div class="section"><div><h2>Learning path</h2><p>Follow the roadmap priority order; don't skip foundations.</p></div><button class="btn secondary" onclick="go('learn')">All lessons</button></div><div class="grid">${C.modules.slice(0,4).map(moduleCard).join('')}</div><div class="section"><div><h2>Pick up where you left off</h2><p>Start with the first SQL lesson if you're new.</p></div></div><div class="card lesson"><div><h3>${esc(all()[0].title)}</h3><p>${esc(all()[0].module.title)} · Foundation lesson</p></div><button class="btn" onclick="openLesson(0,0)">Start learning</button></div>`}function roadmap(){return `<div class="eyebrow">16-WEEK PLAN</div><h1 class="page-title">Your roadmap</h1><p class="lead">Based on the weekly sequence in your PDF. Study 3–5 focused hours daily if practical; adjust to your schedule. Projects matter more than collecting certificates.</p><div class="card"><b>${P.weeks.length}/16 weeks completed</b><div class="progress"><span style="width:${P.weeks.length/16*100}%"></span></div></div><div class="grid">${C.weeks.map(w=>`<div class="card s6"><div class="week"><div class="numtile">${String(w[0]).padStart(2,'0')}</div><div><h3>${esc(w[2])}</h3><p>${esc(w[1])}</p><p>${esc(w[3])}</p><label class="check"><input type="checkbox" ${P.weeks.includes(w[0])?'checked':''} onchange="weekToggle(${w[0]},this.checked)"> Mark week complete</label></div><button class="btn secondary" onclick="openLesson(${w[4]},0)">Study →</button></div></div>`).join('')}</div>`}function learn(){let ls=all().filter(l=>(S.filter==='All'||l.module.title===S.filter)&&(`${l.title} ${l.module.title} ${l.module.desc}`).toLowerCase().includes(S.search.toLowerCase()));return `<div class="eyebrow">LEARNING LIBRARY</div><h1 class="page-title">Understand every concept.</h1><p class="lead">Topic explanations, practical examples, common mistakes and key takeaways. This starter library covers each major area in your roadmap.</p><input class="search" placeholder="Search SQL, SCD, Spark, AWS..." value="${esc(S.search)}" oninput="S.search=this.value;render()"><div class="chips"><button class="chip ${S.filter==='All'?'active':''}" onclick="S.filter='All';render()">All topics</button>${C.modules.map(m=>`<button class="chip ${S.filter===m.title?'active':''}" onclick="S.filter='${esc(m.title)}';render()">${esc(m.title)}</button>`).join('')}</div><div class="list">${ls.map(l=>`<div class="card lesson"><div><h3>${esc(l.title)}</h3><p>${esc(l.module.title)} · ${esc(l.module.period)}</p>${P.done.includes(l.key)?'<span class="tag done">✓ Completed</span>':''}</div><button class="btn secondary" onclick="openLesson(${l.mi},${l.li})">Read lesson →</button></div>`).join('')||'<div class="empty">No lessons found. Try a different search.</div>'}</div>`}function lesson(){
  let m=C.modules[S.module],l=m.lessons[S.lesson],key=S.module+'-'+S.lesson;
  const expl = esc(l.explanation).replace(/\n/g,'<br>');
  const ex = esc(l.example);
  const take = esc(l.takeaway);
  return `<button class="btn secondary" onclick="go('learn')">← All lessons</button>
  <div class="eyebrow" style="margin-top:18px">${esc(m.title)} · ${esc(m.period)}</div>
  <h1 class="page-title">${esc(l.title)}</h1>
  <p class="lead">Dhyaan se padho, example inspect karo, ya <b>Listen</b> daba ke suno.</p>
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin:0 0 18px">
    <button id="speakBtn" class="btn" onclick="speakLesson()">🔊 Listen (Male)</button>
    <button class="btn secondary" onclick="stopSpeak()">Stop voice</button>
  </div>
  <div class="content">
    <h2>Concept explained</h2>
    <p style="line-height:1.7">${expl}</p>
    <h3>Example / pattern</h3>
    <pre class="code example-box">${ex}</pre>
    <h3>What to remember</h3>
    <div class="takeaway callout">${take}</div>
    <h3>Study check</h3>
    <ul>
      <li>Kya bina padhe concept explain kar sakte ho?</li>
      <li>Ek real pipeline / business use-case bata sakte ho?</li>
      <li>Ek failure mode ya trade-off identify kar sakte ho?</li>
    </ul>
  </div>
  <div class="grid" style="margin-top:20px">
    <div class="card s6">
      <h3>Lesson completion</h3>
      <p class="stat">${P.done.includes(key)?'✓ Marked complete':'Mark when you understand this lesson'}</p>
      <button class="btn" onclick="complete('${key}')">${P.done.includes(key)?'Completed':'Mark complete'}</button>
    </div>
    <div class="card s6">
      <h3>Navigate</h3>
      <div class="lesson-nav">
        ${S.lesson>0?`<button class="btn secondary" onclick="openLesson(${S.module},${S.lesson-1})">← Prev</button>`:''}
        ${S.lesson<m.lessons.length-1?`<button class="btn secondary" onclick="openLesson(${S.module},${S.lesson+1})">Next →</button>`:`<button class="btn secondary" onclick="go('learn')">Back to library</button>`}
        <button class="btn secondary" onclick="go('quiz')">Practice quiz</button>
      </div>
    </div>
  </div>`}

function startQuiz(){S.view='quiz';S.qi=0;S.choice=null;S.checked=false;S.score=0;render();syncNav()}function quiz(){if(S.qi>=C.quiz.length){let score=Math.round(S.score/C.quiz.length*100);P.attempts++;P.best=Math.max(P.best,score);save();return `<div class="card"><div class="eyebrow">ASSESSMENT COMPLETE</div><h1 class="page-title">${score}%</h1><p class="lead">You answered ${S.score} of ${C.quiz.length} questions correctly. Review the related topics and retake the assessment to improve.</p><div class="progress"><span style="width:${score}%"></span></div><button class="btn" onclick="startQuiz()">Retake quiz</button> <button class="btn secondary" onclick="go('learn')">Review lessons</button></div>`}let q=C.quiz[S.qi];return `<div class="eyebrow">MIXED KNOWLEDGE CHECK</div><h1 class="page-title">Quiz practice</h1><p class="lead">One question at a time. Answer first, then read the explanation and related topic.</p><div class="card"><div class="stat">QUESTION ${S.qi+1} OF ${C.quiz.length} · ${esc(q[4])}</div><div class="progress"><span style="width:${S.qi/C.quiz.length*100}%"></span></div><h2 style="font:700 19px Manrope">${esc(q[0])}</h2>${q[1].map((o,i)=>`<button class="quiz-option ${S.checked?(i===q[2]?'correct':i===S.choice?'wrong':''):S.choice===i?'selected':''}" ${S.checked?'disabled':''} onclick="choose(${i})">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join('')}${S.checked?`<div class="answer"><b>${S.choice===q[2]?'Correct!':'Not quite.'}</b> ${esc(q[3])}<p>Related topic: ${esc(q[4])}</p></div><button class="btn" style="margin-top:14px" onclick="nextQ()">${S.qi===C.quiz.length-1?'See result':'Next question →'}</button>`:`<button class="btn" style="margin-top:12px" onclick="check()" ${S.choice===null?'disabled':''}>Check answer</button>`}</div>`}function projects(){
  const plist = C.projects || [];
  const tasks = ['Architecture / data-flow diagram','Validation and error handling','README with setup and sample output','Results and evidence','Limitations and future improvements'];
  return `<div class="eyebrow">PORTFOLIO BUILDER</div>
  <h1 class="page-title">Project lab</h1>
  <p class="lead">Roadmap ke 4 project ideas. 2–3 polished projects with clear README, honest results aur explainable trade-offs aim karo. Har project pe checklist track karo.</p>
  <div class="grid">${plist.map((x,i)=>`
    <div class="card s6">
      <span class="tag">PROJECT ${i+1}</span>
      <h3>${esc(x.title)}</h3>
      <p><b>Stack:</b> ${esc(x.stack)}</p>
      <p><b>Shows:</b> ${esc(x.shows)}</p>
      <div class="section"><b>Suggested steps</b>
        <ol style="margin:8px 0 0 18px;padding:0;color:var(--muted);font-size:13px">${(x.steps||[]).map(s=>`<li style="margin-bottom:4px">${esc(s)}</li>`).join('')}</ol>
      </div>
      <div class="list" style="margin-top:12px">${tasks.map((t,j)=>`
        <label class="check"><input type="checkbox" ${P.projects[i+'-'+j]?'checked':''} onchange="projectToggle(${i},${j})"> ${esc(t)}</label>
      `).join('')}</div>
    </div>`).join('')}</div>
  <div class="section" style="margin-top:28px">
    <h2>Free / Low-cost resources</h2>
    <p class="lead">Roadmap se recommended resources — consistency se follow karo.</p>
    <div class="list">${(C.resources||[]).map(r=>`
      <div class="card"><b>${esc(r[0])}</b><p style="margin:6px 0 0;color:var(--muted)">${esc(r[1])}</p></div>
    `).join('')}</div>
  </div>`}

function interview(){return `<div class="eyebrow">INTERVIEW STUDIO</div><h1 class="page-title">Think like an engineer.</h1><p class="lead">Practice the focus areas in your roadmap: SQL, Python/Pandas, ETL, data modelling, PySpark, cloud and project deep-dives.</p><div class="list">${C.interview.map((q,i)=>`<details class="card"><summary>${i+1}. ${esc(q[0])}</summary><p>${esc(q[1])}</p></details>`).join('')}</div><div class="section"><div><h2>Before applying checklist</h2><p>Use this as a readiness check, not a guarantee of a job.</p></div></div><div class="card">${['Can solve medium-hard SQL questions','Comfortable with Python and Pandas','At least two documented GitHub projects','Basic understanding of one cloud platform','Can explain PySpark basics','One-page resume and updated LinkedIn','Can explain architecture and trade-offs for each project'].map((x,i)=>`<label class="check"><input type="checkbox" ${(P.job||[]).includes(i)?'checked':''} onchange="jobToggle(${i},this.checked)"> ${x}</label>`).join('')}</div>`}function notes(){return `<div class="eyebrow">PERSONAL KNOWLEDGE BASE</div><h1 class="page-title">My notes</h1><p class="lead">Notes save in this browser on this device. Add definitions, doubts, examples and interview answers.</p><div class="card"><label>Learning notes</label><textarea id="notes" class="note" placeholder="Example: Difference between ETL and ELT...">${esc(P.notes.text||'')}</textarea><div class="row"><button class="btn" onclick="saveNotes()">Save notes</button><button class="btn secondary" onclick="P.notes.text='';save();render()">Clear notes</button></div></div>`}function settings(){return `<div class="eyebrow">YOUR DATA</div><h1 class="page-title">Settings & backup</h1><p class="lead">Progress, notes, quiz scores and checklists are stored locally in this browser. Export a backup before clearing browser data or changing devices.</p><div class="grid"><div class="card s6"><h3>Export progress backup</h3><p class="stat">Download a JSON file containing local progress, notes and checklist state.</p><button class="btn" onclick="exportData()">Download backup</button></div><div class="card s6"><h3>Import backup</h3><p class="stat">Restore a previously exported DE Mastery backup.</p><input type="file" id="importFile" accept=".json,application/json"><button class="btn secondary" onclick="importData()">Import backup</button></div><div class="card s12"><h3>Reset progress</h3><p class="stat">This permanently clears this browser's DE Mastery progress and notes. Export first if needed.</p><button class="btn secondary" onclick="resetData()">Reset local progress</button></div></div><div class="callout">Offline installation requires the app to be served over HTTPS (or localhost) and opened once online. Progress is not automatically synced between phone and laptop; use backup export/import to transfer it.</div>`}function render(){let h='';switch(S.view){case'dashboard':h=dashboard();break;case'roadmap':h=roadmap();break;case'learn':h=learn();break;case'lesson':h=lesson();break;case'quiz':h=quiz();break;case'projects':h=projects();break;case'interview':h=interview();break;case'notes':h=notes();break;case'settings':h=settings();break;default:h=dashboard()}$('#main').innerHTML=h;$('#main').focus({preventScroll:true});syncNav()}function complete(k){if(!P.done.includes(k))P.done.push(k);save();toast('Lesson progress saved');render()}function weekToggle(w,on){P.weeks=on?[...new Set([...P.weeks,w])]:P.weeks.filter(x=>x!==w);save();render()}function choose(i){if(!S.checked){S.choice=i;render()}}function check(){if(S.choice===null)return;S.checked=true;if(S.choice===C.quiz[S.qi][2])S.score++;render()}function nextQ(){S.qi++;S.choice=null;S.checked=false;render()}function projectToggle(i,j,on){P.projects[i]=P.projects[i]||[];P.projects[i]=on?[...new Set([...P.projects[i],j])]:P.projects[i].filter(x=>x!==j);save()}function jobToggle(i,on){P.job=P.job||[];P.job=on?[...new Set([...P.job,i])]:P.job.filter(x=>x!==i);save()}function saveNotes(){P.notes.text=$('#notes').value;save();toast('Notes saved on this device')}function exportData(){let b=new Blob([JSON.stringify(P,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='de-mastery-backup.json';a.click();URL.revokeObjectURL(a.href)}function importData(){let f=$('#importFile').files[0];if(!f){toast('Choose a backup JSON first');return}let r=new FileReader();r.onload=()=>{try{let d=JSON.parse(r.result);if(!d||!Array.isArray(d.done))throw Error();P={...P,...d};save();toast('Backup restored');render()}catch(e){toast('Invalid DE Mastery backup file')}};r.readAsText(f)}function resetData(){if(confirm('Reset all DE Mastery progress and notes in this browser?')){localStorage.removeItem('deMasteryPro');P=load();render();toast('Local progress reset')}}function toggleTheme(){P.theme=P.theme==='light'?'dark':'light';document.body.classList.toggle('light',P.theme==='light');save()}function navigate(v){go(v)}document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view)));window.go=go;window.openLesson=openLesson;window.startQuiz=startQuiz;window.choose=choose;window.check=check;window.nextQ=nextQ;window.complete=complete;window.weekToggle=weekToggle;window.projectToggle=projectToggle;window.jobToggle=jobToggle;window.saveNotes=saveNotes;window.exportData=exportData;window.importData=importData;window.resetData=resetData;window.toggleTheme=toggleTheme;if(P.theme==='light')document.body.classList.add('light');if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));let deferred=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('#install').classList.remove('hidden')});$('#install').addEventListener('click',async()=>{if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;$('#install').classList.add('hidden')}});window.addEventListener('online',()=>$('#status').textContent='● Online');window.addEventListener('offline',()=>$('#status').textContent='● Offline-ready');render();