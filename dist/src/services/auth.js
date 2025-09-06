import * as jwt from 'jsonwebtoken';
import { readFile } from 'fs/promises';
export class AuthService {
    config;
    constructor(config) {
        this.config = config;
    }
    async generateToken() {
        let privateKey;
        if (this.config.privateKeyString) {
            // Decode base64 encoded private key
            privateKey = Buffer.from(this.config.privateKeyString, 'base64').toString('utf-8');
        }
        else if (this.config.privateKeyPath) {
            privateKey = await readFile(this.config.privateKeyPath, 'utf-8');
        }
        else {
            throw new Error("Either privateKeyPath or privateKeyString must be provided");
        }
        const token = jwt.sign({}, privateKey, {
            algorithm: 'ES256',
            expiresIn: '20m', // App Store Connect tokens can be valid for up to 20 minutes
            audience: 'appstoreconnect-v1',
            keyid: this.config.keyId,
            issuer: this.config.issuerId,
        });
        return token;
    }
    validateConfig() {
        if (!this.config.keyId || !this.config.issuerId) {
            throw new Error("Missing required environment variables. Please set: " +
                "APP_STORE_CONNECT_KEY_ID, APP_STORE_CONNECT_ISSUER_ID");
        }
        if (!this.config.privateKeyPath && !this.config.privateKeyString) {
            throw new Error("Missing private key configuration. Please set either: " +
                "APP_STORE_CONNECT_P8_PATH (file path) or APP_STORE_CONNECT_P8_B64_STRING (base64 encoded key content)");
        }
    }
}
