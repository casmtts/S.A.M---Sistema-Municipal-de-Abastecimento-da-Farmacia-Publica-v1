-- Keep an immutable actor snapshot in the audit row rather than a foreign key
-- whose ON DELETE SET NULL action would mutate historical records.
ALTER TABLE "logs_auditoria"
  DROP CONSTRAINT IF EXISTS "logs_auditoria_usuarioId_fkey";

CREATE SEQUENCE "logs_auditoria_sequencia_seq";
ALTER TABLE "logs_auditoria" ADD COLUMN "sequencia" BIGINT;
ALTER TABLE "logs_auditoria" ADD COLUMN "previousHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "logs_auditoria" ADD COLUMN "eventHash" TEXT NOT NULL DEFAULT '';

WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS position
  FROM "logs_auditoria"
)
UPDATE "logs_auditoria" AS log
SET "sequencia" = ranked.position
FROM ranked
WHERE log."id" = ranked."id";

ALTER TABLE "logs_auditoria"
  ALTER COLUMN "sequencia" SET DEFAULT 0,
  ALTER COLUMN "sequencia" SET NOT NULL;
ALTER SEQUENCE "logs_auditoria_sequencia_seq" OWNED BY "logs_auditoria"."sequencia";
SELECT setval(
  '"logs_auditoria_sequencia_seq"',
  GREATEST(COALESCE((SELECT MAX("sequencia") FROM "logs_auditoria"), 0), 1),
  EXISTS (SELECT 1 FROM "logs_auditoria")
);

CREATE UNIQUE INDEX "logs_auditoria_sequencia_key" ON "logs_auditoria"("sequencia");
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Minimize direct identifiers in the pre-existing immutable audit rows before
-- calculating the baseline hashes. Account IDs remain for accountability; names,
-- emails, IPs, user agents and direct identifiers in snapshots are removed.
CREATE OR REPLACE FUNCTION "logs_auditoria_redact_json"(value JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result JSONB;
BEGIN
  IF jsonb_typeof(value) = 'object' THEN
    SELECT COALESCE(jsonb_object_agg(key, "logs_auditoria_redact_json"(item)), '{}'::JSONB)
    INTO result
    FROM jsonb_each(value) AS fields(key, item)
    WHERE lower(key) NOT IN ('nome', 'name', 'email', 'cpf', 'telefone', 'phone', 'ip', 'useragent', 'usuarioemail', 'usuarionome', 'senha', 'password', 'token', 'authorization', 'cookie');
    RETURN result;
  ELSIF jsonb_typeof(value) = 'array' THEN
    SELECT COALESCE(jsonb_agg("logs_auditoria_redact_json"(item)), '[]'::JSONB) INTO result
    FROM jsonb_array_elements(value) AS elements(item);
    RETURN result;
  END IF;
  RETURN value;
END $$;

UPDATE "logs_auditoria"
SET "usuarioNome" = CASE WHEN "usuarioId" IS NULL THEN 'Sistema' ELSE 'Conta ' || left("usuarioId", 8) END,
    "usuarioEmail" = NULL,
    "ip" = NULL,
    "userAgent" = NULL,
    "dadosAntes" = "logs_auditoria_redact_json"("dadosAntes"),
    "dadosDepois" = "logs_auditoria_redact_json"("dadosDepois");
DROP FUNCTION "logs_auditoria_redact_json"(JSONB);

-- Seed a verifiable chain for the existing audit history before installing
-- the append-only triggers.
DO $$
DECLARE
  item RECORD;
  previous_hash TEXT := repeat('0', 64);
  item_hash TEXT;
  payload JSONB;
BEGIN
  FOR item IN SELECT * FROM "logs_auditoria" ORDER BY "sequencia" LOOP
    payload := to_jsonb(item) - 'previousHash' - 'eventHash';
    item_hash := encode(
      digest(convert_to(previous_hash || ':' || payload::TEXT, 'UTF8'), 'sha256'),
      'hex'
    );
    UPDATE "logs_auditoria"
    SET "previousHash" = previous_hash, "eventHash" = item_hash
    WHERE "id" = item."id";
    previous_hash := item_hash;
  END LOOP;
END $$;

CREATE UNIQUE INDEX "logs_auditoria_eventHash_key" ON "logs_auditoria"("eventHash");

CREATE OR REPLACE FUNCTION "logs_auditoria_set_hash"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  previous_hash TEXT;
  payload JSONB;
BEGIN
  PERFORM pg_advisory_xact_lock(1396788564, 1);

  -- Allocate the chain sequence only after taking the lock so concurrent
  -- inserts cannot fork or reorder the hash chain.
  NEW."sequencia" := nextval('"logs_auditoria_sequencia_seq"');
  SELECT "eventHash" INTO previous_hash
  FROM "logs_auditoria"
  ORDER BY "sequencia" DESC
  LIMIT 1;

  NEW."previousHash" := COALESCE(previous_hash, repeat('0', 64));
  payload := to_jsonb(NEW) - 'previousHash' - 'eventHash';
  NEW."eventHash" := encode(
    digest(convert_to(NEW."previousHash" || ':' || payload::TEXT, 'UTF8'), 'sha256'),
    'hex'
  );
  RETURN NEW;
END $$;

CREATE TRIGGER "logs_auditoria_hash_on_insert"
BEFORE INSERT ON "logs_auditoria"
FOR EACH ROW EXECUTE FUNCTION "logs_auditoria_set_hash"();

CREATE OR REPLACE FUNCTION "logs_auditoria_reject_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Registros de auditoria são append-only.' USING ERRCODE = '55000';
END $$;

CREATE TRIGGER "logs_auditoria_reject_update_delete"
BEFORE UPDATE OR DELETE ON "logs_auditoria"
FOR EACH ROW EXECUTE FUNCTION "logs_auditoria_reject_mutation"();

CREATE TRIGGER "logs_auditoria_reject_truncate"
BEFORE TRUNCATE ON "logs_auditoria"
FOR EACH STATEMENT EXECUTE FUNCTION "logs_auditoria_reject_mutation"();

CREATE OR REPLACE FUNCTION "logs_auditoria_verificar_integridade"()
RETURNS TABLE ("valido" BOOLEAN, "total" BIGINT, "sequenciaErro" BIGINT)
LANGUAGE plpgsql
AS $$
DECLARE
  item RECORD;
  expected_previous TEXT := repeat('0', 64);
  calculated_hash TEXT;
  payload JSONB;
  checked BIGINT := 0;
BEGIN
  FOR item IN SELECT * FROM "logs_auditoria" ORDER BY "sequencia" LOOP
    payload := to_jsonb(item) - 'previousHash' - 'eventHash';
    calculated_hash := encode(
      digest(convert_to(COALESCE(item."previousHash", '') || ':' || payload::TEXT, 'UTF8'), 'sha256'),
      'hex'
    );
    checked := checked + 1;
    IF item."previousHash" IS DISTINCT FROM expected_previous
       OR item."eventHash" IS DISTINCT FROM calculated_hash THEN
      RETURN QUERY SELECT FALSE, checked, item."sequencia";
      RETURN;
    END IF;
    expected_previous := item."eventHash";
  END LOOP;

  RETURN QUERY SELECT TRUE, checked, NULL::BIGINT;
END $$;
