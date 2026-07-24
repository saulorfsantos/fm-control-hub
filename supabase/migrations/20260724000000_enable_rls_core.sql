-- Liga RLS nas tabelas financeiras centrais e remove acesso do anon
alter table public.schools                  enable row level security;
alter table public.accountability_processes enable row level security;
alter table public.financial_transactions   enable row level security;

drop policy if exists "Allow anon insert schools" on public.schools;
drop policy if exists "Allow anon select schools" on public.schools;
drop policy if exists "anon_insert_processes"     on public.accountability_processes;
drop policy if exists "anon_select_processes"     on public.accountability_processes;

revoke select on public.school_balances                  from anon;
revoke select on public.school_transactions_with_program from anon;
revoke select on public.school_active_programs           from anon;
revoke select on public.v_process_summary                from anon;
