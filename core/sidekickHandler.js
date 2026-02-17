const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');
const axios = require('axios');

const discordClient = require('../clients/discordClient');
let ttsFactory = require('../clients/tts');

const eventEmitter = require('./eventEmitter');
const Feature = require('../core/featureManager');
const Logger = require('../core/logger');
const logger = new Logger();

const { DEFAULT_TTS_PROVIDER } = require('../config/config');

class SidekickHandler {
    async start() {
    	this.isShowing = false;

        const channelId = await discordClient.getChannelIdByName('sidekick');

	    discordClient.listenToChannel(channelId, async (message) => {
	    	logger.debug('message: ', message);

	    	if (message.attachments && message.attachments.first()) {
	    		await this.handleAudioMessage(message);
	    		return;
	    	}

	    	if (message.content.length > 0) {
	    		if (message.content === '!show') {
	    			eventEmitter.emit('broadcast', {
			            type: 'sidekick:show',
			            payload: {}
			        });

			        this.isShowing = true;
			        return;
	    		}

	    		if (message.content === '!hide') {
	    			eventEmitter.emit('broadcast', {
			            type: 'sidekick:hide',
			            payload: {}
			        });

			        this.isShowing = false;
			        return;
	    		}

	    		await this.handleTextToSpeech(message);
	    	}
	    });
    }

    async handleTextToSpeech(message) {
    	if (!this.isShowing) { return; }
    	if (!Feature.isEnabled('discord.sidekickTTS')) { return; }

    	const messageToSay = message.content;
		const ttsClient = ttsFactory.getClient(DEFAULT_TTS_PROVIDER);
		const result = await ttsClient.speak(messageToSay);
    	const publicAudioFile = result.audio.replace(/\\/g, '/').split('/public')[1];

        eventEmitter.emit('broadcast', {
            type: 'sidekick:speak',
            payload: {
            	file: publicAudioFile
            }
        });
    }

    async handleAudioMessage(message) {
    	if (!this.isShowing) { return; }
    	if (!Feature.isEnabled('discord.sidekickVoice')) { return; }

    	let publicAudioFile = null;

	    const outputFile = path.join(global.__basedir, '/public/audio/say.mp3');
    	const attachment = message.attachments.first();

		const audioResponse = await axios.get(attachment.url, {
            responseType: 'arraybuffer',
        });

		await this.downloadFile(attachment.url, outputFile);
		
		publicAudioFile = outputFile.replace(/\\/g, '/').split('/public')[1];

		eventEmitter.emit('broadcast', {
            type: 'sidekick:speak',
            payload: {
            	file: publicAudioFile
            }
        });
    }

    async downloadFile(url, dest) {
	    try {
	        const response = await fetch(url);

	        if (!response.ok) {
	            throw new Error(`Unexpected response ${response.statusText}`);
	        }

	        const fileStream = fs.createWriteStream(dest);
	        await new Promise((resolve, reject) => {
	            response.body.pipe(fileStream);
	            response.body.on("error", reject);
	            fileStream.on("finish", resolve);
	        });
	        logger.info("File downloaded successfully!");
	    } catch (err) {
	        logger.warn("Error downloading file:", err);
	    }
	}

	getDataForDashboard() {
        return {
        	isEnabled: false,
            isOverlayShowing: this.isOverlayShowing
        };
    }
}

module.exports = new SidekickHandler();