-- One catalog row represents one medicine/lot combination. A barcode can repeat
-- across batches, but the same barcode + batch must not be registered twice.
DROP INDEX IF EXISTS "medicamentos_codigoBarras_key";
CREATE UNIQUE INDEX "medicamentos_codigoBarras_lote_key"
  ON "medicamentos" ("codigoBarras", "lote");

ALTER TABLE "pedidos"
  ADD COLUMN "lote" TEXT,
  ADD COLUMN "validade" TIMESTAMP(3);
UPDATE "pedidos" AS p
SET "lote" = m."lote", "validade" = m."validade"
FROM "medicamentos" AS m
WHERE p."medicamentoId" = m."id";

ALTER TABLE "movimentacoes"
  ADD COLUMN "lote" TEXT,
  ADD COLUMN "validade" TIMESTAMP(3);
UPDATE "movimentacoes" AS mov
SET "lote" = m."lote", "validade" = m."validade"
FROM "medicamentos" AS m
WHERE mov."medicamentoId" = m."id";

CREATE OR REPLACE FUNCTION "movimentacoes_reject_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Movimentações de estoque são append-only.' USING ERRCODE = '55000';
END $$;

CREATE TRIGGER "movimentacoes_reject_update_delete"
BEFORE UPDATE OR DELETE ON "movimentacoes"
FOR EACH ROW EXECUTE FUNCTION "movimentacoes_reject_mutation"();

CREATE TRIGGER "movimentacoes_reject_truncate"
BEFORE TRUNCATE ON "movimentacoes"
FOR EACH STATEMENT EXECUTE FUNCTION "movimentacoes_reject_mutation"();
