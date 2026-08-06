-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- CreateTable
CREATE TABLE "permissoes" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "permissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissoes_papeis" (
    "permissaoId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "permitido" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "permissoes_papeis_pkey" PRIMARY KEY ("permissaoId","role")
);

-- CreateTable
CREATE TABLE "permissoes_usuarios" (
    "usuarioId" TEXT NOT NULL,
    "permissaoId" TEXT NOT NULL,
    "permitido" BOOLEAN NOT NULL,

    CONSTRAINT "permissoes_usuarios_pkey" PRIMARY KEY ("usuarioId","permissaoId")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "usuarioNome" TEXT,
    "usuarioEmail" TEXT,
    "acao" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "recurso" TEXT,
    "recursoId" TEXT,
    "descricao" TEXT NOT NULL,
    "dadosAntes" JSONB,
    "dadosDepois" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "sucesso" BOOLEAN NOT NULL DEFAULT true,
    "erro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissoes_chave_key" ON "permissoes"("chave");

-- CreateIndex
CREATE INDEX "permissoes_modulo_idx" ON "permissoes"("modulo");

-- CreateIndex
CREATE INDEX "permissoes_papeis_role_idx" ON "permissoes_papeis"("role");

-- CreateIndex
CREATE INDEX "permissoes_usuarios_permissaoId_idx" ON "permissoes_usuarios"("permissaoId");

-- CreateIndex
CREATE INDEX "logs_auditoria_usuarioId_createdAt_idx" ON "logs_auditoria"("usuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "logs_auditoria_acao_createdAt_idx" ON "logs_auditoria"("acao", "createdAt");

-- CreateIndex
CREATE INDEX "logs_auditoria_modulo_createdAt_idx" ON "logs_auditoria"("modulo", "createdAt");

-- AddForeignKey
ALTER TABLE "permissoes_papeis" ADD CONSTRAINT "permissoes_papeis_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "permissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissoes_usuarios" ADD CONSTRAINT "permissoes_usuarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissoes_usuarios" ADD CONSTRAINT "permissoes_usuarios_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "permissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
