import test from 'node:test';
import assert from 'node:assert/strict';
import {parseContentMutation,mutateContentWithClient,listContentWithClient,approveAllWithClient} from '../lib/admin/content-management.ts';
const id='11111111-1111-4111-8111-111111111111';
const version='a'.repeat(32);
const edit={entity:'resources',id,version,operation:'update',patch:{title:'Renamed resource'}};
function fixture({role='admin',signedIn=true,result={success:true},error=null}={}){
 const calls=[];
 const client={auth:{async getClaims(){return {data:{claims:signedIn?{sub:id}:null},error:null};}},
 from(table){const q={select(){return q;},eq(){return q;},async maybeSingle(){return {data:{role},error:null};}};calls.push(['from',table]);return q;},
 async rpc(name,args){calls.push(['rpc',name,args]);return {data:result,error};}};
 return {client,calls};
}
for(const options of [{role:'student'},{signedIn:false}])test(`reject unauthorized mutations and reads ${JSON.stringify(options)}`,async()=>{
 const {client,calls}=fixture(options);
 for(const result of [await mutateContentWithClient(client,edit),await approveAllWithClient(client),await listContentWithClient(client,'resources')])assert.deepEqual(result,{error:'unauthorized'});
 assert.equal(calls.some(c=>c[0]==='rpc'),false);
});
for(const bad of [
 {...edit,entity:'auth.users'}, {...edit,entity:'study_sets'}, {...edit,patch:{uploader_id:id}},
 {...edit,patch:{status:'approved'}}, {...edit,patch:{title:'a'}}, {...edit,patch:{external_url:'javascript:alert(1)'}},
 {...edit,version:''}, {...edit,patch:{}}, {...edit,operation:'delete',patch:{title:'hidden update'}},
 {...edit,entity:'profiles',patch:{role:'owner'}}, {...edit,entity:'profiles',patch:{username:'bad user'}},
 {...edit,patch:{course_id:'not-a-uuid'}}, {...edit,patch:{title:null}},
])test(`invalid payload blocked: ${JSON.stringify(bad.patch)} ${bad.entity}`,async()=>{
 assert.equal(parseContentMutation(bad),null);
 const {client,calls}=fixture();assert.deepEqual(await mutateContentWithClient(client,bad),{error:'invalid'});
 assert.equal(calls.some(c=>c[0]==='rpc'),false);
});
test('admin edits carry a concurrency token and only editable fields',async()=>{
 const {client,calls}=fixture();assert.deepEqual(await mutateContentWithClient(client,edit),{success:true});
 assert.deepEqual(calls.find(c=>c[0]==='rpc'),['rpc','admin_content_mutate',{entity:'resources',target_id:id,expected_version:version,operation:'update',patch:{title:'Renamed resource'}}]);
});
test('bulk approvals use a count RPC, unaffected by a 1000-row API return cap',async()=>{
 const {client,calls}=fixture({result:1548});assert.deepEqual(await approveAllWithClient(client),{success:true,count:1548});
 assert.equal(calls.some(c=>c[0]==='rpc'&&c[1]==='admin_approve_pending_resources'),true);
});
for(const [error,mapped] of [[{code:'40001'},'conflict'],[{code:'23503'},'dependencies'],[{code:'PGRST202'},'migration'],[{code:'22023',message:'cannot_change_own_access'},'ownAccess'],[{code:'XX000',message:'secret database internals'},'failed']])test(`database errors safely map to ${mapped}`,async()=>{
 const f=fixture({error});assert.deepEqual(await mutateContentWithClient(f.client,edit),{error:mapped});
});
test('zero approved rows is a successful repeat click',async()=>{
 assert.deepEqual(await approveAllWithClient(fixture({result:0}).client),{success:true,count:0});
});
test('malformed RPC returns are not reported as success',async()=>{
 assert.deepEqual(await approveAllWithClient(fixture({result:null}).client),{error:'failed'});
 assert.deepEqual(await mutateContentWithClient(fixture({result:null}).client,edit),{error:'failed'});
});
test('read pagination validates the entity, search size and page',async()=>{
 const f=fixture();for(const [entity,q,page]of [['resources','',0],['resources','x'.repeat(101),1],['auth.users','',1]])assert.deepEqual(await listContentWithClient(f.client,entity,q,page),{error:'invalid'});
 assert.equal(f.calls.some(c=>c[0]==='rpc'),false);
});
