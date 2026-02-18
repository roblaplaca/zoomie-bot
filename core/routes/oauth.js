const express = require('express');
const oauthRouter = express.Router();
const discordClient = require('../../clients/discordClient');

const env = require('../envHelper');
const Logger = require('../logger');
const logger = new Logger();

/**
 * Step 1: Redirect to Discord OAuth with state
 */
oauthRouter.get('/discord', async (req, res) => {
    try {
        const url = discordClient.getAuthUrl(req); // pass req for state storage
        res.redirect(url);
    } catch (err) {
        logger.error('Failed to generate Discord auth URL:', err);
        res.status(500).send('OAuth initialization failed.');
    }
});

/**
 * Step 2: Handle OAuth callback + validate state
 */
oauthRouter.get('/discord/callback', async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code || !state) {
            return res.status(400).send('Invalid OAuth request.');
        }

        // Validate state
        if (!req.session.oauthState || state !== req.session.oauthState) {
            logger.warn('Invalid OAuth state detected.');
            return res.status(403).send('Invalid OAuth state.');
        }

        // Clear state after validation
        delete req.session.oauthState;

        const tokenData = await discordClient.getOAuthToken(code);

        if (!tokenData) {
            logger.error('Failed to obtain Discord OAuth token.');
            return res.status(500).send('OAuth exchange failed.');
        }

        // Store tokens (your existing behavior)
        env.set('DISCORD_ACCESS_TOKEN', tokenData.access_token);
        env.set('DISCORD_REFRESH_TOKEN', tokenData.refresh_token);
        env.set('DISCORD_TOKEN_TYPE', tokenData.token_type);
        env.set('DISCORD_EXPIRES_IN', tokenData.expires_in);
        env.set('DISCORD_SCOPE', tokenData.scope);

        console.log(`Discord OAuth completed for code: ${code}`);
        console.log(`Access token expires in ${tokenData.expires_in} seconds`);

        res.redirect('/');
    } catch (err) {
        logger.error('OAuth callback error:', err);
        res.status(500).send('OAuth processing failed.');
    }
});

module.exports = oauthRouter;