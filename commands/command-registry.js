const CatnipCommand = require('./catnip/catnip');
const ChooseCommand = require('./choose/choose');
const TreatCommand = require('./treat/treat');
const CoinflipCommand = require('./coinflip/coinflip');
const EightBallCommand = require('./eightball/eightball');
const JokeCommand = require('./joke/joke');
const LearnCommand = require('./learn/learn');
const QuoteCommand = require('./quote/quote');
const RocketCommand = require('./rocket/rocket');
const RollCommand = require('./roll/roll');
const RandomCommand = require('./random/random');
const SetRolesCommand = require('./setroles/setroles');
const WatchCommand = require('./watch/watch');
const UnwatchCommand = require('./unwatch/unwatch');

const commandRegistry = new Map();

commandRegistry.set('8ball', EightBallCommand);
commandRegistry.set('catnip', CatnipCommand);
commandRegistry.set('choose', ChooseCommand);
commandRegistry.set('coinflip', CoinflipCommand);
commandRegistry.set('joke', JokeCommand);
commandRegistry.set('learn', LearnCommand);
commandRegistry.set('quote', QuoteCommand);
commandRegistry.set('random', RandomCommand);
commandRegistry.set('rocket', RocketCommand);
commandRegistry.set('setroles', SetRolesCommand);
commandRegistry.set('roll', RollCommand);
commandRegistry.set('treat', TreatCommand);
commandRegistry.set('watch', WatchCommand);
commandRegistry.set('unwatch', UnwatchCommand);

module.exports = commandRegistry;