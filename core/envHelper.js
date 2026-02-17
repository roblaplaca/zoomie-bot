const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

class EnvHelper {
    constructor(envPath = path.join(__dirname, '..', '.env')) {
        this.envPath = envPath;
        this.load();
    }

    load() {
        if (fs.existsSync(this.envPath)) {
            dotenv.config({ path: this.envPath });
        } else {
            fs.writeFileSync(this.envPath, '');
        }
    }

    get(key, defaultValue = undefined) {
        return process.env[key] || defaultValue;
    }

    set(key, value) {
        this.load();

        let envContent = fs.readFileSync(this.envPath, 'utf8');
        const keyRegex = new RegExp(`^${key}=(.*)$`, 'm');

        if (keyRegex.test(envContent)) {
            envContent = envContent.replace(keyRegex, `${key}=${value}`);
        } else {
            envContent += `\n${key}=${value}`;
        }

        fs.writeFileSync(this.envPath, envContent);
        dotenv.config({ path: this.envPath, override: true });
    }

    has(key) {
        return process.env.hasOwnProperty(key);
    }

    remove(key) {
        this.load();

        let envContent = fs.readFileSync(this.envPath, 'utf8');
        const keyRegex = new RegExp(`^${key}=.*$`, 'm');

        if (keyRegex.test(envContent)) {
            envContent = envContent.replace(keyRegex, '');
        }

        fs.writeFileSync(this.envPath, envContent);
        dotenv.config({ path: this.envPath, override: true });
    }
}

module.exports = new EnvHelper();