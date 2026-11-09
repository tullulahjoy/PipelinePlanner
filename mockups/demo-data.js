/* Shared, browser-local data for the connected design prototype. */
(function () {
  'use strict';
  const key='ltpp-connected-mockups-v1',day=86400000;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const typeSeed=[
    ['engagement','Market engagement',2,'#476b8d'],['eoi','Launch and EOI',2,'#536ea1'],
    ['dialogue','Dialogue with bidders',4,'#6a62a2'],['bid-writing','Bid writing',6,'#5077a0'],
    ['evaluation','Evaluation',6,'#315ed4'],['moderation','Moderation',6,'#bc4c16'],
    ['governance','Governance',20,'#7658a7'],['award','Contract award',2,'#7658a7'],
    ['offsite','Off-site mobilisation',26,'#17766e'],['onsite','On-site mobilisation',78,'#34654c']
  ];
  let nextType=0,nextItem=0,nextTemplate=3,nextRule=0;
  let types=typeSeed.map(([id,name,weeks,color])=>({id,name,weeks,color,rules:[]}));
  let sharedRules=[
    {id:'sample-evaluation',sourceId:'evaluation',kind:'same',target:'evaluation',severity:'warning',reason:''},
    {id:'sample-moderation',sourceId:'moderation',kind:'same',target:'moderation',severity:'critical',reason:''}
  ];
  const typeName=id=>types.find(t=>t.id===id)?.name||'Unknown phase';
  function rulesForType(type){
    return sharedRules.flatMap(rule=>{
    const common={id:rule.id,sharedId:rule.id,severity:rule.severity,reason:rule.reason||''};
    if(rule.sourceId===type.id)return [{...common,kind:rule.kind,target:rule.target}];
    if(rule.kind==='type'&&rule.target===type.id)return [{...common,kind:'type',target:rule.sourceId}];
    return [];
    });
  }
  function refreshSharedRuleViews(){types.forEach(type=>type.rules=rulesForType(type));}
  refreshSharedRuleViews();
  function occurrence(typeId){const source=types.find(t=>t.id===typeId);return {id:`item-${++nextItem}`,kind:'phase',typeId,label:source.name,weeks:source.weeks,libraryDefaultWeeks:source.weeks,librarySourceName:source.name,color:source.color,libraryDefaultColor:source.color,relation:'sequence',amount:0};}
  function milestone(label){return {id:`item-${++nextItem}`,kind:'milestone',typeId:'',label,weeks:0,color:'#536ea1',rules:[],relation:'sequence',amount:0};}
  function serviceItems(){const items=[occurrence('engagement'),occurrence('eoi'),occurrence('dialogue'),milestone('Final procurement documents issued'),occurrence('bid-writing'),milestone('Bids submitted'),occurrence('evaluation'),occurrence('moderation'),occurrence('governance'),occurrence('award'),occurrence('offsite'),milestone('Service responsibility transfers'),occurrence('onsite')];items[7].relation='overlap';items[7].amount=2;return items;}
  const service=serviceItems(),short=[occurrence('eoi'),occurrence('evaluation'),occurrence('moderation'),occurrence('award'),milestone('Contract awarded')];
  short[1].weeks=2;short[2].weeks=1;
  const complex=serviceItems();
  const offsitePlanning=occurrence('offsite'),onsiteConsolidation=occurrence('onsite');
  offsitePlanning.label='Mobilisation planning';offsitePlanning.weeks=8;complex[10].label='Off-site implementation';complex[10].weeks=18;complex.splice(10,0,offsitePlanning);
  const onsiteTransition=complex.find(item=>item.typeId==='onsite');onsiteTransition.label='On-site transition';onsiteTransition.weeks=26;onsiteConsolidation.label='On-site consolidation';onsiteConsolidation.weeks=52;complex.push(onsiteConsolidation);
  let templates=[
    {id:'template-1',name:'Service transfer',description:'Procurement leading to replacement service delivery.',items:service,anchorId:service.find(item=>item.kind==='milestone'&&item.label==='Service responsibility transfers').id},
    {id:'template-2',name:'Short procurement',description:'A shorter route ending at contract award.',items:short,anchorId:short[4].id},
    {id:'template-3',name:'Complex mobilisation',description:'Multiple mobilisation stages before and after service transfer.',items:complex,anchorId:complex.find(item=>item.kind==='milestone'&&item.label==='Service responsibility transfers').id}
  ];

  const monday=time=>time-((new Date(time).getUTCDay()+6)%7)*day;
  function paused(time){
    const year=new Date(time).getUTCFullYear();
    return [year-1,year].some(y=>{const start=monday(Date.UTC(y,11,25));return time>=start&&time<start+14*day;});
  }
  function move(time,days){
    let cursor=time,left=Math.abs(days),direction=Math.sign(days),guard=0;
    while(left>0){
      if(++guard>20000)throw new Error('Please keep this demo schedule within 50 years.');
      if(direction<0)cursor-=day;if(!paused(cursor))left--;if(direction>0)cursor+=day;
    }
    return cursor;
  }
  function activeDays(start,end){let count=0;for(let t=start;t<end;t+=day)if(!paused(t))count++;return count;}
  function activeSpans(start,end){
    const spans=[];let span=null;
    for(let t=start;t<end;t+=day){
      if(paused(t)){span=null;continue;}
      if(!span){span={s:t,e:Math.min(t+day,end)};spans.push(span);}
      else span.e=Math.min(t+day,end);
    }
    return spans;
  }
  // Used by Pipeline and Edit Procurement so shared rules produce the same findings.
  function findClashes(plan,others,rules=library().sharedRules){
    const clashes=[];
    for(const other of others){
      if(other.id===plan.id)continue;
      for(const target of other.phases)for(const item of plan.phases){
        if(item.kind==='milestone'||target.kind==='milestone'||!item.libraryPhaseId||!target.libraryPhaseId)continue;
        const rule=rules.find(rule=>{
          const a=rule.a??rule.sourceId,b=rule.b??(rule.kind==='same'?rule.sourceId:rule.target);
          return a===item.libraryPhaseId&&b===target.libraryPhaseId||b===item.libraryPhaseId&&a===target.libraryPhaseId;
        });
        if(!rule)continue;
        const start=Math.max(item.s,target.s),end=Math.min(item.e,target.e);
        if(end<=start)continue;
        const spans=activeSpans(start,end),days=spans.reduce((total,span)=>total+(span.e-span.s)/day,0);
        if(days)clashes.push({rule,item,target,other,start,end,days,spans});
      }
    }
    return clashes;
  }
  function fromTemplate(template,name,anchor,id){
    const phases=template.items.map((item,index)=>{
      const source=types.find(t=>t.id===item.typeId);
      return {id:index+1,name:item.label,kind:item.kind,weeks:item.weeks,
        offset:item.relation==='overlap'?-item.amount:item.relation==='gap'?item.amount:0,
        libraryPhaseId:item.typeId||'',color:item.color,weekly:true,
        ...(source?{sourceName:source.name,libraryDefaultWeeks:source.weeks,initialWeeks:item.weeks,fromTemplate:true}:{})};
    });
    const index=template.items.findIndex(item=>item.id===template.anchorId),planningAnchor=monday(anchor);
    phases[index].s=planningAnchor;phases[index].e=planningAnchor;
    for(let i=index-1;i>=0;i--){phases[i].e=move(phases[i+1].s,-phases[i+1].offset*7);phases[i].s=move(phases[i].e,-phases[i].weeks*7);}
    for(let i=index+1;i<phases.length;i++){phases[i].s=move(phases[i-1].e,phases[i].offset*7);phases[i].e=move(phases[i].s,phases[i].weeks*7);}
    return {id,name,anchor,planningAnchor,anchorName:phases[index].name,anchorId:phases[index].id,phases};
  }
  function seed(){
    const plans=[
      fromTemplate(templates[0],'Community services procurement',Date.UTC(2031,0,20),'community-services'),
      fromTemplate(templates[0],'Digital services procurement',Date.UTC(2031,1,3),'digital-services'),
      fromTemplate(templates[1],'Facilities support procurement',Date.UTC(2030,2,18),'facilities-support')
    ];
    plans.forEach(plan=>plan.approvedBaseline=clone({anchor:plan.anchor,phases:plan.phases}));
    const makeRecord=(id,number,name,status,schedule,savedAt,note,confirmation)=>({
      id,number,name,status,revision:1,note,savedAt,savedBy:'Alex Morgan',savedById:'demo-editor-alex',
      plans:clone(schedule),rules:clone(sharedRules),...(confirmation?{confirmation}: {})
    });
    const firstConfirmation={at:'2026-09-04T11:00:00Z',by:'Alex Morgan',byId:'demo-editor-alex',rationale:'First recorded pipeline.'};
    const currentConfirmation={at:'2026-10-15T14:00:00Z',by:'Alex Morgan',byId:'demo-editor-alex',fromBaselineId:'v01',rationale:'Facilities support added to the pipeline.'};
    const later={...fromTemplate(templates[0],plans[0].name,Date.UTC(2031,1,17),plans[0].id),approvedBaseline:clone(plans[0].approvedBaseline)};
    const earlier={...fromTemplate(templates[0],plans[0].name,Date.UTC(2031,0,6),plans[0].id),approvedBaseline:clone(plans[0].approvedBaseline)};
    const savedVersions=[
      makeRecord('v01',1,'Initial pipeline','previous',plans.slice(0,2),'2026-09-02T09:00:00Z','Initial planning reference.',firstConfirmation),
      makeRecord('v02',2,'Autumn pipeline','current',plans,'2026-10-12T10:30:00Z','Facilities support included.',currentConfirmation),
      makeRecord('v03',3,'Later service transfer','saved',[later,...plans.slice(1)],'2026-10-23T14:10:00Z','Explore a later service transfer.'),
      makeRecord('v04',4,'Earlier service transfer','saved',[earlier,...plans.slice(1)],'2026-10-29T11:20:00Z','Explore an earlier service transfer.')
    ];
    return {version:3,library:{types,sharedRules,templates},plans,savedVersions,
      openPipeline:{id:'v02',token:'initial-pipeline',revision:1,mode:'baseline'},baselineWorkflow:{currentId:'v02',events:[
        {id:'baseline-event-v01',type:'confirmed',versionId:'v01',previousBaselineId:null,...firstConfirmation},
        {id:'baseline-event-v02',type:'confirmed',versionId:'v02',previousBaselineId:'v01',...currentConfirmation}
      ]}};
  }
  let cache;
  function read(fresh=false){
    if(fresh)cache=undefined;
    if(cache)return clone(cache);
    try{
      const raw=localStorage.getItem(key);
      if(raw){
        const parsed=JSON.parse(raw);
        // The prototype reset is intentional; old mockup records are not migrated.
        if(parsed.version===1||parsed.version===2)return write(seed());
        if(parsed.version!==3||!Array.isArray(parsed.plans)||!parsed.library||!parsed.openPipeline||typeof parsed.openPipeline.token!=='string'||
           !Array.isArray(parsed.library.types)||!Array.isArray(parsed.library.sharedRules)||!Array.isArray(parsed.library.templates)||
           (parsed.savedVersions!==undefined&&!Array.isArray(parsed.savedVersions))||
           (parsed.baselineWorkflow!==undefined&&(!parsed.baselineWorkflow||typeof parsed.baselineWorkflow.currentId!=='string'||!Array.isArray(parsed.baselineWorkflow.events))))
          throw new Error('The local demo data could not be read. Use Reset demo on Pipeline to restore the examples.');
        cache=parsed;
      }else cache=seed();
    }catch(error){if(error.name==='SecurityError')throw new Error('Browser storage is unavailable. Open these mockups through the project’s local web server and allow local storage.');throw error;}
    return clone(cache);
  }
  function write(data){
    try{localStorage.setItem(key,JSON.stringify(data));}
    catch(error){throw new Error('The demo could not be saved in this browser. Check that local storage is allowed and open the mockups through the project’s local web server.');}
    cache=clone(data);return clone(data);
  }
  function library(){return read().library;}
  function saveLibrary(next){
    const data=read(true),previousColours=new Map(data.library.types.map(phase=>[phase.id,phase.color]));
    const changedColours=new Map(next.types.filter(phase=>previousColours.get(phase.id)!==phase.color).map(phase=>[phase.id,phase.color]));
    data.library=clone(next);
    // A Library colour is shared by every linked occurrence, independently of
    // optional template name/duration updates. Save everything in one write.
    data.library.templates.forEach(template=>template.items.forEach(item=>{
      if(item.kind==='phase'&&changedColours.has(item.typeId)){
        item.color=changedColours.get(item.typeId);item.libraryDefaultColor=item.color;
      }
    }));
    if(data.openPipeline.mode!=='baseline')data.plans.forEach(plan=>plan.phases.forEach(item=>{
      if(item.kind==='phase'&&changedColours.has(item.libraryPhaseId))item.color=changedColours.get(item.libraryPhaseId);
    }));
    return write(data).library;
  }
  function saveProcLibrary(phases,rules){
    const current=library();
    saveLibrary({...current,types:phases.map(p=>({...p,rules:[]})),sharedRules:rules.map(rule=>({
      id:rule.id,sourceId:rule.a,kind:rule.a===rule.b?'same':'type',target:rule.b,severity:rule.severity,reason:rule.reason||''
    }))});
  }
  function validatePlan(plan){
    if(!plan.name?.trim()||!Number.isFinite(plan.anchor)||!Number.isFinite(plan.planningAnchor)||!plan.phases?.length)throw new Error('Preview a complete procurement before saving.');
    if(!plan.phases.some(p=>p.id===plan.anchorId&&p.kind==='milestone'))throw new Error('Choose an anchor milestone before saving.');
    const ids=new Set();
    for(const p of plan.phases){
      if(ids.has(p.id)||!Number.isInteger(p.id))throw new Error('The schedule has an invalid row identifier.');
      ids.add(p.id);
      if(!p.name?.trim()||!Number.isFinite(p.s)||!Number.isFinite(p.e)||p.e<p.s||
         !Number.isInteger(p.weeks)||(p.kind==='phase'&&p.weeks<1)||(p.kind==='milestone'&&p.weeks!==0))throw new Error('Check each phase’s name, duration and dates before saving.');
    }
  }
  function addPlan(plan){
    validatePlan(plan);const data=read(true);assertEditableContext(data);
    const saved={...clone(plan),id:'procurement-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)),approvedBaseline:null};
    data.plans.push(saved);write(data);return clone(saved);
  }
  function updatePlan(id,plan,expectedPlan){
    validatePlan(plan);const data=read(true),index=data.plans.findIndex(p=>p.id===id);
    assertEditableContext(data);
    if(index<0)throw new Error('This procurement no longer exists. Return to Pipeline.');
    if(expectedPlan&&JSON.stringify(data.plans[index])!==JSON.stringify(expectedPlan))throw new Error('This procurement changed in another page. Return to Pipeline and reopen it before saving.');
    data.plans[index]={...data.plans[index],...clone(plan),id,approvedBaseline:data.plans[index].approvedBaseline};
    write(data);return clone(data.plans[index]);
  }
  // Commit a reviewed pipeline in one storage write. Unrelated data and approved
  // baselines are retained, including null baselines on newly added procurements.
  function updatePlans(changed,expectedPlans,expectedRules,reason=''){
    const data=read(true);
    assertEditableContext(data);
    if(JSON.stringify(data.plans)!==JSON.stringify(expectedPlans)||JSON.stringify(data.library.sharedRules)!==JSON.stringify(expectedRules))
      throw new Error('The pipeline or its overlap rules changed in another page. Cancel adjustment mode and reopen it to review the latest plan.');
    const seen=new Set(),changes=[];
    for(const plan of changed){
      validatePlan(plan);
      if(seen.has(plan.id))throw new Error('A procurement appears more than once in this adjustment.');
      seen.add(plan.id);
      const index=data.plans.findIndex(item=>item.id===plan.id);
      if(index<0)throw new Error('A procurement no longer exists. Reopen adjustment mode from Pipeline.');
      const before=data.plans[index];
      changes.push({id:plan.id,name:plan.name,beforeAnchor:before.anchor,afterAnchor:plan.anchor,
        phases:plan.phases.flatMap(phase=>{const previous=before.phases.find(item=>item.id===phase.id);
          return previous&&previous.s===phase.s&&previous.e===phase.e&&previous.weeks===phase.weeks&&previous.offset===phase.offset?[]:
            [{id:phase.id,name:phase.name,before:previous?{s:previous.s,e:previous.e,weeks:previous.weeks,offset:previous.offset}:null,after:{s:phase.s,e:phase.e,weeks:phase.weeks,offset:phase.offset}}];})});
      data.plans[index]={...before,...clone(plan),id:before.id,approvedBaseline:before.approvedBaseline};
    }
    if(!changed.length)return clone(data.plans);
    const critical=data.plans.some((plan,index)=>findClashes(plan,data.plans.slice(index+1),data.library.sharedRules).some(clash=>clash.rule.severity==='critical'));
    if(critical&&!reason.trim())throw new Error('Record a reason for proceeding with the remaining critical clashes.');
    data.adjustmentHistory=[...(data.adjustmentHistory||[]),{at:new Date().toISOString(),reason:reason.trim(),changes}];
    write(data);return clone(data.plans);
  }
  const demoEditor={id:'demo-editor-alex',name:'Alex Morgan'};
  function savedVersions(){return read(true).savedVersions||[];}
  function makeSavedVersion(data,name,note){
    // Numbers 1 to 4 belong to the initial records on Saved Pipelines.
    const number=Math.max(4,...(data.savedVersions||[]).map(version=>version.number))+1;
    return {id:'saved-version-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)),revision:1,
      number,name,note,status:'saved',savedAt:new Date().toISOString(),savedBy:demoEditor.name,savedById:demoEditor.id,
      plans:clone(data.plans),rules:clone(data.library.sharedRules)};
  }
  let pageContext;
  function assertOpenContext(data){
    if(data.openPipeline.token!==pageContext)throw new Error('Another pipeline was opened in another tab. Reload this page before making changes.');
  }
  function assertEditableContext(data){
    assertOpenContext(data);
    if(data.openPipeline.mode==='baseline')throw new Error('Choose Edit this pipeline before changing a baseline.');
  }
  // Baseline references are metadata, not edits to the pipeline's schedule.
  const scheduleContent=plans=>plans.map(({approvedBaseline,...plan})=>plan);
  function pipelineSourceFor(data){
    const record=(data.savedVersions||[]).find(item=>item.id===data.openPipeline.id)||null;
    const readOnly=data.openPipeline.mode==='baseline';
    const rules=readOnly&&record?record.rules:data.library.sharedRules;
    let dirty=data.plans.length>0;
    if(record)dirty=JSON.stringify(scheduleContent(data.plans))!==JSON.stringify(scheduleContent(record.plans))||
      JSON.stringify(rules)!==JSON.stringify(record.rules);
    else if(data.openPipeline.originBaseline)dirty=JSON.stringify({plans:scheduleContent(data.plans),rules:data.library.sharedRules})!==data.openPipeline.originBaseline.initialContent;
    if(readOnly)dirty=false;
    return {plans:clone(data.plans),rules:clone(rules),currentBaselineId:workflowFor(data).currentId,
      editor:clone(demoEditor),context:clone(data.openPipeline),record:clone(record),dirty,readOnly,
      isLive:readOnly&&record?.id===workflowFor(data).currentId,
      librarySignature:JSON.stringify({rules:data.library.sharedRules,colours:data.library.types.map(phase=>[phase.id,phase.color])})};
  }
  function pipelineSource(){const data=read(true);assertOpenContext(data);return pipelineSourceFor(data);}
  function checkPipelineSource(data,expected){
    assertOpenContext(data);
    const current=pipelineSourceFor(data);
    if(JSON.stringify(current.context)!==JSON.stringify(expected.context)||
       JSON.stringify(current.plans)!==JSON.stringify(expected.plans)||JSON.stringify(current.rules)!==JSON.stringify(expected.rules)||
       JSON.stringify(current.record)!==JSON.stringify(expected.record)||current.currentBaselineId!==expected.currentBaselineId||current.librarySignature!==expected.librarySignature)
      throw new Error('The pipeline changed in another page. Close this window, reload and review it before saving or opening another pipeline.');
    return current;
  }
  function savePipelineInto(data,input,mode){
    const current=pipelineSourceFor(data),record=current.record;
    const originalName=record?.name||data.openPipeline.originBaseline?.name;
    const name=typeof input?.name==='string'?input.name.trim():'',note=typeof input?.note==='string'?input.note.trim():'';
    if(!name)throw new Error('Enter a name.');
    if(!note)throw new Error('Enter a reason for saving.');
    if(name.length>120||note.length>2000)throw new Error('Use up to 120 characters for the name and 2,000 for the reason.');
    if(!data.plans.length)throw new Error('Add a procurement before saving a pipeline.');
    data.plans.forEach(validatePlan);
    const records=data.savedVersions||[];
    let saved;
    if(mode==='save'){
      if(data.openPipeline.originBaseline)throw new Error('A baseline cannot be overwritten. Use Save as and enter a different name.');
      if(!record)throw new Error('Save this pipeline under a name first.');
      if(record.status==='current'||record.status==='previous'||record.confirmation)throw new Error('A baseline cannot be overwritten. Use Save as and enter a different name.');
      if((record.revision||1)!==data.openPipeline.revision)throw new Error('The saved pipeline changed in another page. Reopen it before saving.');
      if(name!==record.name)throw new Error('Use Save as to save under a different name.');
      saved={...record,note,plans:clone(data.plans),rules:clone(data.library.sharedRules),revision:(record.revision||1)+1,
        savedAt:new Date().toISOString(),savedBy:demoEditor.name,savedById:demoEditor.id};
      data.savedVersions=records.map(item=>item.id===saved.id?saved:item);
    }else if(mode==='saveAs'){
      if(originalName&&name.toLocaleLowerCase()===originalName.toLocaleLowerCase())throw new Error('Enter a different name to create a new copy.');
      if(records.some(item=>item.name.trim().toLocaleLowerCase()===name.toLocaleLowerCase()))throw new Error('A pipeline with this name already exists. Enter a different name.');
      saved=makeSavedVersion(data,name,note);data.savedVersions=[...records,saved];
    }else throw new Error('Choose Save or Save as.');
    data.openPipeline={...data.openPipeline,id:saved.id,revision:saved.revision,mode:'editing',
      token:data.openPipeline.id===saved.id?data.openPipeline.token:(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2))};
    delete data.openPipeline.originBaseline;
    data.pipelineHistory=[...(data.pipelineHistory||[]),{type:'saved',pipelineId:saved.id,at:saved.savedAt,by:demoEditor.name,byId:demoEditor.id,reason:note}];
    return saved;
  }
  function savePipeline(input,expected,mode){
    const data=read(true);checkPipelineSource(data,expected);
    const saved=savePipelineInto(data,input,mode);write(data);pageContext=data.openPipeline.token;return clone(saved);
  }
  function openPipeline(expectedTarget,expected,resolution){
    const data=read(true),current=checkPipelineSource(data,expected);
    const target=(data.savedVersions||[]).find(item=>item.id===expectedTarget.id);
    if(!target||JSON.stringify(target)!==JSON.stringify(expectedTarget))throw new Error('The selected pipeline changed. Reload the list and choose it again.');
    if(target.status==='current'||target.status==='previous'||target.confirmation)throw new Error('This baseline is fixed. Open an editable saved pipeline.');
    if(target.id===data.openPipeline.id)return clone(target);
    loadPipelineForEditing(data,target,current,resolution);
    write(data);pageContext=data.openPipeline.token;return clone(target);
  }
  function baselineForEditing(data,expectedTarget){
    const stored=(data.savedVersions||[]).find(item=>item.id===expectedTarget.id);
    if(!stored||JSON.stringify(stored)!==JSON.stringify(expectedTarget))throw new Error('The selected pipeline changed. Reload the list and choose it again.');
    if(stored.status!=='current'&&stored.status!=='previous')throw new Error('Choose a current or previous baseline to edit.');
    return stored;
  }
  function editBaseline(expectedTarget,expected,resolution){
    const data=read(true),current=checkPipelineSource(data,expected),target=baselineForEditing(data,expectedTarget);
    loadPipelineForEditing(data,target,current,resolution,{id:target.id,name:target.name});
    write(data);pageContext=data.openPipeline.token;return clone(target);
  }
  function viewLivePipeline(expected,resolution){
    const data=read(true),current=checkPipelineSource(data,expected);
    const baseline=(data.savedVersions||[]).find(item=>item.id===workflowFor(data).currentId&&item.status==='current');
    if(!baseline)throw new Error('The live pipeline could not be loaded. Reload this page.');
    if(current.isLive)return current;
    loadPipelineForEditing(data,baseline,current,resolution,undefined,true);
    write(data);pageContext=data.openPipeline.token;return pipelineSourceFor(data);
  }
  function preparePipelineEntry(resume=false){
    const current=pipelineSource();
    return resume||current.dirty?current:viewLivePipeline(current);
  }
  function loadPipelineForEditing(data,target,current,resolution,originBaseline,baselineView=false){
    const ids=new Set();
    target.plans.forEach(plan=>{validatePlan(plan);if(ids.has(plan.id))throw new Error('This pipeline contains duplicate procurements.');ids.add(plan.id);});
    if(current.dirty){
      if(resolution?.action==='save')savePipelineInto(data,resolution.input,resolution.mode);
      else if(resolution?.action!=='discard')throw new Error('Save or discard your changes before opening another pipeline.');
    }
    const baseline=(data.savedVersions||[]).find(item=>item.id===workflowFor(data).currentId);
    const references=baseline?.plans||(workflowFor(data).currentId===initialBaselineId?seed().plans:[]);
    const colours=new Map(data.library.types.map(phase=>[phase.id,phase.color]));
    data.plans=target.plans.map(plan=>{
      const approved=references.find(item=>item.id===plan.id);
      return {...clone(plan),approvedBaseline:approved?clone({anchor:approved.anchor,phases:approved.phases}):null,
        phases:plan.phases.map(phase=>({...clone(phase),...(!baselineView&&colours.has(phase.libraryPhaseId)?{color:colours.get(phase.libraryPhaseId)}:{})}))};
    });
    data.openPipeline={id:originBaseline?null:target.id,revision:originBaseline?0:target.revision||1,mode:baselineView?'baseline':'editing',
      token:globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),
      ...(originBaseline?{originBaseline:{...originBaseline,initialContent:JSON.stringify({plans:scheduleContent(data.plans),rules:data.library.sharedRules})}}:{})};
  }
  const initialBaselineId='v02';
  function workflowFor(data){return data.baselineWorkflow||{currentId:initialBaselineId,events:[]};}
  function baselineState(){return clone(workflowFor(read(true)));}
  function versionRecords(){const data=read(true);return clone({versions:data.savedVersions||[],baseline:workflowFor(data)});}
  function baselineActionSource(id){
    const data=read(true);assertOpenContext(data);
    const version=(data.savedVersions||[]).find(item=>item.id===id);
    const baseline=(data.savedVersions||[]).find(item=>item.id===workflowFor(data).currentId);
    if(!version||!baseline)throw new Error('The selected pipeline or current baseline is no longer available. Reload the page.');
    if(version.status!=='saved')throw new Error('Choose an editable saved pipeline to confirm as a new baseline.');
    return clone({version,baseline,currentBaselineId:baseline.id,working:pipelineSourceFor(data),editor:demoEditor});
  }
  function discardPipelineChanges(expected){
    const data=read(true),current=checkPipelineSource(data,expected);
    const origin=data.openPipeline.originBaseline;
    const target=(data.savedVersions||[]).find(item=>item.id===(origin?.id||data.openPipeline.id));
    if(!target)throw new Error('Save this pipeline under a name before continuing.');
    loadPipelineForEditing(data,target,current,{action:'discard'},origin?{id:origin.id,name:origin.name}:undefined);
    write(data);pageContext=data.openPipeline.token;return pipelineSourceFor(data);
  }
  function confirmBaseline(id,rationale,expected){
    if(rationale!==undefined&&typeof rationale!=='string')throw new Error('Enter text for the optional rationale.');
    const note=(rationale||'').trim();
    if(note.length>2000)throw new Error('Use up to 2,000 characters for the rationale.');
    const data=read(true),current=checkPipelineSource(data,expected.working),workflow=workflowFor(data);
    const version=(data.savedVersions||[]).find(item=>item.id===id);
    const previous=(data.savedVersions||[]).find(item=>item.id===workflow.currentId);
    if(!version||!previous||JSON.stringify(version)!==JSON.stringify(expected.version)||
       JSON.stringify(previous)!==JSON.stringify(expected.baseline)||workflow.currentId!==expected.currentBaselineId)
      throw new Error('The pipeline or current baseline changed during review. Reload the page and review again before confirming.');
    if(current.dirty)throw new Error('Save or discard your changes before confirming a new baseline.');
    if(version.status!=='saved'||version.confirmation)throw new Error('Only an editable saved pipeline can become a new baseline.');
    const seen=new Set();
    if(!version.plans.length)throw new Error('Add a procurement before confirming a baseline.');
    version.plans.forEach(plan=>{validatePlan(plan);if(seen.has(plan.id))throw new Error('A procurement appears more than once.');seen.add(plan.id);});
    const confirmation={at:new Date().toISOString(),by:demoEditor.name,byId:demoEditor.id,fromBaselineId:previous.id,...(note?{rationale:note}:{})};
    previous.status='previous';
    version.status='current';version.confirmation=confirmation;
    if(data.openPipeline.id===id)data.openPipeline.mode='baseline';
    const event={id:'baseline-event-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)),
      type:'confirmed',versionId:id,previousBaselineId:previous.id,...confirmation};
    data.baselineWorkflow={currentId:id,events:[...workflow.events,event]};
    // A new reference does not replace a different pipeline that is open for editing.
    data.plans.forEach(plan=>{
      const reference=version.plans.find(item=>item.id===plan.id);
      plan.approvedBaseline=reference?clone({anchor:reference.anchor,phases:reference.phases}):null;
    });
    write(data);return clone(version);
  }
  function counter(items,prefix,field='id'){return items.reduce((max,item)=>{const id=String(item[field]||'');return id.startsWith(prefix)?Math.max(max,Number(id.slice(prefix.length))||0):max;},0);}
  let allowLeave=false,dirty=()=>false;
  function canLeave(){return !dirty()||window.confirm('You have unfinished edits. Leave this page and discard those edits?');}
  function go(url){allowLeave=true;window.location.assign(url);}
  function guard(check){
    dirty=check;
    document.addEventListener('click',event=>{
      const link=event.target.closest?.('a[href]');
      if(event.defaultPrevented||!link||link.hasAttribute('download')||link.target==='_blank'||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      const href=link.getAttribute('href');if(!href||href.startsWith('#'))return;
      if(!canLeave()){allowLeave=false;event.preventDefault();return;}allowLeave=dirty();
    });
    window.addEventListener('beforeunload',event=>{if(!allowLeave&&dirty()){event.preventDefault();event.returnValue='';}});
    window.addEventListener('pageshow',event=>{if(event.persisted){allowLeave=true;window.location.reload();}});
  }
  function setDirty(check){dirty=check;allowLeave=false;}
  function error(message){
    let box=document.getElementById('demo-error');
    if(!box){box=document.createElement('p');box.id='demo-error';box.className='demo-error';box.setAttribute('role','alert');document.querySelector('main')?.prepend(box);}
    box.textContent=message;
  }
  window.LTPPDemo={library,saveLibrary,saveProcLibrary,plans:()=>read().plans,plan:id=>read().plans.find(p=>p.id===id),
    addPlan,updatePlan,updatePlans,pipelineSource,savePipeline,openPipeline,editBaseline,viewLivePipeline,preparePipelineEntry,savedVersions,versionRecords,baselineState,baselineActionSource,discardPipelineChanges,confirmBaseline,counter,guard,setDirty,canLeave,go,error,monday,paused,move,activeDays,findClashes,
    reset:()=>{localStorage.removeItem(key);cache=null;return read();}};
  try{pageContext=read().openPipeline.token;}catch(e){error(e.message);}
  if(window.location.protocol==='file:')error('For connected navigation and shared demo data, open /mockups/pipeline.html through the project’s local web server. Browsers may keep separate storage for individual files.');
})();
