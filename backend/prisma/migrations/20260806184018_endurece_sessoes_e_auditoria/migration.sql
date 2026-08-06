-- AlterTable
ALTER TABLE "logs_auditoria" ADD COLUMN     "requestId" TEXT;

-- CreateIndex
CREATE INDEX "logs_auditoria_requestId_idx" ON "logs_auditoria"("requestId");
