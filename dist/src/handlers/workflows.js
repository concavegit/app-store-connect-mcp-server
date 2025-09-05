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
}
