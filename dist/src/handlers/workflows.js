import { sanitizeLimit, buildFilterParams, buildFieldParams } from '../utils/index.js';
export class WorkflowHandlers {
    client;
    constructor(client) {
        this.client = client;
    }
    async listWorkflows(args = {}) {
        const { limit = 100, sort, filter, fields, include } = args;
        const params = {
            limit: sanitizeLimit(limit)
        };
        if (sort) {
            params.sort = sort;
        }
        if (include?.length) {
            params.include = include.join(',');
        }
        Object.assign(params, buildFilterParams(filter));
        Object.assign(params, buildFieldParams(fields));
        return this.client.get('/ciProducts', params);
    }
    async listBuildRuns(args) {
        const { ciProductId, limit = 100, sort, filter, fields, include } = args;
        const params = {
            limit: sanitizeLimit(limit)
        };
        if (sort) {
            params.sort = sort;
        }
        if (include?.length) {
            params.include = include.join(',');
        }
        Object.assign(params, buildFilterParams(filter));
        Object.assign(params, buildFieldParams(fields));
        return this.client.get(`/ciProducts/${ciProductId}/buildRuns`, params);
    }
    async listBuildActions(args) {
        const { buildRunId, limit = 100, sort, filter, fields, include } = args;
        const params = {
            limit: sanitizeLimit(limit)
        };
        if (sort) {
            params.sort = sort;
        }
        if (include?.length) {
            params.include = include.join(',');
        }
        Object.assign(params, buildFilterParams(filter));
        Object.assign(params, buildFieldParams(fields));
        return this.client.get(`/ciBuildRuns/${buildRunId}/actions`, params);
    }
    async getBuildAction(args) {
        const { buildActionId, fields, include } = args;
        const params = {};
        if (include?.length) {
            params.include = include.join(',');
        }
        Object.assign(params, buildFieldParams(fields));
        return this.client.get(`/ciBuildActions/${buildActionId}`, params);
    }
    async listIssues(args) {
        const { buildRunId, buildActionId, limit = 100, sort, filter, fields, include } = args;
        if (!buildRunId && !buildActionId) {
            throw new Error('Either buildRunId or buildActionId must be provided');
        }
        const params = {
            limit: sanitizeLimit(limit)
        };
        if (sort) {
            params.sort = sort;
        }
        if (include?.length) {
            params.include = include.join(',');
        }
        Object.assign(params, buildFilterParams(filter));
        Object.assign(params, buildFieldParams(fields));
        const endpoint = buildRunId
            ? `/ciBuildRuns/${buildRunId}/issues`
            : `/ciBuildActions/${buildActionId}/issues`;
        return this.client.get(endpoint, params);
    }
    async listTestResults(args) {
        const { buildRunId, buildActionId, limit = 100, sort, filter, fields, include } = args;
        if (!buildRunId && !buildActionId) {
            throw new Error('Either buildRunId or buildActionId must be provided');
        }
        const params = {
            limit: sanitizeLimit(limit)
        };
        if (sort) {
            params.sort = sort;
        }
        if (include?.length) {
            params.include = include.join(',');
        }
        Object.assign(params, buildFilterParams(filter));
        Object.assign(params, buildFieldParams(fields));
        const endpoint = buildRunId
            ? `/ciBuildRuns/${buildRunId}/testResults`
            : `/ciBuildActions/${buildActionId}/testResults`;
        return this.client.get(endpoint, params);
    }
    async listArtifacts(args) {
        const { buildRunId, buildActionId, limit = 100, sort, filter, fields, include } = args;
        if (!buildRunId && !buildActionId) {
            throw new Error('Either buildRunId or buildActionId must be provided');
        }
        const params = {
            limit: sanitizeLimit(limit)
        };
        if (sort) {
            params.sort = sort;
        }
        if (include?.length) {
            params.include = include.join(',');
        }
        Object.assign(params, buildFilterParams(filter));
        Object.assign(params, buildFieldParams(fields));
        const endpoint = buildRunId
            ? `/ciBuildRuns/${buildRunId}/artifacts`
            : `/ciBuildActions/${buildActionId}/artifacts`;
        return this.client.get(endpoint, params);
    }
    async downloadArtifact(args) {
        const { artifactId } = args;
        // First get the artifact details to get the download URL
        const artifact = await this.client.get(`/ciArtifacts/${artifactId}`);
        if (!artifact.data?.attributes?.downloadUrl) {
            throw new Error('No download URL available for this artifact');
        }
        try {
            // Download the artifact content
            const response = await this.client.downloadFile(artifact.data.attributes.downloadUrl);
            const isLogFile = artifact.data.attributes.fileType === 'LOG' ||
                artifact.data.attributes.fileName?.endsWith('.log') ||
                artifact.data.attributes.fileName?.endsWith('.txt');
            if (isLogFile && typeof response === 'string') {
                return {
                    content: [{
                            type: "text",
                            text: response
                        }]
                };
            }
            else {
                // For binary files, return as base64
                const base64Data = Buffer.isBuffer(response) ? response.toString('base64') :
                    typeof response === 'string' ? Buffer.from(response).toString('base64') : '';
                return {
                    content: [{
                            type: "resource",
                            data: base64Data,
                            text: `Downloaded artifact: ${artifact.data.attributes.fileName} (${artifact.data.attributes.fileType})`
                        }]
                };
            }
        }
        catch (error) {
            throw new Error(`Failed to download artifact: ${error.message}`);
        }
    }
}
