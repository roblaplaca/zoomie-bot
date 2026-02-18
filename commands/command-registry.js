const ChooseCommand = require('./choose/choose');
const EightBallCommand = require('./eightball/eightball');
const WatchCommand = require('./watch/watch');
const UnwatchCommand = require('./unwatch/unwatch');

const commandRegistry = new Map();

commandRegistry.set('choose', ChooseCommand);
commandRegistry.set('8ball', EightBallCommand);
commandRegistry.set('watch', WatchCommand);
commandRegistry.set('unwatch', UnwatchCommand);

module.exports = commandRegistry;