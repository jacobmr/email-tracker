-- Create the link_clicks table to track when links in emails are clicked
CREATE TABLE IF NOT EXISTS link_clicks (
    id SERIAL PRIMARY KEY,
    email_id INTEGER NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    recipient TEXT NOT NULL,
    user_agent TEXT,
    ip_address INET,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key to emails table
ALTER TABLE link_clicks 
ADD CONSTRAINT fk_email 
FOREIGN KEY (email_id) 
REFERENCES emails(id) 
ON DELETE CASCADE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_link_clicks_email_id ON link_clicks(email_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_clicked_at ON link_clicks(clicked_at);

-- Add a trigger to update the updated_at column
CREATE TRIGGER update_link_clicks_updated_at
BEFORE UPDATE ON link_clicks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
