import { validateRequired, sanitizeLimit } from '../utils/index.js';
export class LocalizationHandlers {
    client;
    constructor(client) {
        this.client = client;
    }
    async listAppStoreVersions(args) {
        const { appId, limit = 100, filter } = args;
        validateRequired(args, ['appId']);
        const params = {
            limit: sanitizeLimit(limit),
            'filter[app]': appId
        };
        if (filter?.platform) {
            params['filter[platform]'] = filter.platform;
        }
        if (filter?.versionString) {
            params['filter[versionString]'] = filter.versionString;
        }
        if (filter?.appStoreState) {
            params['filter[appStoreState]'] = filter.appStoreState;
        }
        return this.client.get('/appStoreVersions', params);
    }
    async listAppStoreVersionLocalizations(args) {
        const { appStoreVersionId, limit = 100 } = args;
        validateRequired(args, ['appStoreVersionId']);
        const params = {
            limit: sanitizeLimit(limit),
            'filter[appStoreVersion]': appStoreVersionId
        };
        return this.client.get('/appStoreVersionLocalizations', params);
    }
    async getAppStoreVersionLocalization(args) {
        const { localizationId } = args;
        validateRequired(args, ['localizationId']);
        return this.client.get(`/appStoreVersionLocalizations/${localizationId}`);
    }
    async updateAppStoreVersionLocalization(args) {
        const { localizationId, field, value } = args;
        validateRequired(args, ['localizationId', 'field', 'value']);
        // Validate field
        const validFields = [
            'description', 'keywords', 'marketingUrl',
            'promotionalText', 'supportUrl', 'whatsNew'
        ];
        if (!validFields.includes(field)) {
            throw new Error(`Invalid field: ${field}. Must be one of: ${validFields.join(', ')}`);
        }
        const requestData = {
            data: {
                type: 'appStoreVersionLocalizations',
                id: localizationId,
                attributes: {
                    [field]: value
                }
            }
        };
        return this.client.patch(`/appStoreVersionLocalizations/${localizationId}`, requestData);
    }
    async createAppStoreVersion(args) {
        const { appId, platform, versionString, copyright, releaseType, earliestReleaseDate, buildId } = args;
        validateRequired(args, ['appId', 'platform', 'versionString']);
        // Validate version string format
        const versionRegex = /^\d+\.\d+(\.\d+)?$/;
        if (!versionRegex.test(versionString)) {
            throw new Error('Version string must be in format X.Y or X.Y.Z (e.g., 1.0 or 1.0.0)');
        }
        // Validate release date if provided
        if (earliestReleaseDate) {
            const date = new Date(earliestReleaseDate);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid release date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)');
            }
            if (releaseType !== 'SCHEDULED') {
                throw new Error('earliestReleaseDate can only be set when releaseType is SCHEDULED');
            }
        }
        const requestData = {
            data: {
                type: 'appStoreVersions',
                attributes: {
                    platform,
                    versionString,
                    ...(copyright && { copyright }),
                    ...(releaseType && { releaseType }),
                    ...(earliestReleaseDate && { earliestReleaseDate })
                },
                relationships: {
                    app: {
                        data: {
                            type: 'apps',
                            id: appId
                        }
                    },
                    ...(buildId && {
                        build: {
                            data: {
                                type: 'builds',
                                id: buildId
                            }
                        }
                    })
                }
            }
        };
        return this.client.post('/appStoreVersions', requestData);
    }
}
