class Command {
    constructor() {
        if (new.target === Command) {
            throw new TypeError("Cannot construct Abstract instances directly");
        }
        this.cooldown = 0;
        this.permissions = [];
    }

    isEnabled() {
        return true;
    }

    redeemOnly() {
        return false;
    }
    
    execute(context) {
        throw new Error("Method 'execute' must be implemented.");
    }
}

module.exports = Command;