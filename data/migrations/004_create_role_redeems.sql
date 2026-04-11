CREATE TABLE role_redeems (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    yes_emoji TEXT NOT NULL,
    no_emoji TEXT NOT NULL,
    role_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (guild_id, message_id)
);