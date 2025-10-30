import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
export class AuthService {
    config;
    constructor(config) {
        this.config = config;
    }
    async generateToken() {
        this.validateConfig();
        let privateKey;
        if (this.config.privateKeyString) {
            privateKey = Buffer.from(this.config.privateKeyString, 'base64').toString('utf-8');
        }
        else if (this.config.privateKeyPath) {
            privateKey = await fs.readFile(this.config.privateKeyPath, 'utf-8');
        }
        else {
            throw new Error("Missing App Store Connect private key. " +
                "Please configure either APP_STORE_CONNECT_P8_PATH or APP_STORE_CONNECT_P8_B64_STRING " +
                "in your Smithery test profile or environment variables.");
        }
        const token = jwt.sign({}, privateKey, {
            algorithm: 'ES256',
            expiresIn: '20m',
            audience: 'appstoreconnect-v1',
            keyid: this.config.keyId,
            issuer: this.config.issuerId,
        });
        return token;
    }
    validateConfig() {
        if (!this.config.keyId || !this.config.issuerId) {
            throw new Error("Missing required App Store Connect credentials. " +
                "Please configure APP_STORE_CONNECT_KEY_ID and APP_STORE_CONNECT_ISSUER_ID " +
                "in your Smithery test profile or environment variables.");
        }
        if (!this.config.privateKeyPath && !this.config.privateKeyString) {
            throw new Error("Missing App Store Connect private key. " +
                "Please configure either APP_STORE_CONNECT_P8_PATH or APP_STORE_CONNECT_P8_B64_STRING " +
                "in your Smithery test profile or environment variables.");
        }
    }
}
