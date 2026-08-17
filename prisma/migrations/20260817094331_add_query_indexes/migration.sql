-- CreateIndex
CREATE INDEX "Payment_invoiceId_createdAt_idx" ON "Payment"("invoiceId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentMethodReference_workspaceId_idx" ON "PaymentMethodReference"("workspaceId");

-- CreateIndex
CREATE INDEX "SupportMessage_ticketId_createdAt_idx" ON "SupportMessage"("ticketId", "createdAt");
