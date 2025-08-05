-- SuperChat table for tracking super chat donations
CREATE TABLE IF NOT EXISTS "super_chats" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "videoId" TEXT,
  "streamId" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT DEFAULT 'KRW',
  "message" TEXT,
  "color" TEXT, -- Color tier based on amount
  "isPaid" BOOLEAN DEFAULT false,
  "paymentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  
  CONSTRAINT "super_chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "super_chats_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE,
  CONSTRAINT "super_chats_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL
);

-- Creator earnings table
CREATE TABLE IF NOT EXISTS "creator_earnings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "channelId" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- 'superchat', 'membership', 'ads', 'sponsorship'
  "amount" DOUBLE PRECISION NOT NULL,
  "fee" DOUBLE PRECISION DEFAULT 0, -- Platform fee
  "netAmount" DOUBLE PRECISION NOT NULL, -- Amount after fee
  "referenceId" TEXT, -- SuperChat ID, Membership ID, etc.
  "description" TEXT,
  "month" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "creator_earnings_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE
);

-- Settlement requests table
CREATE TABLE IF NOT EXISTS "settlement_requests" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "channelId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  "bankName" TEXT,
  "bankAccount" TEXT,
  "accountHolder" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "adminNotes" TEXT,
  "proofUrl" TEXT, -- Transfer proof document
  
  CONSTRAINT "settlement_requests_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE
);

-- Add indexes
CREATE INDEX "super_chats_userId_idx" ON "super_chats"("userId");
CREATE INDEX "super_chats_channelId_idx" ON "super_chats"("channelId");
CREATE INDEX "super_chats_createdAt_idx" ON "super_chats"("createdAt");

CREATE INDEX "creator_earnings_channelId_idx" ON "creator_earnings"("channelId");
CREATE INDEX "creator_earnings_month_year_idx" ON "creator_earnings"("month", "year");
CREATE INDEX "creator_earnings_type_idx" ON "creator_earnings"("type");

CREATE INDEX "settlement_requests_channelId_idx" ON "settlement_requests"("channelId");
CREATE INDEX "settlement_requests_status_idx" ON "settlement_requests"("status");

-- Add superchat statistics to channels table
ALTER TABLE "channels" 
ADD COLUMN IF NOT EXISTS "totalSuperChatAmount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "totalEarnings" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "pendingSettlement" DOUBLE PRECISION DEFAULT 0;

-- Create views for earnings dashboard
CREATE OR REPLACE VIEW "channel_earnings_summary" AS
SELECT 
  ce.channelId,
  ce.month,
  ce.year,
  SUM(CASE WHEN ce.type = 'superchat' THEN ce.netAmount ELSE 0 END) as superchat_earnings,
  SUM(CASE WHEN ce.type = 'membership' THEN ce.netAmount ELSE 0 END) as membership_earnings,
  SUM(CASE WHEN ce.type = 'ads' THEN ce.netAmount ELSE 0 END) as ads_earnings,
  SUM(ce.netAmount) as total_earnings,
  COUNT(DISTINCT CASE WHEN ce.type = 'superchat' THEN ce.referenceId END) as superchat_count
FROM creator_earnings ce
GROUP BY ce.channelId, ce.month, ce.year;

-- Create view for admin superchat dashboard
CREATE OR REPLACE VIEW "admin_superchat_summary" AS
SELECT 
  DATE_TRUNC('day', sc.createdAt) as date,
  COUNT(*) as total_count,
  SUM(sc.amount) as total_amount,
  COUNT(DISTINCT sc.userId) as unique_donors,
  COUNT(DISTINCT sc.channelId) as unique_channels,
  AVG(sc.amount) as avg_amount
FROM super_chats sc
WHERE sc.isPaid = true
GROUP BY DATE_TRUNC('day', sc.createdAt)
ORDER BY date DESC;