import { AppStoreConnectClient } from '../services/index.js';
import { 
  CiProductsResponse,
  CiProductFilters,
  CiProductSortOptions,
  CiProductFieldOptions,
  CiProductIncludeOptions,
  CiBuildRunsResponse,
  CiBuildRunFilters,
  CiBuildRunSortOptions,
  CiBuildRunFieldOptions,
  CiBuildRunIncludeOptions
} from '../types/index.js';
import { sanitizeLimit, buildFilterParams, buildFieldParams } from '../utils/index.js';

export class WorkflowHandlers {
  constructor(private client: AppStoreConnectClient) {}

  async listWorkflows(args: {
    limit?: number;
    sort?: CiProductSortOptions;
    filter?: CiProductFilters;
    fields?: {
      ciProducts?: CiProductFieldOptions[];
    };
    include?: CiProductIncludeOptions[];
  } = {}): Promise<CiProductsResponse> {
    const { limit = 100, sort, filter, fields, include } = args;
    
    const params: Record<string, any> = {
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

    return this.client.get<CiProductsResponse>('/ciProducts', params);
  }

  async listBuildRuns(args: {
    ciProductId: string;
    limit?: number;
    sort?: CiBuildRunSortOptions;
    filter?: CiBuildRunFilters;
    fields?: {
      ciBuildRuns?: CiBuildRunFieldOptions[];
    };
    include?: CiBuildRunIncludeOptions[];
  }): Promise<CiBuildRunsResponse> {
    const { ciProductId, limit = 100, sort, filter, fields, include } = args;
    
    const params: Record<string, any> = {
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

    return this.client.get<CiBuildRunsResponse>(`/ciProducts/${ciProductId}/buildRuns`, params);
  }
}