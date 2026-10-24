import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {emptySnapshot,planImports,parseSection,restoreSnapshot,databaseError} from '../lib/companion/model.ts';
import {campusDate,campusClock,nextWindow,hasScheduleConflict,semesterProjection,walletSummary,moneyToCents,daySummary} from '../lib/companion/math.ts';
import {saveCompanionWithClient} from '../lib/companion/mutations.ts';
import {circleSchema,circleRow,circleError,parseCircleList} from '../lib/circles/model.ts';
import {mutateCircleWithClient} from '../lib/circles/mutations.ts';
import {campusInputValue,parseCampusInput} from '../lib/circles/time.ts';
const id='afc00000-0000-4000-8000-000000000001';
const second='afc00000-0000-4000-8000-000000000002';
const task={id,title:'  Revise  ',date:'2026-10-24',kind:'exam',minutes:25,doneAt:null};
function fixture(options={}){const calls=[];return {calls,client:{auth:{async getClaims(){return {data:options.anonymous?null:{claims:{sub:id}},error:options.authError?{}:null};}},async rpc(name,args){calls.push({name,args});if(options.throws)throw Error('private backend details');return {data:options.empty?null:options.data??{id,version:1},error:options.error??null};}}};}
test('personal snapshots validate every section, dates, unique IDs and scale',()=>{
 const fresh=emptySnapshot();assert.deepEqual(restoreSnapshot(fresh),fresh);assert.equal(restoreSnapshot({data:{},versions:{}}),null);
 assert.equal(parseSection('user_id',id),null);assert.equal(parseSection('tasks',[{...task,date:'2026-02-30'}]),null);
 assert.equal(parseSection('tasks',[task,task]),null);assert.equal(parseSection('tasks',[{...task,minutes:-1}]),null);
 assert.equal(parseSection('tasks',[task]).payload[0].title,'Revise');
 assert.equal(parseSection('semester',{...fresh.data.semester,previousAverage:5}),null);
 assert.equal(parseSection('semester',{...fresh.data.semester,courses:[{id,title:'x',credits:3,points:3},{id,title:'y',credits:3,points:3}]}),null);
 assert.equal(parseSection('wallet',{budgetCents:100,expenses:[{id,title:'x',cents:1.1,date:task.date,category:'food'}]}),null);
 assert.equal(parseSection('tasks',Array.from({length:201},()=>task)),null);
 assert.equal(restoreSnapshot({...fresh,versions:{...fresh.versions,tasks:-1}}),null);
});
test('semester arithmetic uses credit weights and previous credits without converting scales',()=>{
 const plan={scale:4,previousCredits:30,previousAverage:3,target:3.2,courses:[{id,title:'x',credits:3,points:4},{id:second,title:'y',credits:1,points:2}]};
 const result=semesterProjection(plan);assert.equal(result.credits,4);assert.equal(result.semester,3.5);assert.equal(result.projected,104/34);assert.ok(Math.abs(result.required-4.7)<1e-9);
 assert.equal(semesterProjection(emptySnapshot().data.semester).projected,null);
});
test('money retains cents, rejects ambiguous inputs and excludes past/future months',()=>{
 assert.equal(moneyToCents('0.29'),29);assert.equal(moneyToCents('12.10'),1210);for(const value of ['-1','1e2','1.001','NaN','1,000','1000001'])assert.equal(moneyToCents(value),null);
 const wallet={budgetCents:10000,expenses:[{date:'2026-10-24',cents:1100},{date:'2026-10-25',cents:900},{date:'2026-09-24',cents:800}]};
 const result=walletSummary(wallet,'2026-10-24');assert.equal(result.spent,1100);assert.equal(result.remainingDays,8);assert.equal(result.daily,1112);
 assert.equal(walletSummary({budgetCents:1,expenses:[{date:'2026-10-24',cents:2}]},'2026-10-24').daily,0);
 assert.equal(walletSummary({budgetCents:0,expenses:[]},'2024-02-28').remainingDays,2);
});
test('schedule boundaries permit adjacent classes and reject overlaps on the same day',()=>{
 const lesson={id,title:'Math',day:0,start:'10:00',end:'11:00',location:''};
 assert.equal(hasScheduleConflict([lesson],{...lesson,id:second,start:'10:30'}),true);
 assert.equal(hasScheduleConflict([lesson],{...lesson,id:second,start:'11:00',end:'12:00'}),false);
 assert.equal(hasScheduleConflict([lesson],{...lesson,id:second,day:1}),false);
 assert.equal(hasScheduleConflict([lesson],lesson),false);
 assert.equal(parseSection('schedule',[{...lesson,end:'09:00'}]),null);
 const now=Date.parse('2026-07-05T07:30:00Z');assert.deepEqual(campusClock(now),{day:0,minutes:630});
 assert.equal(nextWindow([lesson],now).current.id,id);assert.equal(nextWindow([{...lesson,start:'11:00',end:'12:00'}],now).freeMinutes,30);
});
test('daily progress counts completion time rather than task due date in campus time',()=>{
 const data=emptySnapshot().data;data.tasks=[{...task,date:'2026-10-01',doneAt:'2026-07-05T22:00:00Z'}];data.focus=[{id,minutes:25,finishedAt:'2026-07-05T22:00:00Z'}];
 assert.equal(campusDate(Date.parse('2026-07-05T22:00:00Z')),'2026-07-06');assert.equal(daySummary(data,'2026-07-06').completed,1);assert.equal(daySummary(data,'2026-07-06').focusMinutes,25);assert.equal(daySummary(data,'2026-07-05').completed,0);
});
test('campus date inputs roundtrip through real timezone rules in winter and summer',()=>{
 for(const value of ['2026-01-15T10:30','2026-07-15T10:30','2026-10-24T10:30']){const parsed=parseCampusInput(value);assert.ok(parsed);assert.equal(campusInputValue(Date.parse(parsed)),value);}
 for(const value of ['bad','2026-02-30T12:00','2026-10-24T25:00'])assert.equal(parseCampusInput(value),null);
 assert.equal(parseCampusInput('2026-01-15T10:30'),'2026-01-15T08:30:00.000Z');assert.equal(parseCampusInput('2026-07-15T10:30'),'2026-07-15T07:30:00.000Z');
});
test('private writes require verified identity and valid optimistic versions',async()=>{
 for(const options of [{anonymous:true},{authError:true}]){const f=fixture(options);assert.equal((await saveCompanionWithClient(f.client,'tasks',[task],0)).error,'unauthorized');assert.equal(f.calls.length,0);}
 for(const [section,payload,version] of [['tasks',[task],-1],['tasks',[task],1.5],['tasks',[task],'0'],['unknown',{},0],['tasks',[task,task],0]]){const f=fixture();assert.equal((await saveCompanionWithClient(f.client,section,payload,version)).error,'invalid');assert.equal(f.calls.length,0);}
});
test('private save whitelists payload and cannot accept forged ownership',async()=>{
 const f=fixture();const result=await saveCompanionWithClient(f.client,'profile',{name:'  Student ',intention:'steady',dailyMinutes:25,user_id:second},0);
 assert.equal(result.success,true);assert.deepEqual(f.calls,[{name:'save_companion_section',args:{section_name:'profile',content:{name:'Student',intention:'steady',dailyMinutes:25},expected_version:0}}]);
});
test('conflicts and backend failures surface without leaking private errors',async()=>{
 for(const [options,expected] of [[{error:{message:'companion_conflict'}},'conflict'],[{error:{code:'PGRST202'}},'unavailable'],[{throws:true},'failed'],[{empty:true},'failed'],[{data:{version:9}},'failed']]){const f=fixture(options);assert.deepEqual(await saveCompanionWithClient(f.client,'tasks',[task],0),{error:expected});}
 assert.equal(databaseError({code:'42501'}),'unauthorized');
});
const details={title:'Networks together',description:'Review network routing together.',kind:'study',location:'Library ground floor',starts_at:'2026-10-25T12:00:00.000Z',duration:25,capacity:2};
test('gatherings validate seats, duration and both server timestamp formats',()=>{
 assert.equal(circleSchema.safeParse(details).success,true);for(const patch of [{capacity:1},{capacity:13},{duration:300},{title:'x'},{kind:'other'}])assert.equal(circleSchema.safeParse({...details,...patch}).success,false);
 assert.equal(circleRow.safeParse({...details,starts_at:'2026-10-25T12:00:00+00:00',id,host:'student',members:1,joined:false,is_host:false,status:'open'}).success,true);
});
test('gathering actions authenticate, whitelist operation and derive membership on the server',async()=>{
 const now=Date.parse('2026-10-24T12:00:00Z');const anon=fixture({anonymous:true});assert.equal((await mutateCircleWithClient(anon.client,'create',details,now)).error,'unauthorized');assert.equal(anon.calls.length,0);
 const f=fixture();assert.equal((await mutateCircleWithClient(f.client,'create',{...details,host_id:second},now)).success,true);assert.equal(f.calls[0].name,'create_campus_circle');assert.equal('host_id'in f.calls[0].args.details,false);
 assert.equal((await mutateCircleWithClient(f.client,'act',{id,action:'join',user_id:second})).success,true);assert.deepEqual(f.calls[1],{name:'act_campus_circle',args:{target:id,operation:'join'}});
 assert.equal((await mutateCircleWithClient(f.client,'act',{id,action:'delete'})).error,'invalid');assert.equal((await mutateCircleWithClient(f.client,'unknown',{})).error,'invalid');
 assert.equal((await mutateCircleWithClient(f.client,'create',{...details,starts_at:'2025-01-01T00:00:00Z'},now)).error,'invalid');assert.equal((await mutateCircleWithClient(f.client,'create',{...details,starts_at:'2027-12-01T00:00:00Z'},now)).error,'invalid');
});
test('gathering reports are bounded and do not accept another reporter identity',async()=>{
 const f=fixture();assert.equal((await mutateCircleWithClient(f.client,'report',{id,reason:'Something is wrong here',reporter_id:second})).success,true);assert.deepEqual(f.calls[0],{name:'report_campus_circle',args:{target:id,report_reason:'Something is wrong here'}});
 assert.equal((await mutateCircleWithClient(f.client,'report',{id,reason:'x'})).error,'invalid');assert.equal(f.calls.length,1);
 for(const name of ['full','ended','limit','notFound','host'])assert.equal(circleError({message:`circle_${name}`}),name);
});
test('all new Arabic and English translation paths match',async()=>{
 const [ar,en]=await Promise.all(['ar','en'].map(l=>readFile(new URL(`../messages/${l}.json`,import.meta.url),'utf8').then(JSON.parse)));
 const keys=(object,prefix='')=>Object.entries(object).flatMap(([key,value])=>typeof value==='object'?keys(value,`${prefix}${key}.`):`${prefix}${key}`).sort();
 for(const ns of ['Companion','Circles','HomePage','Navigation'])assert.deepEqual(keys(ar[ns]),keys(en[ns]));
});

test('explicit import recovers pre-activation account data and never overwrites cloud sections',()=>{
 const target=emptySnapshot(),local=emptySnapshot(),guest=emptySnapshot();
 local.data.tasks=[task];local.versions.tasks=2;guest.data.tasks=[{...task,title:'guest'}];guest.versions.tasks=1;
 guest.data.profile.name='Guest';guest.versions.profile=1;
 let imports=planImports(target,local,guest);assert.equal(imports.find(row=>row.section==='tasks').payload[0].title,task.title);
 assert.equal(imports.find(row=>row.section==='profile').payload.name,'Guest');
 target.versions.tasks=1;imports=planImports(target,local,guest);assert.equal(imports.some(row=>row.section==='tasks'),false);
 assert.equal(planImports(target,null,null).length,0);
});

test('one malformed direct-database gathering cannot break the entire public square',()=>{
 const valid={...details,id,host:'student',members:1,joined:false,is_host:false,status:'open'};
 assert.equal(parseCircleList([valid,{...valid,id:second,title:'\n\n\n\n\n'}]).length,1);
 assert.equal(parseCircleList([valid,{...valid,id:second,description:'😀'.repeat(1200)}]).length,2);
 assert.deepEqual(parseCircleList([]),[]);assert.equal(parseCircleList({}),null);assert.equal(parseCircleList(Array(41).fill(valid)),null);
});
