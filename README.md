# ZoomieBot

A Discord bot with a grumpy cat personality powered by OpenAI. Mention Zoomie in any channel and he'll respond — reluctantly.

## Commands

| Command | Description |
|---|---|
| `/treat` | Bribe Zoomie with a treat. Up to 5 treats make him progressively more agreeable. Wears off over time. |
| `/catnip [duration]` | Give Zoomie catnip (1–10 min, default 2). Activates chaos mode with a different avatar. |
| `/8ball <question>` | Ask the magic 8-ball. |
| `/choose <a> <b>` | Have Zoomie pick between two options. |
| `/coinflip` | Flip a coin. |
| `/joke` | Tell a joke. |
| `/learn <trigger> <response>` | Teach Zoomie a custom response. |
| `/quote <user>` | Pull a random saved quote from a user. |
| `/random <min> <max>` | Random number in range. |
| `/rocket` | Launch a rocket. |
| `/roll <dice>` | Roll dice (e.g. `2d6`). |
| `/watch <channel>` | Get notified in this channel when a Twitch streamer goes live. |
| `/unwatch <channel>` | Stop watching a Twitch channel. |
| `/setroles` | Post a role-selection message. |

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL
- A Discord application with a bot token ([Discord Developer Portal](https://discord.com/developers/applications))
- An OpenAI API key

### Local development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your values in .env

# Create a local database
createdb zoomie_local

# Start the bot (migrations run automatically on startup)
npm run dev
```

### Environment variables

See `.env.example` for the full list. Required ones:

| Variable | Description |
|---|---|
| `SESSION_SECRET` | Long random string for session signing |
| `DISCORD_BOT_TOKEN` | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Application client ID |
| `DISCORD_CLIENT_SECRET` | Application client secret |
| `DISCORD_GUILD_ID` | Your server's guild ID |
| `OPENAI_API_KEY` | OpenAI API key |
| `PGHOST` / `PGPORT` / `PGDATABASE` / `PGUSER` / `PGPASSWORD` | Postgres connection |

`ZOOMIE_CATNIP_URL` is optional — a public image URL used as Zoomie's avatar during catnip mode.

### Registering slash commands

After the bot starts, run the slash command registration script to make commands appear in Discord:

```bash
node core/registerSlashCommands.js
```

## Deployment (Railway)

1. Create a new Railway project and connect this repo
2. Add a Postgres plugin
3. Set all environment variables from `.env.example` in the Railway dashboard
4. Deploy — migrations run automatically on every startup, so no manual DB steps are needed

## Migrations

SQL migration files live in `data/migrations/`. They run automatically in filename order at startup and are tracked in a `schema_migrations` table so each one runs exactly once. To add a migration, create a new numbered `.sql` file and commit it.
