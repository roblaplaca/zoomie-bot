CREATE TABLE zoomie_guild_state (
    discord_guild_id TEXT PRIMARY KEY,
    catnip_expires_at BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zoomie_catnip_expires_at
ON zoomie_guild_state (catnip_expires_at);