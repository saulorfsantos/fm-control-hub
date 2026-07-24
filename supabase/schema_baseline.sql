


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."auth_school_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT school_id FROM users WHERE id = auth.uid()
$$;


ALTER FUNCTION "public"."auth_school_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_forte_mais_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'forte_mais_admin'
  )
$$;


ALTER FUNCTION "public"."is_forte_mais_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_school_name"("input" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  result text;
BEGIN
  IF input IS NULL THEN RETURN ''; END IF;

  result := upper(input);
  result := translate(result, 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC');

  result := regexp_replace(result, '\bADV\.', 'ADVOGADO', 'g');
  result := regexp_replace(result, '\bPROFA?\.', 'PROFESSOR', 'g');
  result := regexp_replace(result, '\bMUN\.', 'MUNICIPAL', 'g');
  result := regexp_replace(result, '\bEST\.', 'ESTADUAL', 'g');
  result := regexp_replace(result, '\bTEC\.', 'TECNICA', 'g');
  result := regexp_replace(result, '\bDR\.', 'DOUTOR', 'g');
  result := regexp_replace(result, '\bSR\.', 'SENHOR', 'g');
  result := regexp_replace(result, '\bPREF\.', 'PREFEITO', 'g');
  result := regexp_replace(result, '\bE\.M\.', 'ESCOLA MUNICIPAL', 'g');
  result := regexp_replace(result, '\bE\.E\.', 'ESCOLA ESTADUAL', 'g');
  result := regexp_replace(result, '\bEMEF\b', 'ESCOLA MUNICIPAL', 'g');
  result := regexp_replace(result, '\bCEMEI\b', 'CENTRO MUNICIPAL EDUCACAO INFANTIL', 'g');
  result := regexp_replace(result, '\bCMEI\b', 'CENTRO MUNICIPAL EDUCACAO INFANTIL', 'g');
  result := regexp_replace(result, '\bETE\b', 'ESCOLA TECNICA ESTADUAL', 'g');
  result := regexp_replace(result, '\bEREM\b', 'ESCOLA REFERENCIA ENSINO MEDIO', 'g');

  result := regexp_replace(result, '[^A-Z0-9\s]', ' ', 'g');
  result := regexp_replace(result, '\s+', ' ', 'g');
  result := trim(result);

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."normalize_school_name"("input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."schools_update_nome_busca"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.nome_busca := normalize_school_name(NEW.name);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."schools_update_nome_busca"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_process_total_spent"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE accountability_processes
    SET total_spent = (
        SELECT COALESCE(SUM(debito), 0)
        FROM financial_transactions
        WHERE process_id = COALESCE(NEW.process_id, OLD.process_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.process_id, OLD.process_id);
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_process_total_spent"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."accountability_processes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "school_id" "uuid" NOT NULL,
    "program_id" "uuid",
    "regional_id" "uuid",
    "reference_period" "text" NOT NULL,
    "year" integer,
    "installment" integer,
    "status" "text" DEFAULT 'em_andamento'::"text" NOT NULL,
    "total_received" numeric(12,2) DEFAULT 0,
    "total_spent" numeric(12,2) DEFAULT 0,
    "commitment_note_number" "text",
    "payment_order_number" "text",
    "sigepe_number" "text",
    "accountability_ctrl_number" "text",
    "submitted_at" timestamp with time zone,
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "programa" "text",
    "periodo" "text",
    "observacao" "text",
    CONSTRAINT "accountability_processes_status_check" CHECK (("status" = ANY (ARRAY['em_andamento'::"text", 'aguardando_protocolo'::"text", 'protocolado'::"text", 'aprovado'::"text", 'com_pendencias'::"text"])))
);


ALTER TABLE "public"."accountability_processes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."council_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "council_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "cpf" "text",
    "signature_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "council_members_role_check" CHECK (("role" = ANY (ARRAY['presidente'::"text", 'secretario'::"text", 'tesoureiro'::"text", 'conselheiro'::"text", 'fiscal'::"text"])))
);


ALTER TABLE "public"."council_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."councils" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "school_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "cnpj" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."councils" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "process_id" "uuid" NOT NULL,
    "invoice_id" "uuid",
    "data" "date" NOT NULL,
    "descricao" "text" NOT NULL,
    "documento" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "empresa" character varying(255),
    "debito" numeric(15,2),
    "credito" numeric(15,2)
);


ALTER TABLE "public"."financial_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "product_name" "text" NOT NULL,
    "unit" "text",
    "quantity" numeric NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "total_price" numeric(10,2) GENERATED ALWAYS AS (("quantity" * "unit_price")) STORED
);


ALTER TABLE "public"."invoice_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "process_id" "uuid" NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "invoice_number" "text" NOT NULL,
    "issue_date" "date" NOT NULL,
    "total_amount" numeric(12,2) NOT NULL,
    "payment_type" "text" NOT NULL,
    "nfe_file_url" "text",
    "machine_receipt_url" "text",
    "authorization_use_url" "text",
    "stamp_paid" boolean DEFAULT false,
    "stamp_paid_see" boolean DEFAULT false,
    "stamp_received" boolean DEFAULT false,
    "stamp_pnae" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "invoices_payment_type_check" CHECK (("payment_type" = ANY (ARRAY['cartao'::"text", 'transferencia'::"text", 'cheque'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jurisdictions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "logo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "jurisdictions_type_check" CHECK (("type" = ANY (ARRAY['state'::"text", 'municipality'::"text"])))
);


ALTER TABLE "public"."jurisdictions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menus" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "process_id" "uuid" NOT NULL,
    "description" "text",
    "file_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."menus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_research" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "process_id" "uuid" NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "research_date" "date" NOT NULL,
    "file_url" "text",
    "is_signed" boolean DEFAULT false,
    "is_stamped" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."price_research" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_research_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "price_research_id" "uuid" NOT NULL,
    "product_name" "text" NOT NULL,
    "unit" "text",
    "quantity" numeric,
    "unit_price" numeric(10,2)
);


ALTER TABLE "public"."price_research_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_verification" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "process_id" "uuid" NOT NULL,
    "chosen_supplier_id" "uuid" NOT NULL,
    "justification" "text",
    "file_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."price_verification" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."process_checklist_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "process_id" "uuid" NOT NULL,
    "order_number" integer NOT NULL,
    "item_name" "text" NOT NULL,
    "document_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "file_url" "text",
    "observations" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "process_checklist_items_document_type_check" CHECK (("document_type" = ANY (ARRAY['generated'::"text", 'manual_upload'::"text"]))),
    CONSTRAINT "process_checklist_items_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'anexado'::"text", 'gerado'::"text", 'nao_aplicavel'::"text"])))
);


ALTER TABLE "public"."process_checklist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."programs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "funding_source" "text" NOT NULL,
    "logo_url" "text",
    "requires_menu" boolean DEFAULT false,
    "requires_shopping_list" boolean DEFAULT false,
    "requires_certifications" boolean DEFAULT false,
    "requires_price_research" boolean DEFAULT true,
    "requires_purchase_order" boolean DEFAULT true,
    "expense_type" "text" DEFAULT 'custeio'::"text",
    "checklist_config" "jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "programs_expense_type_check" CHECK (("expense_type" = ANY (ARRAY['custeio'::"text", 'permanente'::"text", 'ambos'::"text"])))
);


ALTER TABLE "public"."programs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "process_id" "uuid" NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "order_date" "date" NOT NULL,
    "items" "jsonb" NOT NULL,
    "total_amount" numeric(12,2) NOT NULL,
    "file_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."purchase_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."regionals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."regionals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schools" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "jurisdiction_id" "uuid",
    "regional_id" "uuid",
    "name" "text" NOT NULL,
    "inep_code" "text",
    "cnpj" "text",
    "type" "text",
    "address" "text",
    "city" "text",
    "phone" "text",
    "principal_name" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "endereco" "text",
    "telefone" "text",
    "director_name" "text",
    "diretor" "text",
    "codigo_inep" "text",
    "jurisdiction" "text",
    "nome_busca" "text",
    CONSTRAINT "schools_type_check" CHECK (("type" = ANY (ARRAY['estadual'::"text", 'municipal'::"text", 'etech'::"text"])))
);


ALTER TABLE "public"."schools" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."school_active_programs" AS
 SELECT "s"."id" AS "school_id",
    "ap"."id" AS "process_id",
    "ap"."programa",
    "ap"."periodo",
    (("ap"."programa" || ' '::"text") || COALESCE("ap"."periodo", ''::"text")) AS "label",
    (COALESCE("sum"("ft"."credito"), (0)::numeric) - COALESCE("sum"("ft"."debito"), (0)::numeric)) AS "saldo_programa"
   FROM (("public"."schools" "s"
     JOIN "public"."accountability_processes" "ap" ON (("ap"."school_id" = "s"."id")))
     LEFT JOIN "public"."financial_transactions" "ft" ON (("ft"."process_id" = "ap"."id")))
  GROUP BY "s"."id", "ap"."id", "ap"."programa", "ap"."periodo"
  ORDER BY "ap"."programa", "ap"."periodo" DESC;


ALTER VIEW "public"."school_active_programs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."school_balances" AS
 SELECT "s"."id" AS "school_id",
    "s"."name",
    "s"."cnpj",
    "s"."address",
    "s"."type",
    COALESCE("sum"("ft"."credito"), (0)::numeric) AS "total_credito",
    COALESCE("sum"("ft"."debito"), (0)::numeric) AS "total_debito",
    (COALESCE("sum"("ft"."credito"), (0)::numeric) - COALESCE("sum"("ft"."debito"), (0)::numeric)) AS "saldo",
    "max"("ft"."data") AS "ultima_movimentacao",
    "count"("ft"."id") AS "qtd_transacoes"
   FROM (("public"."schools" "s"
     LEFT JOIN "public"."accountability_processes" "ap" ON (("ap"."school_id" = "s"."id")))
     LEFT JOIN "public"."financial_transactions" "ft" ON (("ft"."process_id" = "ap"."id")))
  GROUP BY "s"."id", "s"."name", "s"."cnpj", "s"."address", "s"."type";


ALTER VIEW "public"."school_balances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."school_cnpjs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "school_id" "uuid" NOT NULL,
    "cnpj" "text" NOT NULL,
    "cnpj_clean" "text" NOT NULL,
    "razao_social_tagplus" "text",
    "nome_fantasia_tagplus" "text",
    "match_score" numeric,
    "match_via" "text",
    "observacao" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."school_cnpjs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."school_programs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "school_id" "uuid" NOT NULL,
    "program_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."school_programs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."school_transactions_with_program" AS
 SELECT "ft"."id",
    "ap"."school_id",
    "ft"."process_id",
    "ap"."programa",
    "ap"."periodo",
    (("ap"."programa" || ' '::"text") || COALESCE("ap"."periodo", ''::"text")) AS "programa_label",
    "ft"."data",
    "ft"."descricao",
    "ft"."documento",
    "ft"."empresa",
    "ft"."debito",
    "ft"."credito"
   FROM ("public"."financial_transactions" "ft"
     JOIN "public"."accountability_processes" "ap" ON (("ap"."id" = "ft"."process_id")));


ALTER VIEW "public"."school_transactions_with_program" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopping_list_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "shopping_list_id" "uuid" NOT NULL,
    "product_name" "text" NOT NULL,
    "unit" "text",
    "quantity" numeric,
    "estimated_price" numeric(10,2)
);


ALTER TABLE "public"."shopping_list_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopping_lists" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "process_id" "uuid" NOT NULL,
    "file_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shopping_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "cnpj" "text",
    "phone" "text",
    "address" "text",
    "city" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tag_plus_events_inbox" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "external_id" "text" NOT NULL,
    "raw_webhook_payload" "jsonb",
    "raw_document" "jsonb",
    "cliente_nome" "text",
    "cliente_nome_normalizado" "text",
    "cliente_cnpj" "text",
    "valor" numeric,
    "documento_numero" "text",
    "data_evento" timestamp with time zone,
    "matched_school_id" "uuid",
    "matched_process_id" "uuid",
    "inserted_transaction_id" "uuid",
    "status" "text" DEFAULT 'received'::"text" NOT NULL,
    "observacao" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone
);


ALTER TABLE "public"."tag_plus_events_inbox" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."tag_plus_inbox_pending" AS
 SELECT "id",
    "created_at",
    "event_type",
    "cliente_nome",
    "valor",
    "documento_numero",
    "status",
    "observacao"
   FROM "public"."tag_plus_events_inbox" "i"
  WHERE ("status" = ANY (ARRAY['pending_match'::"text", 'error_fetch'::"text", 'error_insert'::"text"]))
  ORDER BY "created_at" DESC;


ALTER VIEW "public"."tag_plus_inbox_pending" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "school_id" "uuid",
    "role" "text" NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['forte_mais_admin'::"text", 'school_user'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_process_summary" AS
 SELECT "process_id",
    COALESCE("sum"("credito"), (0)::numeric) AS "total_received",
    COALESCE("sum"("debito"), (0)::numeric) AS "total_spent",
    (COALESCE("sum"("credito"), (0)::numeric) - COALESCE("sum"("debito"), (0)::numeric)) AS "balance"
   FROM "public"."financial_transactions"
  GROUP BY "process_id";


ALTER VIEW "public"."v_process_summary" OWNER TO "postgres";


ALTER TABLE ONLY "public"."accountability_processes"
    ADD CONSTRAINT "accountability_processes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."council_members"
    ADD CONSTRAINT "council_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."councils"
    ADD CONSTRAINT "councils_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_transactions"
    ADD CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jurisdictions"
    ADD CONSTRAINT "jurisdictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menus"
    ADD CONSTRAINT "menus_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."price_research_items"
    ADD CONSTRAINT "price_research_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."price_research"
    ADD CONSTRAINT "price_research_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."price_verification"
    ADD CONSTRAINT "price_verification_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."price_verification"
    ADD CONSTRAINT "price_verification_process_id_key" UNIQUE ("process_id");



ALTER TABLE ONLY "public"."process_checklist_items"
    ADD CONSTRAINT "process_checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."regionals"
    ADD CONSTRAINT "regionals_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."regionals"
    ADD CONSTRAINT "regionals_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."regionals"
    ADD CONSTRAINT "regionals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."school_cnpjs"
    ADD CONSTRAINT "school_cnpjs_cnpj_clean_key" UNIQUE ("cnpj_clean");



ALTER TABLE ONLY "public"."school_cnpjs"
    ADD CONSTRAINT "school_cnpjs_cnpj_key" UNIQUE ("cnpj");



ALTER TABLE ONLY "public"."school_cnpjs"
    ADD CONSTRAINT "school_cnpjs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."school_programs"
    ADD CONSTRAINT "school_programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."school_programs"
    ADD CONSTRAINT "school_programs_school_id_program_id_key" UNIQUE ("school_id", "program_id");



ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_inep_code_key" UNIQUE ("inep_code");



ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopping_list_items"
    ADD CONSTRAINT "shopping_list_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopping_lists"
    ADD CONSTRAINT "shopping_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_cnpj_key" UNIQUE ("cnpj");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tag_plus_events_inbox"
    ADD CONSTRAINT "tag_plus_events_inbox_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tag_plus_events_inbox"
    ADD CONSTRAINT "uq_tag_plus_event" UNIQUE ("event_type", "external_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_school_cnpjs_clean" ON "public"."school_cnpjs" USING "btree" ("cnpj_clean");



CREATE INDEX "idx_school_cnpjs_school" ON "public"."school_cnpjs" USING "btree" ("school_id");



CREATE INDEX "idx_schools_nome_busca" ON "public"."schools" USING "btree" ("nome_busca");



CREATE INDEX "idx_tag_plus_inbox_cliente_norm" ON "public"."tag_plus_events_inbox" USING "btree" ("cliente_nome_normalizado");



CREATE INDEX "idx_tag_plus_inbox_created" ON "public"."tag_plus_events_inbox" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_tag_plus_inbox_school" ON "public"."tag_plus_events_inbox" USING "btree" ("matched_school_id");



CREATE INDEX "idx_tag_plus_inbox_status" ON "public"."tag_plus_events_inbox" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "trg_schools_nome_busca" BEFORE INSERT OR UPDATE OF "name" ON "public"."schools" FOR EACH ROW EXECUTE FUNCTION "public"."schools_update_nome_busca"();



CREATE OR REPLACE TRIGGER "trg_update_total_spent" AFTER INSERT OR DELETE OR UPDATE ON "public"."financial_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_process_total_spent"();



ALTER TABLE ONLY "public"."accountability_processes"
    ADD CONSTRAINT "accountability_processes_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id");



ALTER TABLE ONLY "public"."accountability_processes"
    ADD CONSTRAINT "accountability_processes_regional_id_fkey" FOREIGN KEY ("regional_id") REFERENCES "public"."regionals"("id");



ALTER TABLE ONLY "public"."accountability_processes"
    ADD CONSTRAINT "accountability_processes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id");



ALTER TABLE ONLY "public"."council_members"
    ADD CONSTRAINT "council_members_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "public"."councils"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."councils"
    ADD CONSTRAINT "councils_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_transactions"
    ADD CONSTRAINT "financial_transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id");



ALTER TABLE ONLY "public"."financial_transactions"
    ADD CONSTRAINT "financial_transactions_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."accountability_processes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."accountability_processes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."menus"
    ADD CONSTRAINT "menus_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."accountability_processes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."price_research_items"
    ADD CONSTRAINT "price_research_items_price_research_id_fkey" FOREIGN KEY ("price_research_id") REFERENCES "public"."price_research"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."price_research"
    ADD CONSTRAINT "price_research_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."accountability_processes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."price_research"
    ADD CONSTRAINT "price_research_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."price_verification"
    ADD CONSTRAINT "price_verification_chosen_supplier_id_fkey" FOREIGN KEY ("chosen_supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."price_verification"
    ADD CONSTRAINT "price_verification_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."accountability_processes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."process_checklist_items"
    ADD CONSTRAINT "process_checklist_items_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."accountability_processes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."accountability_processes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."school_cnpjs"
    ADD CONSTRAINT "school_cnpjs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."school_programs"
    ADD CONSTRAINT "school_programs_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id");



ALTER TABLE ONLY "public"."school_programs"
    ADD CONSTRAINT "school_programs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_jurisdiction_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id");



ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_regional_id_fkey" FOREIGN KEY ("regional_id") REFERENCES "public"."regionals"("id");



ALTER TABLE ONLY "public"."shopping_list_items"
    ADD CONSTRAINT "shopping_list_items_shopping_list_id_fkey" FOREIGN KEY ("shopping_list_id") REFERENCES "public"."shopping_lists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopping_lists"
    ADD CONSTRAINT "shopping_lists_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."accountability_processes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tag_plus_events_inbox"
    ADD CONSTRAINT "tag_plus_events_inbox_inserted_transaction_id_fkey" FOREIGN KEY ("inserted_transaction_id") REFERENCES "public"."financial_transactions"("id");



ALTER TABLE ONLY "public"."tag_plus_events_inbox"
    ADD CONSTRAINT "tag_plus_events_inbox_matched_process_id_fkey" FOREIGN KEY ("matched_process_id") REFERENCES "public"."accountability_processes"("id");



ALTER TABLE ONLY "public"."tag_plus_events_inbox"
    ADD CONSTRAINT "tag_plus_events_inbox_matched_school_id_fkey" FOREIGN KEY ("matched_school_id") REFERENCES "public"."schools"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id");



CREATE POLICY "Allow anon insert schools" ON "public"."schools" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anon select schools" ON "public"."schools" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_insert_processes" ON "public"."accountability_processes" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "anon_select_processes" ON "public"."accountability_processes" FOR SELECT TO "anon" USING (true);



CREATE POLICY "checklist_access" ON "public"."process_checklist_items" TO "authenticated" USING (("public"."is_forte_mais_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."accountability_processes" "ap"
  WHERE (("ap"."id" = "process_checklist_items"."process_id") AND ("ap"."school_id" = "public"."auth_school_id"()))))));



ALTER TABLE "public"."council_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."councils" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invoices_access" ON "public"."invoices" TO "authenticated" USING (("public"."is_forte_mais_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."accountability_processes" "ap"
  WHERE (("ap"."id" = "invoices"."process_id") AND ("ap"."school_id" = "public"."auth_school_id"()))))));



ALTER TABLE "public"."jurisdictions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "jurisdictions_read" ON "public"."jurisdictions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."menus" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."price_research" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."price_research_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."price_verification" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."process_checklist_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "processes_access" ON "public"."accountability_processes" TO "authenticated" USING (("public"."is_forte_mais_admin"() OR ("school_id" = "public"."auth_school_id"())));



ALTER TABLE "public"."programs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "programs_read" ON "public"."programs" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."purchase_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."regionals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "regionals_read" ON "public"."regionals" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."school_programs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "schools_access" ON "public"."schools" TO "authenticated" USING (("public"."is_forte_mais_admin"() OR ("id" = "public"."auth_school_id"())));



ALTER TABLE "public"."shopping_list_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shopping_lists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "suppliers_read" ON "public"."suppliers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "suppliers_write" ON "public"."suppliers" TO "authenticated" USING ("public"."is_forte_mais_admin"());



CREATE POLICY "transactions_access" ON "public"."financial_transactions" TO "authenticated" USING (("public"."is_forte_mais_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."accountability_processes" "ap"
  WHERE (("ap"."id" = "financial_transactions"."process_id") AND ("ap"."school_id" = "public"."auth_school_id"()))))));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_access" ON "public"."users" TO "authenticated" USING (("public"."is_forte_mais_admin"() OR ("id" = "auth"."uid"())));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."auth_school_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_school_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_school_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_forte_mais_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_forte_mais_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_forte_mais_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_school_name"("input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_school_name"("input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_school_name"("input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."schools_update_nome_busca"() TO "anon";
GRANT ALL ON FUNCTION "public"."schools_update_nome_busca"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."schools_update_nome_busca"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_process_total_spent"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_process_total_spent"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_process_total_spent"() TO "service_role";


















GRANT ALL ON TABLE "public"."accountability_processes" TO "anon";
GRANT ALL ON TABLE "public"."accountability_processes" TO "authenticated";
GRANT ALL ON TABLE "public"."accountability_processes" TO "service_role";



GRANT ALL ON TABLE "public"."council_members" TO "anon";
GRANT ALL ON TABLE "public"."council_members" TO "authenticated";
GRANT ALL ON TABLE "public"."council_members" TO "service_role";



GRANT ALL ON TABLE "public"."councils" TO "anon";
GRANT ALL ON TABLE "public"."councils" TO "authenticated";
GRANT ALL ON TABLE "public"."councils" TO "service_role";



GRANT ALL ON TABLE "public"."financial_transactions" TO "anon";
GRANT ALL ON TABLE "public"."financial_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_items" TO "anon";
GRANT ALL ON TABLE "public"."invoice_items" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_items" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."jurisdictions" TO "anon";
GRANT ALL ON TABLE "public"."jurisdictions" TO "authenticated";
GRANT ALL ON TABLE "public"."jurisdictions" TO "service_role";



GRANT ALL ON TABLE "public"."menus" TO "anon";
GRANT ALL ON TABLE "public"."menus" TO "authenticated";
GRANT ALL ON TABLE "public"."menus" TO "service_role";



GRANT ALL ON TABLE "public"."price_research" TO "anon";
GRANT ALL ON TABLE "public"."price_research" TO "authenticated";
GRANT ALL ON TABLE "public"."price_research" TO "service_role";



GRANT ALL ON TABLE "public"."price_research_items" TO "anon";
GRANT ALL ON TABLE "public"."price_research_items" TO "authenticated";
GRANT ALL ON TABLE "public"."price_research_items" TO "service_role";



GRANT ALL ON TABLE "public"."price_verification" TO "anon";
GRANT ALL ON TABLE "public"."price_verification" TO "authenticated";
GRANT ALL ON TABLE "public"."price_verification" TO "service_role";



GRANT ALL ON TABLE "public"."process_checklist_items" TO "anon";
GRANT ALL ON TABLE "public"."process_checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."process_checklist_items" TO "service_role";



GRANT ALL ON TABLE "public"."programs" TO "anon";
GRANT ALL ON TABLE "public"."programs" TO "authenticated";
GRANT ALL ON TABLE "public"."programs" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_orders" TO "service_role";



GRANT ALL ON TABLE "public"."regionals" TO "anon";
GRANT ALL ON TABLE "public"."regionals" TO "authenticated";
GRANT ALL ON TABLE "public"."regionals" TO "service_role";



GRANT ALL ON TABLE "public"."schools" TO "anon";
GRANT ALL ON TABLE "public"."schools" TO "authenticated";
GRANT ALL ON TABLE "public"."schools" TO "service_role";



GRANT ALL ON TABLE "public"."school_active_programs" TO "anon";
GRANT ALL ON TABLE "public"."school_active_programs" TO "authenticated";
GRANT ALL ON TABLE "public"."school_active_programs" TO "service_role";



GRANT ALL ON TABLE "public"."school_balances" TO "anon";
GRANT ALL ON TABLE "public"."school_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."school_balances" TO "service_role";



GRANT ALL ON TABLE "public"."school_cnpjs" TO "anon";
GRANT ALL ON TABLE "public"."school_cnpjs" TO "authenticated";
GRANT ALL ON TABLE "public"."school_cnpjs" TO "service_role";



GRANT ALL ON TABLE "public"."school_programs" TO "anon";
GRANT ALL ON TABLE "public"."school_programs" TO "authenticated";
GRANT ALL ON TABLE "public"."school_programs" TO "service_role";



GRANT ALL ON TABLE "public"."school_transactions_with_program" TO "anon";
GRANT ALL ON TABLE "public"."school_transactions_with_program" TO "authenticated";
GRANT ALL ON TABLE "public"."school_transactions_with_program" TO "service_role";



GRANT ALL ON TABLE "public"."shopping_list_items" TO "anon";
GRANT ALL ON TABLE "public"."shopping_list_items" TO "authenticated";
GRANT ALL ON TABLE "public"."shopping_list_items" TO "service_role";



GRANT ALL ON TABLE "public"."shopping_lists" TO "anon";
GRANT ALL ON TABLE "public"."shopping_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."shopping_lists" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."tag_plus_events_inbox" TO "anon";
GRANT ALL ON TABLE "public"."tag_plus_events_inbox" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_plus_events_inbox" TO "service_role";



GRANT ALL ON TABLE "public"."tag_plus_inbox_pending" TO "anon";
GRANT ALL ON TABLE "public"."tag_plus_inbox_pending" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_plus_inbox_pending" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."v_process_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_process_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_process_summary" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































