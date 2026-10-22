-- LOCAL database only. All fixtures and mutations are rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(48);

insert into auth.users(id,email,raw_user_meta_data) values
 ('fde00000-0000-4000-8000-000000000001','study-owner1@example.invalid','{"username":"study_owner_one","full_name":"Study owner one"}'),
 ('fde00000-0000-4000-8000-000000000002','study-owner2@example.invalid','{"username":"study_owner_two","full_name":"Study owner two"}'),
 ('fde00000-0000-4000-8000-000000000003','study-reader@example.invalid','{"username":"study_reader","full_name":"Study reader"}');

select set_config('request.jwt.claim.sub','fde00000-0000-4000-8000-000000000001',true);
set local role authenticated;
insert into public.study_sets(id,owner_id,title,share_token) values
 ('fde00000-0000-4000-8000-000000000010','fde00000-0000-4000-8000-000000000001','Private notes','fde00000-0000-4000-8000-000000000110');
select is((select visibility from public.study_sets where id='fde00000-0000-4000-8000-000000000010'),'private','sets default to private');
insert into public.study_cards(id,set_id,front,back) values
 ('fde00000-0000-4000-8000-000000000020','fde00000-0000-4000-8000-000000000010','Private question','Private answer');
insert into public.study_materials(set_id,title,url) values
 ('fde00000-0000-4000-8000-000000000010','Private source','https://example.com/private');
select throws_ok($$insert into public.study_sets(owner_id,title) values ('fde00000-0000-4000-8000-000000000002','Forged owner')$$,'42501',null,'set ownership cannot be forged');

reset role;
select set_config('request.jwt.claim.sub','fde00000-0000-4000-8000-000000000002',true);
set local role authenticated;
insert into public.study_sets(id,owner_id,title,visibility,share_token) values
 ('fde00000-0000-4000-8000-000000000011','fde00000-0000-4000-8000-000000000002','Shared notes','shared','fde00000-0000-4000-8000-000000000111');
insert into public.study_cards(id,set_id,front,back) values
 ('fde00000-0000-4000-8000-000000000021','fde00000-0000-4000-8000-000000000011','Shared question','Shared answer');

reset role;
select set_config('request.jwt.claim.sub','fde00000-0000-4000-8000-000000000003',true);
set local role authenticated;
select is((select count(*)::int from public.study_sets),0,'readers cannot enumerate any sets or share tokens');
select is((select count(*)::int from public.study_cards),0,'readers cannot enumerate cards through direct table queries');
select is((select count(*)::int from public.study_materials),0,'readers cannot enumerate private source links');
select ok(public.get_shared_study_set('fde00000-0000-4000-8000-000000000110') is null,'a private token returns no content');
select ok(public.get_shared_study_set('fde00000-0000-4000-8000-000000000999') is null,'an unknown token returns no content');
select is(public.get_shared_study_set('fde00000-0000-4000-8000-000000000111')->>'title','Shared notes','the valid token grants read access');
select is(public.get_shared_study_set('fde00000-0000-4000-8000-000000000111')->'cards'->0->>'back','Shared answer','shared answers are readable for studying');
select ok(not(public.get_shared_study_set('fde00000-0000-4000-8000-000000000111') ? 'owner_id'),'shared payload excludes owner identity');
select ok(not(public.get_shared_study_set('fde00000-0000-4000-8000-000000000111') ? 'share_token'),'shared payload does not expose other share tokens');
update public.study_sets set title='Hacked' where id='fde00000-0000-4000-8000-000000000011';
select is(public.get_shared_study_set('fde00000-0000-4000-8000-000000000111')->>'title','Shared notes','a reader cannot edit a shared set');
select throws_ok($$insert into public.study_cards(set_id,front,back) values ('fde00000-0000-4000-8000-000000000011','Hacked','Hacked')$$,'42501',null,'a reader cannot insert cards');
update public.study_cards set back='Hacked' where id='fde00000-0000-4000-8000-000000000021';
select is(public.get_shared_study_set('fde00000-0000-4000-8000-000000000111')->'cards'->0->>'back','Shared answer','a reader cannot edit cards');
delete from public.study_cards where id='fde00000-0000-4000-8000-000000000021';
select is(jsonb_array_length(public.get_shared_study_set('fde00000-0000-4000-8000-000000000111')->'cards'),1,'a reader cannot delete cards');
select throws_ok($$insert into public.study_materials(set_id,title,url) values ('fde00000-0000-4000-8000-000000000011','Hacked','https://example.com')$$,'42501',null,'a reader cannot insert source links');
select throws_ok($$select public.review_study_card('fde00000-0000-4000-8000-000000000021',true)$$,'42501',null,'a shared card requires its capability token even for signed-in readers');
select throws_ok($$select public.review_study_card('fde00000-0000-4000-8000-000000000021',true,'fde00000-0000-4000-8000-000000000999')$$,'42501',null,'a wrong capability cannot save a review');
select throws_ok($$select public.review_study_card('fde00000-0000-4000-8000-000000000020',true,'fde00000-0000-4000-8000-000000000110')$$,'42501',null,'a private card cannot be reviewed by a non-owner');
select lives_ok($$select public.review_study_card('fde00000-0000-4000-8000-000000000021',false,'fde00000-0000-4000-8000-000000000111')$$,'a valid shared reader can save their own review');
select is((select remembered from public.study_card_reviews where card_id='fde00000-0000-4000-8000-000000000021'),false,'forgotten is recorded');
select is((select streak from public.study_card_reviews where card_id='fde00000-0000-4000-8000-000000000021'),0,'forgotten resets the streak');
select ok((select next_review_at = now() + interval '10 minutes' from public.study_card_reviews where card_id='fde00000-0000-4000-8000-000000000021'),'forgotten cards are due in ten minutes');
select lives_ok($$select public.review_study_card('fde00000-0000-4000-8000-000000000021',true,'fde00000-0000-4000-8000-000000000111')$$,'remembered review updates the same personal record');
select is((select review_count from public.study_card_reviews where card_id='fde00000-0000-4000-8000-000000000021'),2,'review counts are updated');
select ok((select next_review_at = now() + interval '1 day' from public.study_card_reviews where card_id='fde00000-0000-4000-8000-000000000021'),'first remembered review is due in one day');
select throws_ok($$update public.study_card_reviews set user_id='fde00000-0000-4000-8000-000000000002'$$,'42501',null,'direct review updates cannot bypass the capability check');

reset role;
select set_config('request.jwt.claim.sub','fde00000-0000-4000-8000-000000000002',true);
set local role authenticated;
select is((select count(*)::int from public.study_card_reviews),0,'the set owner cannot read another student review history');
select lives_ok($$select public.review_study_card('fde00000-0000-4000-8000-000000000021',true)$$,'an owner can review without a sharing token');
update public.study_sets set visibility='private' where id='fde00000-0000-4000-8000-000000000011';
select ok((select share_token <> 'fde00000-0000-4000-8000-000000000111' from public.study_sets where id='fde00000-0000-4000-8000-000000000011'),'disabling sharing rotates the token');
select ok(public.get_shared_study_set('fde00000-0000-4000-8000-000000000111') is null,'the old shared link stops working');
update public.study_sets set visibility='shared' where id='fde00000-0000-4000-8000-000000000011';
select ok(public.get_shared_study_set('fde00000-0000-4000-8000-000000000111') is null,'re-enabling sharing does not restore the revoked link');
select set_config('test.new_study_token',(select share_token::text from public.study_sets where id='fde00000-0000-4000-8000-000000000011'),true);

reset role;
select set_config('request.jwt.claim.sub','fde00000-0000-4000-8000-000000000003',true);
set local role authenticated;
select throws_ok($$select public.review_study_card('fde00000-0000-4000-8000-000000000021',true,'fde00000-0000-4000-8000-000000000111')$$,'42501',null,'revoked capabilities cannot save more reviews');
select is(public.get_shared_study_set(current_setting('test.new_study_token')::uuid)->>'title','Shared notes','the replacement link works');

reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
select is(public.get_shared_study_set(current_setting('test.new_study_token')::uuid)->>'title','Shared notes','anonymous visitors can read through a valid token');
select throws_ok($$select * from public.study_sets$$,'42501',null,'anonymous callers cannot list sets or tokens');
select throws_ok($$select public.review_study_card('fde00000-0000-4000-8000-000000000021',true,current_setting('test.new_study_token')::uuid)$$,'42501',null,'anonymous visitors cannot persist review history');

reset role;
select set_config('request.jwt.claim.sub','fde00000-0000-4000-8000-000000000001',true);
set local role authenticated;
select lives_ok($$insert into public.study_cards(set_id,front,back) select 'fde00000-0000-4000-8000-000000000010','Question '||n,'Answer' from generate_series(1,299) n$$,'up to three hundred cards are allowed');
select throws_ok($$insert into public.study_cards(set_id,front,back) values ('fde00000-0000-4000-8000-000000000010','Overflow','Answer')$$,'P0001',null,'the card limit is enforced by the database');
select lives_ok($$update public.study_cards set front='Updated question' where id='fde00000-0000-4000-8000-000000000020'$$,'existing cards remain editable at the limit');
insert into public.study_sets(id,owner_id,title) values ('fde00000-0000-4000-8000-000000000012','fde00000-0000-4000-8000-000000000001','Second private set');
insert into public.study_cards(id,set_id,front,back) values ('fde00000-0000-4000-8000-000000000022','fde00000-0000-4000-8000-000000000012','Move test','Answer');
select throws_ok($$update public.study_cards set set_id='fde00000-0000-4000-8000-000000000010' where id='fde00000-0000-4000-8000-000000000022'$$,'P0001',null,'moving cards cannot bypass the card limit');
select throws_ok($$insert into public.study_materials(set_id,title,url) values ('fde00000-0000-4000-8000-000000000012','Unsafe','javascript:alert(1)')$$,'23514',null,'unsafe source URLs fail database constraints');
select lives_ok($$insert into public.study_materials(set_id,title,url) select 'fde00000-0000-4000-8000-000000000010','Source '||n,'https://example.com/'||n from generate_series(1,99) n$$,'up to one hundred source links are allowed');
select throws_ok($$insert into public.study_materials(set_id,title,url) values ('fde00000-0000-4000-8000-000000000010','Overflow','https://example.com/overflow')$$,'P0001',null,'the source link limit is enforced');
select lives_ok($$insert into public.study_sets(owner_id,title) select 'fde00000-0000-4000-8000-000000000001','Set '||n from generate_series(1,98) n$$,'up to one hundred owned sets are allowed');
select throws_ok($$insert into public.study_sets(owner_id,title) values ('fde00000-0000-4000-8000-000000000001','Overflow set')$$,'P0001',null,'the owned set limit is enforced');

reset role;
select set_config('request.jwt.claim.sub','fde00000-0000-4000-8000-000000000002',true);
set local role authenticated;
delete from public.study_sets where id='fde00000-0000-4000-8000-000000000011';
select is((select count(*)::int from public.study_cards where set_id='fde00000-0000-4000-8000-000000000011'),0,'deleting a set removes its cards');
reset role;
select set_config('request.jwt.claim.sub','fde00000-0000-4000-8000-000000000003',true);
set local role authenticated;
select is((select count(*)::int from public.study_card_reviews),0,'deleting a set removes reader review records too');
reset role;
select * from finish();
rollback;
