/* Pipeline landing page for the connected design prototype. */
(function(){
  'use strict';
  const demo=window.LTPPDemo,$=id=>document.getElementById(id),day=86400000;
  const iso=t=>new Date(t).toISOString().slice(0,10),format=t=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(t));
  const parse=s=>Date.parse(s+'T00:00:00Z'),finish=p=>p.kind==='milestone'?p.s:p.e-3*day;
  const monthLabel=t=>new Intl.DateTimeFormat('en-GB',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(t));
  let plans,source,geometry=null,resizeFrame=0,findingsFilter='all';
  const params=new URLSearchParams(location.search),focusId=params.get('focus');
  function resetDemo(){
    if(!window.confirm('Reset all local demo procurements, phases, templates and saved pipelines to the fictional examples?'))return;
    try{demo.reset();demo.go('pipeline.html');}catch(e){demo.error(e.message);}
  }
  $('reset-demo').addEventListener('click',resetDemo);
  let retainedWork=false;
  try{
    let seen=false;
    try{seen=sessionStorage.getItem('ltpp-pipeline-session')==='open';}catch{}
    const resume=params.get('view')==='resume'||params.get('view')==='live'||params.has('notice')||params.has('focus')||seen;
    source=demo.preparePipelineEntry(resume);plans=source.plans;
    retainedWork=!resume&&source.dirty;
    try{sessionStorage.setItem('ltpp-pipeline-session','open');}catch{}
  }catch(e){demo.error(e.message);return;}
  const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
  const href=plan=>source.readOnly?'versions-and-baselines.html#view='+encodeURIComponent(source.record.id):'edit-procurement.html?id='+encodeURIComponent(plan.id);
  let sharedRules=source.rules;
  const collectFindings=()=>plans.flatMap((plan,index)=>demo.findClashes(plan,plans.slice(index+1),sharedRules).map(clash=>({...clash,plan})))
    .sort((a,b)=>Number(b.rule.severity==='critical')-Number(a.rule.severity==='critical')||a.start-b.start||a.plan.name.localeCompare(b.plan.name));
  let findings=collectFindings();
  const severityName=rule=>rule.severity==='critical'?'Critical clash':'Warning';
  const activeWeeks=days=>days/7+' active week'+(days===7?'':'s');
  const spanFinish=span=>new Date(span.e).getUTCDay()===1&&span.e-3*day>=span.s?span.e-3*day:span.e;
  const overlapDates=finding=>finding.spans.map(span=>format(span.s)+' to '+format(spanFinish(span))).join('; ');
  function compactOverlapDates(finding){
    return finding.spans.map(span=>{
      const first=new Date(span.s),last=new Date(spanFinish(span)),sameYear=first.getUTCFullYear()===last.getUTCFullYear(),sameMonth=sameYear&&first.getUTCMonth()===last.getUTCMonth();
      const firstFormat=new Intl.DateTimeFormat('en-GB',{day:'numeric',...(!sameMonth?{month:'short'}:{}),...(!sameYear?{year:'numeric'}:{}),timeZone:'UTC'});
      return firstFormat.format(first)+' to '+format(last);
    }).join('; ');
  }
  const findingsFilters=[{value:'all',label:'All'},{value:'critical',label:'Critical clashes'},{value:'warning',label:'Warnings'}];
  function findingsFor(plan){
    return findings.flatMap(finding=>finding.plan.id===plan.id?[{finding,phase:finding.item,otherPlan:finding.other,otherPhase:finding.target}]:finding.other.id===plan.id?[{finding,phase:finding.target,otherPlan:finding.plan,otherPhase:finding.item}]:[]);
  }
  function renderFindings(){
    const critical=findings.filter(finding=>finding.rule.severity==='critical').length,warnings=findings.length-critical;
    $('pipeline-critical-count').textContent=critical+' critical clash'+(critical===1?'':'es');
    $('pipeline-warning-count').textContent=warnings+' warning'+(warnings===1?'':'s');
    findingsFilters.forEach(filter=>{const button=$('findings-filter-'+filter.value),count=filter.value==='all'?findings.length:filter.value==='critical'?critical:warnings;button.textContent=filter.label+' ('+count+')';button.setAttribute('aria-pressed',String(findingsFilter===filter.value));});
    const visible=findings.filter(finding=>findingsFilter==='all'||finding.rule.severity===findingsFilter);
    $('pipeline-findings').replaceChildren();$('pipeline-findings-empty').hidden=visible.length>0;$('pipeline-findings').hidden=!visible.length;
    $('pipeline-findings-empty').textContent=!findings.length?'No warnings or critical clashes found against the shared Library rules.':findingsFilter==='critical'?'No critical clashes found. Select All to see the other findings.':'No warnings found. Select All to see the other findings.';
    $('findings-filter-status').textContent='Showing '+visible.length+' of '+findings.length+' findings. Filter: '+findingsFilters.find(filter=>filter.value===findingsFilter).label+'.';
    const grid=node('ul',undefined,'findings-grid');grid.setAttribute('role','list');grid.setAttribute('aria-label','Pipeline overlap findings');
    visible.forEach(finding=>{
        const severity=finding.rule.severity;
        const card=node('li',undefined,'pipeline-finding finding-card'+(severity==='critical'?' critical':' warning'));
        card.append(node('span',severityName(finding.rule),'severity-badge'+(severity==='critical'?' critical':'')));
        const samePhase=finding.item.name===finding.target.name;
        card.append(node('h3',(samePhase?'Phase: ':'Phases: ')+(samePhase?finding.item.name:finding.item.name+' / '+finding.target.name),'finding-phase'),node('p','Procurements:','finding-field-label'));
        const participants=node('ul',undefined,'finding-participants');
        for(const [plan,phase]of[[finding.plan,finding.item],[finding.other,finding.target]]){
          const participant=node('li',undefined,'finding-participant'),link=node('a',plan.name);link.href=href(plan);link.setAttribute('aria-label',(source.readOnly?'View details for ':'Edit ')+plan.name);
          participant.append(link);if(!samePhase)participant.append(node('small','Phase: '+phase.name));participants.append(participant);
        }
        const overlap=node('div',undefined,'finding-overlap'),dates=node('p');dates.append(node('strong','Overlap: '),node('span',compactOverlapDates(finding)));
        overlap.append(dates,node('p',activeWeeks(finding.days),'finding-duration'));card.append(participants,overlap);grid.append(card);
    });
    $('pipeline-findings').append(grid);
  }
  findingsFilters.forEach(filter=>$('findings-filter-'+filter.value).addEventListener('click',()=>{findingsFilter=filter.value;renderFindings();}));
  function addMonths(time,amount){const d=new Date(time),date=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+amount);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(date,last));return d.getTime();}
  function hideTip(){window.LTPPTooltips.hide();}
  function bindTip(button,plan,lines){window.LTPPTooltips.bind(button,plan.name,lines);}
  function durationSummary(p,schedule){
    const overlaps=schedule.filter(other=>other.id!==p.id&&other.kind!=='milestone').map(other=>({name:other.name,weeks:demo.activeDays(Math.max(p.s,other.s),Math.min(p.e,other.e))/7})).filter(o=>o.weeks>0);
    let line=p.weeks+' active weeks';
    if(overlaps.length===1)line+='; '+overlaps[0].weeks+' of which overlap with '+overlaps[0].name;
    else if(overlaps.length>1)line+='; overlaps with '+overlaps.map(o=>o.name+' ('+o.weeks+' active weeks)').join(' and ');
    if(demo.activeDays(p.s,p.e)<(p.e-p.s)/day)line+='; Christmas and New Year weeks are skipped';
    return line+'.';
  }
  function renderTable(){
    $('pipeline-rows').replaceChildren();$('procurement-count').textContent='('+plans.length+')';$('pipeline-empty').hidden=plans.length>0;
    plans.forEach(plan=>{
      const row=node('tr'),name=node('td'),link=node('a',plan.name);link.href=href(plan);
      if(plan.id===focusId){row.className='selected';link.id='returned-procurement';}
      name.append(link,node('small',plan.phases.filter(p=>p.kind==='phase').length+' phases'));row.append(name,node('td',format(Math.min(...plan.phases.map(p=>p.s)))),node('td',format(Math.max(...plan.phases.map(finish)))));
      const anchor=node('td',format(plan.anchor));anchor.append(node('small',plan.anchorName));row.append(anchor);
      const action=node('td'),edit=node('a',source.readOnly?'View details':'Edit','btn');edit.href=href(plan);edit.setAttribute('aria-label',(source.readOnly?'View details for ':'Edit ')+plan.name);action.append(edit);row.append(action);$('pipeline-rows').append(row);
    });
  }
  function draw(){
    hideTip();const canvas=$('pipeline-canvas'),scroller=$('pipeline-scroll');canvas.replaceChildren();
    if(!plans.length){canvas.append(node('p','Add a procurement to view its schedule here.','empty'));return;}
    const all=plans.flatMap(p=>p.phases),min=Math.min(...all.map(p=>p.s)),max=Math.max(...all.map(p=>p.e)),view=$('pipeline-window').value;
    let requested=parse($('pipeline-start').value);if(!Number.isFinite(requested))requested=min;
    const full=view==='all';if(full)requested=min;
    const duration=full?max-min+14*day:addMonths(requested,Number(view))-requested;
    const start=demo.monday(Math.min(min-7*day,requested)),end=Math.max(max+7*day,requested+duration);
    const labelWidth=innerWidth<700?190:250,available=Math.max(250,scroller.clientWidth-labelWidth),axisWidth=full?available:Math.max(available,Math.ceil((end-start)/duration*available)),pixelsPerDay=axisWidth/((end-start)/day);
    canvas.style.width=(labelWidth+axisWidth)+'px';canvas.style.setProperty('--week-width',(pixelsPerDay*7)+'px');
    geometry={start,end,pixelsPerDay,labelWidth};
    const percent=t=>(t-start)/(end-start)*100;
    const rulerRow=node('div',undefined,'timeline-row timeline-ruler-row'),heading=node('div','Procurement','timeline-label'),ruler=node('div',undefined,'ruler');
    const month=new Date(start);month.setUTCDate(1);if(month.getTime()<start)month.setUTCMonth(month.getUTCMonth()+1);
    let lastLabel=-Infinity;
    for(let t=month.getTime();t<end;){const x=percent(t)/100*axisWidth;if(x-lastLabel>90){const tick=node('span',monthLabel(t),'tick');tick.style.left=percent(t)+'%';ruler.append(tick);lastLabel=x;}month.setUTCMonth(month.getUTCMonth()+1);t=month.getTime();}
    rulerRow.append(heading,ruler);canvas.append(rulerRow);
    plans.forEach(plan=>{
      const row=node('div',undefined,'timeline-row'+(plan.id===focusId?' selected':'')),label=node('div',undefined,'timeline-label'),link=node('a',plan.name),track=node('div',undefined,'track');link.href=href(plan);label.append(link,node('small',plan.anchorName+': '+format(plan.anchor)));
      const rowFindings=findingsFor(plan);
      // Clash outlines have their own dates and must not split phase bars.
      const boundaries=new Set([start,end]);plan.phases.forEach(p=>{boundaries.add(p.s);boundaries.add(p.e);});
      for(let year=new Date(start).getUTCFullYear()-1;year<=new Date(end).getUTCFullYear();year++){
        const pause=demo.monday(Date.UTC(year,11,25));for(const t of[pause,pause+14*day])if(t>start&&t<end)boundaries.add(t);
        if(pause<end&&pause+14*day>start){const shade=node('span',undefined,'shutdown');shade.style.left=percent(Math.max(start,pause))+'%';shade.style.width=(percent(Math.min(end,pause+14*day))-percent(Math.max(start,pause)))+'%';shade.setAttribute('aria-hidden','true');track.append(shade);}
      }
      const bounds=[...boundaries].sort((a,b)=>a-b),first=Math.min(...plan.phases.map(p=>p.s)),last=Math.max(...plan.phases.map(p=>p.e));
      for(let i=0;i<bounds.length-1;i++){
        const a=bounds[i],b=bounds[i+1];if(a<first||b>last||a<start||b>end)continue;
        const active=plan.phases.filter(p=>p.kind!=='milestone'&&p.s<b&&p.e>a),gap=!active.length,pause=!gap&&demo.paused(a);
        const button=node('button',gap?'Pipeline adjustment gap':active.map(p=>p.name).join(' + '),'segment'+(gap?' gap':'')+(pause?' paused':''));button.type='button';button.style.left=percent(a)+'%';button.style.width=(percent(b)-percent(a))+'%';
        if(!gap)button.style.background=active.length===1?active[0].color:'linear-gradient(to bottom right,'+active[0].color+' 50%,'+active[1].color+' 50%)';
        let lines;
        if(gap)lines=['Pipeline adjustment gap',format(a)+' → '+format(b),'No activity scheduled.'];
        else if(pause)lines=[active.map(p=>p.name).join(' + '),'Christmas and New Year pause: '+format(a)+' → '+format(b-day)];
        else if(active.length>1)lines=[active.map(p=>p.name).join(' + '),'Overlap: '+format(a)+' → '+format(b-3*day),demo.activeDays(a,b)/7+' active weeks.'];
        else lines=[active[0].name,'Planning dates: '+format(active[0].s)+' → '+format(finish(active[0])),durationSummary(active[0],plan.phases)];
        if(!gap&&!pause)rowFindings.filter(({phase})=>active.some(item=>item.id===phase.id)).forEach(({finding,phase,otherPlan,otherPhase})=>{
          lines.push(severityName(finding.rule)+': '+phase.name+' overlaps with '+otherPhase.name+' in '+otherPlan.name+'. Overlap: '+overlapDates(finding)+' ('+activeWeeks(finding.days)+').');
        });
        bindTip(button,plan,lines);track.append(button);
      }
      plan.phases.filter(p=>p.kind==='milestone').forEach(p=>{const marker=node('button',undefined,'marker');marker.type='button';marker.style.left=percent(p.s)+'%';bindTip(marker,plan,p.id===plan.anchorId?[p.name,'Actual anchor date: '+format(plan.anchor),'Planning milestone: '+format(plan.planningAnchor)]:[p.name,format(p.s)]);track.append(marker);});
      // Both affected rows show only active portions of the overlap.
      rowFindings.forEach(({finding})=>finding.spans.forEach(span=>{
        const a=Math.max(start,span.s),b=Math.min(end,span.e);if(b<=a)return;
        const outline=node('span',undefined,'clash-outline'+(finding.rule.severity==='critical'?' critical':''));
        outline.style.left=percent(a)+'%';outline.style.width=(percent(b)-percent(a))+'%';outline.setAttribute('aria-hidden','true');track.append(outline);
      }));
      row.append(label,track);canvas.append(row);
    });
    $('pipeline-start').disabled=full;$('previous-window').disabled=full;$('next-window').disabled=full;
    scroller.scrollLeft=full?0:Math.max(0,(requested-start)/day*pixelsPerDay);
  }
  const focused=plans.find(p=>p.id===focusId);
  const start=focused?Math.min(...focused.phases.map(p=>p.s)):plans.length?Math.min(...plans.flatMap(p=>p.phases.map(p=>p.s))):demo.monday(Date.now());
  $('pipeline-start').value=iso(start);
  $('pipeline-window').addEventListener('change',draw);$('pipeline-start').addEventListener('change',draw);
  for(const [id,direction]of[['previous-window',-1],['next-window',1]])$(id).addEventListener('click',()=>{$('pipeline-start').value=iso(addMonths(parse($('pipeline-start').value),direction*Number($('pipeline-window').value)));draw();});
  $('pipeline-scroll').addEventListener('scroll',()=>{hideTip();if(geometry&&$('pipeline-window').value!=='all')$('pipeline-start').value=iso(geometry.start+Math.round($('pipeline-scroll').scrollLeft/geometry.pixelsPerDay)*day);});
  const notice=params.get('notice');
  if(retainedWork){$('pipeline-message').hidden=false;$('pipeline-message').textContent='Your unsaved changes have been kept. Save them, or choose View live pipeline to return to the live plan.';}
  if(notice==='baseline'){$('pipeline-message').hidden=false;$('pipeline-message').textContent='This baseline is read-only. Choose Edit this pipeline to make changes under a new name.';}
  if(notice==='added'||notice==='updated'){$('pipeline-message').hidden=false;$('pipeline-message').textContent=notice==='added'?'Procurement added to the open pipeline. Use Save to keep it in the named pipeline.':'Procurement changes applied to the open pipeline. Use Save to update the named pipeline. The current baseline has not been replaced.';}
  document.addEventListener('keydown',event=>{if(event.key==='Escape')hideTip();});window.addEventListener('scroll',hideTip,true);
  window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(draw);});
  document.addEventListener('ltpp:pipeline-updated',event=>{
    window.LTPPTooltips.closeWithin($('pipeline-canvas'));
    source=demo.pipelineSource();plans=source.plans;sharedRules=source.rules;findings=collectFindings();renderFindings();renderTable();draw();
    if(event.detail?.silent)return;
    $('pipeline-message').hidden=false;
    const count=event.detail?.count||0;
    $('pipeline-message').textContent='Adjustments applied to '+count+' procurement'+(count===1?'':'s')+'. Use Save to update the named pipeline. The current baseline has not been replaced.';
  });
  demo.guard(()=>false);renderFindings();renderTable();draw();
  if(focusId)$('returned-procurement')?.focus({preventScroll:true});
})();
