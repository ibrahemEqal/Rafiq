begin;

-- Match the exact public feed/detail pagination shapes. The trailing UUID
-- provides deterministic key order without an extra sort for equal timestamps.
create index if not exists idx_resources_status_created_id
  on public.resources (status, created_at desc, id desc);

create index if not exists idx_questions_created_id
  on public.questions (created_at desc, id desc);

create index if not exists idx_questions_course_created_id
  on public.questions (course_id, created_at desc, id desc);

create index if not exists idx_answers_question_created_id
  on public.answers (question_id, created_at desc, id desc);

commit;
