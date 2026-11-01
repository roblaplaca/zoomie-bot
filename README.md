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
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | Twitch app credentials, used by `/watch` to check whether streamers are live |
| `PGHOST` / `PGPORT` / `PGDATABASE` / `PGUSER` / `PGPASSWORD` | Postgres connection |

`ZOOMIE_CATNIP_URL` is optional — a public image URL used as Zoomie's avatar during catnip mode.

`DISCORD_ACCESS_TOKEN`, `DISCORD_REFRESH_TOKEN` and the other `DISCORD_TOKEN_*`/`DISCORD_EXPIRES_IN`/`DISCORD_SCOPE` values are written to `.env` at runtime by the `/oauth/discord` login flow. Don't set them by hand or store them in Railway.

### Registering slash commands

After the bot starts, run the slash command registration script to make commands appear in Discord:

```bash
node core/registerSlashCommands.js
```

## Deployment (Railway)

1. Create a new Railway project and connect this repo
2. Add a Postgres plugin. Leave its Public Access off; Zoomie connects over Railway's private network.
3. Set the environment variables from `.env.example` in the Railway dashboard. Reference the Postgres service for the `PG*` values (e.g. `${{Postgres.PGPASSWORD}}`) instead of pasting them, so a regenerated password carries over on the next deploy.
4. Deploy — migrations run automatically on every startup, so no manual DB steps are needed

## Rotating credentials

Where to reset each secret if it's ever exposed:

| Secret | Where to rotate |
|---|---|
| `OPENAI_API_KEY` | platform.openai.com → API keys: delete the key, create a new one. Check Usage/Billing for spikes. |
| `DISCORD_BOT_TOKEN` | Discord Developer Portal → app → Bot → Reset Token |
| `DISCORD_CLIENT_SECRET` | Discord Developer Portal → app → OAuth2 → Reset Secret |
| Discord OAuth tokens | Discord → User Settings → Authorized Apps → Deauthorize Zoomie, then log in again at `/oauth/discord` |
| `PGPASSWORD` | Railway → Postgres → Database → Config → Regenerate. Don't edit the password variable by hand. |
| `TWITCH_CLIENT_SECRET` | dev.twitch.tv → Console → Applications → Manage → New Secret. **This Twitch app is shared with the Sidekick project**, so update both. |
| `SESSION_SECRET` | Generate a new one with `openssl rand -hex 32` (logs out existing web sessions) |

After rotating, update the values in Railway Variables and redeploy.

## Security incident: Railway, 2026-10-21

Railway reported that environment variables stored on its platform may have been accessed and decrypted by a third party ([status](https://status.railway.com/incident/QH8L8B3E)). Builds were paused platform-wide, and Zoomie is offline until it can be redeployed with new credentials.

**Done (2026-10-21)**

- [x] OpenAI key revoked and replaced; usage reviewed, nothing unusual
- [x] Discord bot token and client secret reset; Zoomie deauthorized in Discord
- [x] Postgres password regenerated; Public Access and `DATABASE_PUBLIC_URL` removed
- [x] Twitch client secret replaced (shared with Sidekick)
- [x] New `SESSION_SECRET` generated

**Done (2026-10-31)**

- [x] New credentials set in Zoomie's Railway Variables; `PG*` variables reference the Postgres service
- [x] OpenAI key recreated as a restricted key (Responses: Write only); prepaid credits with auto-reload off
- [x] Zoomie redeployed; Discord, database and Twitch stream alerts confirmed working

**Still to do**

- [ ] Check GitHub → Settings → Security log for unrecognized activity
- [ ] Inventory Sidekick's Railway variables and rotate anything not covered above
- [ ] Update and redeploy Sidekick (including the new Twitch secret)
- [ ] Update local `.env` with the new values

## Migrations

SQL migration files live in `data/migrations/`. They run automatically in filename order at startup and are tracked in a `schema_migrations` table so each one runs exactly once. To add a migration, create a new numbered `.sql` file and commit it.
