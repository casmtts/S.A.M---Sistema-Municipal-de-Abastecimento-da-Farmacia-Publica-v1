CREATE TYPE "TipoSolicitacaoPrivacidade" AS ENUM ('ACESSO', 'CORRECAO', 'ELIMINACAO');
CREATE TYPE "StatusSolicitacaoPrivacidade" AS ENUM ('ABERTA', 'EM_ANALISE', 'CONCLUIDA', 'RECUSADA');
CREATE TABLE "solicitacoes_privacidade" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "tipo" "TipoSolicitacaoPrivacidade" NOT NULL,
  "descricao" VARCHAR(1000),
  "status" "StatusSolicitacaoPrivacidade" NOT NULL DEFAULT 'ABERTA',
  "resposta" VARCHAR(2000),
  "atendidaPor" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "solicitacoes_privacidade_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "solicitacoes_privacidade_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "solicitacoes_privacidade_usuarioId_createdAt_idx" ON "solicitacoes_privacidade"("usuarioId", "createdAt");
CREATE INDEX "solicitacoes_privacidade_status_createdAt_idx" ON "solicitacoes_privacidade"("status", "createdAt");
DO $$
BEGIN
  IF EXISTS (
    SELECT lower(btrim("email"))
    FROM "usuarios"
    GROUP BY lower(btrim("email"))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Há e-mails duplicados sem distinção entre maiúsculas/minúsculas; corrija-os antes de aplicar a migration de privacidade.';
  END IF;
END $$;
UPDATE "usuarios" SET "email" = lower(btrim("email"));
ALTER TABLE "usuarios" ALTER COLUMN "senha" TYPE VARCHAR(255);
