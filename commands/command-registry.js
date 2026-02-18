const ChooseCommand = require('./choose/choose');
const CoinflipCommand = require('./coinflip/coinflip');
const EightBallCommand = require('./eightball/eightball');
const LearnCommand = require('./learn/learn');
const QuoteCommand = require('./quote/quote');
const WatchCommand = require('./watch/watch');
const UnwatchCommand = require('./unwatch/unwatch');

const commandRegistry = new Map();

commandRegistry.set('8ball', EightBallCommand);
commandRegistry.set('choose', ChooseCommand);
commandRegistry.set('coinflip', CoinflipCommand);
commandRegistry.set('learn', LearnCommand);
commandRegistry.set('quote', QuoteCommand);
commandRegistry.set('watch', WatchCommand);
commandRegistry.set('unwatch', UnwatchCommand);

module.exports = commandRegistry;