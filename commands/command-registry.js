const AdviceCommand = require('./advice/advice');
const ChooseCommand = require('./choose/choose');
const CoinflipCommand = require('./coinflip/coinflip');
const EightBallCommand = require('./eightball/eightball');
const JokeCommand = require('./joke/joke');
const LearnCommand = require('./learn/learn');
const QuoteCommand = require('./quote/quote');
const RocketCommand = require('./rocket/rocket');
const RollCommand = require('./roll/roll');
const RandomCommand = require('./random/random');
const WatchCommand = require('./watch/watch');
const UnwatchCommand = require('./unwatch/unwatch');

const commandRegistry = new Map();

commandRegistry.set('advice', AdviceCommand);
commandRegistry.set('8ball', EightBallCommand);
commandRegistry.set('choose', ChooseCommand);
commandRegistry.set('coinflip', CoinflipCommand);
commandRegistry.set('joke', JokeCommand);
commandRegistry.set('learn', LearnCommand);
commandRegistry.set('quote', QuoteCommand);
commandRegistry.set('random', RandomCommand);
commandRegistry.set('rocket', RocketCommand);
commandRegistry.set('roll', RollCommand);
commandRegistry.set('watch', WatchCommand);
commandRegistry.set('unwatch', UnwatchCommand);

module.exports = commandRegistry;