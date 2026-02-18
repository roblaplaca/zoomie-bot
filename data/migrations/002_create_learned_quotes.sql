CREATE TABLE IF NOT EXISTS learned_quotes (
    id SERIAL PRIMARY KEY,
    discord_guild_id TEXT NOT NULL,
    discord_user_id TEXT NOT NULL,
    quote TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: index for faster lookup by guild + user
CREATE INDEX IF NOT EXISTS idx_learned_quotes_guild_user 
    ON learned_quotes (discord_guild_id, discord_user_id)