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
}
