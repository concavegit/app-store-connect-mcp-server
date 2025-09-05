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
  CiBuildRunIncludeOptions,
  CiBuildActionsResponse,
  CiBuildActionFilters,
  CiBuildActionSortOptions,
  CiBuildActionFieldOptions,
  CiBuildActionIncludeOptions,
  CiIssuesResponse,
  CiIssueFilters,
  CiIssueSortOptions,
  CiIssueFieldOptions,
  CiIssueIncludeOptions,
  CiTestResultsResponse,
  CiTestResultFilters,
  CiTestResultSortOptions,
  CiTestResultFieldOptions,
  CiTestResultIncludeOptions,
  CiArtifactsResponse,
  CiArtifactFilters,
  CiArtifactSortOptions,
  CiArtifactFieldOptions,
  CiArtifactIncludeOptions
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

  async listBuildActions(args: {
    buildRunId: string;
    limit?: number;
    sort?: CiBuildActionSortOptions;
    filter?: CiBuildActionFilters;
    fields?: {
      ciBuildActions?: CiBuildActionFieldOptions[];
    };
    include?: CiBuildActionIncludeOptions[];
  }): Promise<CiBuildActionsResponse> {
    const { buildRunId, limit = 100, sort, filter, fields, include } = args;
    
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

    return this.client.get<CiBuildActionsResponse>(`/ciBuildRuns/${buildRunId}/actions`, params);
  }

  async getBuildAction(args: {
    buildActionId: string;
    fields?: {
      ciBuildActions?: CiBuildActionFieldOptions[];
    };
    include?: CiBuildActionIncludeOptions[];
  }): Promise<{ data: any }> {
    const { buildActionId, fields, include } = args;
    
    const params: Record<string, any> = {};

    if (include?.length) {
      params.include = include.join(',');
    }

    Object.assign(params, buildFieldParams(fields));

    return this.client.get<{ data: any }>(`/ciBuildActions/${buildActionId}`, params);
  }

  async listIssues(args: {
    buildRunId?: string;
    buildActionId?: string;
    limit?: number;
    sort?: CiIssueSortOptions;
    filter?: CiIssueFilters;
    fields?: {
      ciIssues?: CiIssueFieldOptions[];
    };
    include?: CiIssueIncludeOptions[];
  }): Promise<CiIssuesResponse> {
    const { buildRunId, buildActionId, limit = 100, sort, filter, fields, include } = args;
    
    if (!buildRunId && !buildActionId) {
      throw new Error('Either buildRunId or buildActionId must be provided');
    }

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

    const endpoint = buildRunId 
      ? `/ciBuildRuns/${buildRunId}/issues`
      : `/ciBuildActions/${buildActionId}/issues`;

    return this.client.get<CiIssuesResponse>(endpoint, params);
  }

  async listTestResults(args: {
    buildRunId?: string;
    buildActionId?: string;
    limit?: number;
    sort?: CiTestResultSortOptions;
    filter?: CiTestResultFilters;
    fields?: {
      ciTestResults?: CiTestResultFieldOptions[];
    };
    include?: CiTestResultIncludeOptions[];
  }): Promise<CiTestResultsResponse> {
    const { buildRunId, buildActionId, limit = 100, sort, filter, fields, include } = args;
    
    if (!buildRunId && !buildActionId) {
      throw new Error('Either buildRunId or buildActionId must be provided');
    }

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

    const endpoint = buildRunId 
      ? `/ciBuildRuns/${buildRunId}/testResults`
      : `/ciBuildActions/${buildActionId}/testResults`;

    return this.client.get<CiTestResultsResponse>(endpoint, params);
  }

  async listArtifacts(args: {
    buildRunId?: string;
    buildActionId?: string;
    limit?: number;
    sort?: CiArtifactSortOptions;
    filter?: CiArtifactFilters;
    fields?: {
      ciArtifacts?: CiArtifactFieldOptions[];
    };
    include?: CiArtifactIncludeOptions[];
  }): Promise<CiArtifactsResponse> {
    const { buildRunId, buildActionId, limit = 100, sort, filter, fields, include } = args;
    
    if (!buildRunId && !buildActionId) {
      throw new Error('Either buildRunId or buildActionId must be provided');
    }

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

    const endpoint = buildRunId 
      ? `/ciBuildRuns/${buildRunId}/artifacts`
      : `/ciBuildActions/${buildActionId}/artifacts`;

    return this.client.get<CiArtifactsResponse>(endpoint, params);
  }

  async downloadArtifact(args: {
    artifactId: string;
  }): Promise<{ content: Array<{ type: string; data?: string; text?: string }> }> {
    const { artifactId } = args;
    
    // First get the artifact details to get the download URL
    const artifact = await this.client.get<{ data: any }>(`/ciArtifacts/${artifactId}`);
    
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
      } else {
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
    } catch (error: any) {
      throw new Error(`Failed to download artifact: ${error.message}`);
    }
  }
}