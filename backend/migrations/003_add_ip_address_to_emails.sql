-- Add ip_address column to emails table
ALTER TABLE emails 
ADD COLUMN IF NOT EXISTS ip_address INET;

-- Add an index for the ip_address column
CREATE INDEX IF NOT EXISTS idx_emails_ip_address ON emails(ip_address);

-- Add an index for the opened column for faster filtering
CREATE INDEX IF NOT EXISTS idx_emails_opened ON emails(opened);

-- Add an index for the sent_at column for faster sorting
CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON emails(sent_at);
