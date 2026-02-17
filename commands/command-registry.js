const ChooseCommand = require('./choose/choose');
const commandRegistry = new Map();

commandRegistry.set('choose', ChooseCommand);

module.exports = commandRegistry;