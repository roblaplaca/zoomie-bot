// feature-manager.js
class Feature {
    constructor() {
        this.features = new Map();
    }

    define(featureName, options = {}, subFeatures = {}) {
        if (this.features.has(featureName)) {
            throw new Error(`Feature "${featureName}" is already defined.`);
        }

        const featureConfig = {
            enabled: options.enabled ?? false,
            subFeatures: new Map(),
        };

        for (const [subFeatureName, subFeatureOptions] of Object.entries(subFeatures)) {
            featureConfig.subFeatures.set(subFeatureName, {
                enabled: subFeatureOptions.enabled ?? false
            });
        }
        this.features.set(featureName, featureConfig);
    }

    isEnabled(featurePath) {
        const parts = featurePath.split('.');
        const featureName = parts[0];

        if (!this.features.has(featureName)) {
            return false;
        }

        const featureConfig = this.features.get(featureName);

        if (!featureConfig.enabled) {
            return false;
        }

        if (parts.length === 1) {
            return featureConfig.enabled;
        } else {
            const subFeatureName = parts[1];
            if (featureConfig.subFeatures.has(subFeatureName)) {
                return featureConfig.subFeatures.get(subFeatureName).enabled;
            }
            return false;
        }
    }

    setEnabled(featurePath, enabled) {
        const parts = featurePath.split('.');
        const featureName = parts[0];

        if (!this.features.has(featureName)) {
            throw new Error(`Feature "${featureName}" is not defined.`);
        }

        const featureConfig = this.features.get(featureName);

        if (parts.length === 1) {
            featureConfig.enabled = enabled;
        } else {
            const subFeatureName = parts[1];
            if (!featureConfig.subFeatures.has(subFeatureName)) {
                featureConfig.subFeatures.set(subFeatureName, { enabled: false });
            }
            featureConfig.subFeatures.get(subFeatureName).enabled = enabled;
        }
    }
}

const FeatureManager = new Feature();

try {
    const featuresConfig = require('../config/features');
    for (const [featureName, featureOptions] of Object.entries(featuresConfig)) {
        FeatureManager.define(featureName, featureOptions.options, featureOptions.subFeatures);
    }
} catch (error) {
    console.error("Error loading features from features.js:", error);
}

module.exports = FeatureManager;