import test from "node:test";
import assert from "node:assert/strict";
import { setSchema, cardSchema, materialSchema, safeMaterialUrl, studyDatabaseError } from "../lib/study/validation.ts";
import { reviewQueue } from "../lib/study/review.ts";
import { mutateStudyWithClient, reviewCardWithClient } from "../lib/study/mutations.ts";

const owner = "afc00000-0000-4000-8000-000000000001";
const setId = "afc00000-0000-4000-8000-000000000020";
const cardId = "afc00000-0000-4000-8000-000000000021";
const token = "afc00000-0000-4000-8000-000000000022";
function fixture(options = {}) {
  const calls = [];
  const client = {
    auth: { async getClaims() { return { data: options.signedOut ? null : { claims: { sub: owner } }, error: options.authError ? {} : null }; } },
    async rpc(name, args) { calls.push(["rpc", name, args]); if(options.throwRpc) throw Error("private details"); return { data: options.empty ? null : { card_id: cardId }, error: options.rpcError ?? null }; },
    from(table) {
      calls.push(["from", table]);
      let writing = false;
      const query = {
        select(value) { calls.push(["select", table, value]); return query; },
        eq(key, value) { calls.push(["eq", table, key, value]); return query; },
        insert(value) { writing = true; calls.push(["insert", table, value]); return query; },
        update(value) { writing = true; calls.push(["update", table, value]); return query; },
        delete() { writing = true; calls.push(["delete", table]); return query; },
        async maybeSingle() {
          if(options.throwRead) throw Error("private details");
          return { data: options.missing || options.empty && writing ? null : { id: writing && table !== "study_sets" ? cardId : setId }, error: (writing ? options.writeError : options.readError) ?? null };
        },
        async single() { return query.maybeSingle(); },
      }; return query;
    },
  }; return { client, calls };
}

test("study sets default to private and strip supplied identity/token fields", () => {
  assert.deepEqual(setSchema.parse({ title: "  Networks midterm  ", owner_id: "victim", share_token: "forged" }), { title: "Networks midterm", subject: "", description: "", visibility: "private" });
  for (const value of [{ title: "x" }, { title: "x".repeat(161) }, { title: "Valid set", visibility: "public" }, { title: "Valid set", subject: "x".repeat(121) }]) assert.equal(setSchema.safeParse(value).success, false);
});
test("manual cards are trimmed and bounded", () => {
  assert.equal(cardSchema.parse({ set_id: setId, front: "  TCP? ", back: " Reliable " }).front, "TCP?");
  for(const fields of [{ front: " " }, { back: " " }, { front: "x".repeat(801) }, { back: "x".repeat(2001) }, { set_id: "bad" }]) assert.equal(cardSchema.safeParse({ set_id: setId, front: "TCP?", back: "Reliable", ...fields }).success, false);
});
test("resource links allow HTTPS or a precise local resource path without server fetching", () => {
  for(const url of ["https://drive.google.com/file/d/example/view", "https://example.com/notes", `/resources/${cardId}`]) assert.equal(safeMaterialUrl(url), true);
  for(const url of ["javascript:alert(1)", "data:text/html,hi", "http://example.com", "//example.com", "https://user:pass@example.com", "/resources/../dashboard", "/api/account"]) assert.equal(safeMaterialUrl(url), false);
  assert.equal(materialSchema.safeParse({ set_id: setId, title: "Notes", url: "javascript:alert(1)" }).success, false);
});
test("all mutations and review require verified authentication", async () => {
  for(const options of [{ signedOut: true }, { authError: true }]) {
    for(const operation of ["createSet", "updateSet", "deleteSet", "addCard", "updateCard", "deleteCard", "addMaterial", "deleteMaterial"]) {
      const f = fixture(options); assert.deepEqual(await mutateStudyWithClient(f.client, operation, {}), { error: "unauthorized" }); assert.deepEqual(f.calls, []);
    }
    const f = fixture(options); assert.deepEqual(await reviewCardWithClient(f.client, { card_id: cardId, remembered: true }), { error: "unauthorized" }); assert.deepEqual(f.calls, []);
  }
});
test("new sets use only server-derived ownership and default privacy", async () => {
  const f=fixture(); assert.deepEqual(await mutateStudyWithClient(f.client,"createSet",{ title:"Networks exam",owner_id:"victim",share_token:token }),{success:true,id:setId});
  assert.deepEqual(f.calls.find(c=>c[0]==="insert"),["insert","study_sets",{title:"Networks exam",subject:"",description:"",visibility:"private",owner_id:owner}]);
});
test("set edits and deletion filter by verified owner and ignore spoofed tokens", async () => {
  const f=fixture(); assert.equal((await mutateStudyWithClient(f.client,"updateSet",{id:setId,title:"New title",visibility:"shared",owner_id:"victim",share_token:token})).success,true);
  assert.ok(f.calls.some(c=>c[0]==="eq"&&c[2]==="owner_id"&&c[3]===owner));
  assert.deepEqual(f.calls.find(c=>c[0]==="update")[2],{title:"New title",subject:"",description:"",visibility:"shared"});
});
test("viewers cannot add, change or delete content in someone else's set", async () => {
  for(const [operation,input] of [["addCard",{set_id:setId,front:"Q",back:"A"}],["updateCard",{id:cardId,set_id:setId,front:"Q",back:"A"}],["deleteCard",{id:cardId,set_id:setId}],["addMaterial",{set_id:setId,title:"Notes",url:"https://example.com"}],["deleteMaterial",{id:cardId,set_id:setId}]]) {
    const f=fixture({missing:true}); assert.deepEqual(await mutateStudyWithClient(f.client,operation,input),{error:"notFound"});
    assert.equal(f.calls.some(c=>["insert","update","delete"].includes(c[0])),false);
  }
});
test("card edits and deletes are constrained to the declared owned set", async () => {
  const f=fixture(); assert.equal((await mutateStudyWithClient(f.client,"updateCard",{id:cardId,set_id:setId,front:"Question",back:"Answer",owner_id:"victim"})).success,true);
  assert.deepEqual(f.calls.find(c=>c[0]==="update"),["update","study_cards",{front:"Question",back:"Answer"}]);
  assert.ok(f.calls.some(c=>c[0]==="eq"&&c[1]==="study_cards"&&c[2]==="set_id"&&c[3]===setId));
});
test("invalid inputs never reach a database query", async () => {
  for(const operation of ["createSet","updateSet","deleteSet","addCard","updateCard","deleteCard","addMaterial","deleteMaterial"]) {
    const f=fixture(); assert.deepEqual(await mutateStudyWithClient(f.client,operation,{}),{error:"invalid"}); assert.deepEqual(f.calls,[]);
  }
});
test("reviews send no user ID and preserve a supplied share capability", async () => {
  const f=fixture(); assert.deepEqual(await reviewCardWithClient(f.client,{card_id:cardId,remembered:false,token,user_id:"victim"}),{success:true,id:cardId});
  assert.deepEqual(f.calls,[["rpc","review_study_card",{target_card:cardId,knew:false,access_token:token}]]);
  const invalid=fixture(); assert.deepEqual(await reviewCardWithClient(invalid.client,{card_id:cardId,remembered:"yes"}),{error:"invalid"}); assert.deepEqual(invalid.calls,[]);
});
test("database failures, limits and stale rows never report success or leak details", async () => {
  for(const [error,code] of [[{code:"42501"},"notFound"],[{message:"study_limit"},"limit"],[{code:"PGRST205"},"unavailable"],[{message:"secret"},"failed"]]) {
    const f=fixture({writeError:error}); assert.deepEqual(await mutateStudyWithClient(f.client,"createSet",{title:"Valid set"}),{error:code});
    const r=fixture({rpcError:error}); assert.deepEqual(await reviewCardWithClient(r.client,{card_id:cardId,remembered:true}),{error:code});
  }
  const f=fixture({empty:true}); assert.deepEqual(await mutateStudyWithClient(f.client,"deleteSet",{id:setId}),{error:"notFound"});
  assert.equal(studyDatabaseError({code:"XX000",message:"private details"}),"failed");
});
test("review queues use personal due dates and last recall, without a guessed exam score", () => {
  const cards=[{id:"new"},{id:"forgot"},{id:"later"},{id:"due"}];
  const reviews=[{card_id:"forgot",remembered:false,next_review_at:"2026-10-23T10:10:00Z"},{card_id:"later",remembered:true,next_review_at:"2026-10-24T10:00:00Z"},{card_id:"due",remembered:true,next_review_at:"2026-10-22T10:00:00Z"}];
  const now=Date.parse("2026-10-23T10:00:00Z");
  assert.deepEqual(reviewQueue(cards,reviews,"all",now).map(x=>x.id),["new","forgot","later","due"]);
  assert.deepEqual(reviewQueue(cards,reviews,"due",now).map(x=>x.id),["new","due"]);
  assert.deepEqual(reviewQueue(cards,reviews,"weak",now).map(x=>x.id),["forgot"]);
});
