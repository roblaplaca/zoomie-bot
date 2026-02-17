const express = require('express');
const path = require('path');
const oauthRouter = express.Router();
const discordClient = require('../../clients/discordClient');

const env = require('../envHelper');
const Logger = require('../logger');
const logger = new Logger();

oauthRouter.get('/discord', async (req, res) => {
    const url = discordClient.getAuthUrl();
    res.redirect(url);
});

oauthRouter.get('/discord/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        res.send('Error: No authorization code provided.');
        return;
    }

    const tokenData = await discordClient.getOAuthToken(code);

    if (!tokenData) {
        logger.error('Error: Failed to obtain Discord OAuth token. ' + code);
        return;
    }

    env.set('DISCORD_ACCESS_TOKEN', tokenData.access_token);
    env.set('DISCORD_REFRESH_TOKEN', tokenData.refresh_token);
    env.set('DISCORD_TOKEN_TYPE', tokenData.token_type);
    env.set('DISCORD_EXPIRES_IN', tokenData.expires_in);
    env.set('DISCORD_SCOPE', tokenData.scope);

    console.log('tokenData: ', tokenData);

    res.redirect('/');
});

module.exports = oauthRouter;