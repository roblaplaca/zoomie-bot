DROP TABLE IF EXISTS watches;

CREATE TABLE watches (
    id SERIAL PRIMARY KEY,
    platform TEXT NOT NULL,
    channel_name TEXT NOT NULL,
    discord_guild_id TEXT NOT NULL,
    discord_channel_id TEXT NOT NULL,
    last_stream_id TEXT,
    UNIQUE (platform, channel_name, discord_guild_id, discord_channel_id)
);