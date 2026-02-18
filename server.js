// index.js - Minimal Discord-only starting point
global.__basedir = __dirname;

require('dotenv').config();

const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const session = require('express-session');

const oauthRouter = require('./core/routes/oauth.js');

const Logger = require('./core/logger');
const logger = new Logger();

const discordClient = require('./clients/discordClient');
const eventEmitter = require('./core/eventEmitter');

const messageHandler = require('./core/messageHandler');
const watchHandler = require('./core/watchHandler');

// Serve static files if needed
app.use(express.static(global.__basedir + '/public'));
app.set('trust proxy', 1);
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'super-secret-change-me',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production', // true if HTTPS
            httpOnly: true,
            sameSite: 'lax'
        }
    })
);
app.use('/oauth', oauthRouter);

// Minimal route
app.get('/', (req, res) => {
    res.send('Zoomie is running!');
});

// Start server
app.listen(4000, async () => {
    logger.info('Server started on port: 4000');

    // Connect Discord bot
    await discordClient.connect();
    messageHandler.start();
    await watchHandler.start();

    logger.info('Discord bot Zoomie is online!');

    // Start any other background tasks
    // Example: activity aggregator (optional)
    // activityAggregator.start();
});

// Optional WebSocket setup if you plan to broadcast events
app.ws('/', (ws, req) => {
    logger.info('Client connected to socket');

    const broadcastListener = (payload) => {
        ws.send(JSON.stringify(payload));
    };

    eventEmitter.on('broadcast', broadcastListener);

    ws.on('close', () => {
        logger.info('Client disconnected from socket');
        eventEmitter.off('broadcast', broadcastListener);
    });

    ws.on('message', (messageString) => {
        let message = JSON.parse(messageString);
        logger.debug('Message from client:', message);
        eventEmitter.emit(message.type, message.payload);
    });
});
