-- Draft migrations for events responses
create table if not exists event_responses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  submitted_by uuid references users(id),
  submitted_at timestamptz not null default timezone(''utc'', now())
);

create table if not exists event_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references event_responses(id) on delete cascade,
  question_id uuid not null references event_questions(id),
  value text,
  created_at timestamptz not null default timezone(''utc'', now())
);

create index if not exists event_answers_question_id_idx on event_answers(question_id);

