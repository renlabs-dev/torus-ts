import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

export interface Config {
    twitter: {
        apiKey: string;
    };
    openRouter: {
        apiKey: string;
        model: string;
    };
    openai: {
        apiKey: string;
    };
    paths: {
        cache: string;
        output: string;
        torusDocs: string;
    };
    maxTweetsPerAccount: number;
    mockMode: boolean;
}

function getEnvOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function getEnvOrDefault(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

export function loadConfig(): Config {
    const projectRoot = path.resolve(__dirname, '..');
    const mockMode = getEnvOrDefault('MOCK_MODE', 'false').toLowerCase() === 'true';

    return {
        twitter: {
            apiKey: mockMode ? 'mock-key' : getEnvOrThrow('TWITTER_API_KEY'),
        },
        openRouter: {
            apiKey: mockMode ? 'mock-key' : getEnvOrThrow('OPENROUTER_API_KEY'),
            model: getEnvOrDefault('OPENROUTER_MODEL', 'anthropic/claude-3.5-sonnet'),
        },
        openai: {
            apiKey: mockMode ? 'mock-key' : getEnvOrThrow('OPENAI_API_KEY'),
        },
        paths: {
            cache: path.resolve(projectRoot, getEnvOrDefault('CACHE_DIRECTORY', './cache')),
            output: path.resolve(projectRoot, getEnvOrDefault('OUTPUT_DIRECTORY', './outputs')),
            torusDocs: path.resolve(projectRoot, 'Torus'),
        },
        maxTweetsPerAccount: parseInt(getEnvOrDefault('MAX_TWEETS_PER_ACCOUNT', '100'), 10),
        mockMode,
    };
}

export function ensureDirectories(config: Config): void {
    [config.paths.cache, config.paths.output].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}
