const ChooseCommand = require('./choose/choose');
const EightBallCommand = require('./eightball/eightball');
const commandRegistry = new Map();

commandRegistry.set('choose', ChooseCommand);
commandRegistry.set('8ball', EightBallCommand);

module.exports = commandRegistry;