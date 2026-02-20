const OpenAI = require('openai');

const env = require('../core/envHelper');
const OPENAI_API_KEY = env.get('OPENAI_API_KEY');

if (OPENAI_API_KEY) {
    module.exports = new OpenAI({
        apiKey: OPENAI_API_KEY,
    });
} else {
    module.exports = null;
}