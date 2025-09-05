export type CiProductType = "IOS" | "MAC_OS" | "TV_OS" | "VISION_OS";

export interface CiProduct {
  id: string;
  type: "ciProducts";
  attributes: {
    name: string;
    productType: CiProductType;
  };
  relationships?: {
    app?: {
      data?: {
        id: string;
        type: "apps";
      };
    };
    bundleId?: {
      data?: {
        id: string;
        type: "bundleIds";
      };
    };
    primaryRepositories?: {
      data?: Array<{
        id: string;
        type: "scmRepositories";
      }>;
    };
  };
}

export interface CiProductsResponse {
  data: CiProduct[];
  included?: Array<{
    id: string;
    type: "apps" | "bundleIds" | "scmRepositories";
    attributes: any;
  }>;
  links?: {
    self: string;
    first?: string;
    next?: string;
  };
  meta?: {
    paging: {
      total: number;
      limit: number;
    };
  };
}

export interface CiProductFilters {
  productType?: CiProductType;
}

export type CiProductSortOptions = 
  | "name" | "-name"
  | "productType" | "-productType";

export type CiProductFieldOptions = 
  | "name"
  | "productType";

export type CiProductIncludeOptions =
  | "app"
  | "bundleId" 
  | "primaryRepositories";

// Build Run Types
export interface CiBuildRun {
  id: string;
  type: "ciBuildRuns";
  attributes: {
    number: number;
    createdDate: string;
    startedDate?: string;
    finishedDate?: string;
    sourceCommit?: {
      sha?: string;
      message?: string;
      author?: {
        displayName?: string;
        avatarUrl?: string;
      };
      committer?: {
        displayName?: string;
        avatarUrl?: string;
      };
      webUrl?: string;
    };
    destinationCommit?: {
      sha?: string;
      message?: string;
      author?: {
        displayName?: string;
        avatarUrl?: string;
      };
      committer?: {
        displayName?: string;
        avatarUrl?: string;
      };
      webUrl?: string;
    };
    isPullRequestBuild?: boolean;
    issueCounts?: {
      analyzerWarnings?: number;
      errors?: number;
      testFailures?: number;
      warnings?: number;
    };
    executionProgress?: "PENDING" | "RUNNING" | "COMPLETE";
    completionStatus?: "SUCCEEDED" | "FAILED" | "ERRORED" | "CANCELED" | "SKIPPED";
    startReason?: "MANUAL" | "SCM_CHANGE" | "PULL_REQUEST_UPDATE" | "SCHEDULED";
    cancelReason?: "AUTOMATICALLY_BY_NEWER_BUILD" | "MANUALLY_BY_USER";
    clean?: boolean;
  };
  relationships?: {
    builds?: {
      data?: Array<{
        id: string;
        type: "builds";
      }>;
    };
    workflow?: {
      data?: {
        id: string;
        type: "ciWorkflows";
      };
    };
    product?: {
      data?: {
        id: string;
        type: "ciProducts";
      };
    };
    sourceBranchOrTag?: {
      data?: {
        id: string;
        type: "scmGitReferences";
      };
    };
    destinationBranch?: {
      data?: {
        id: string;
        type: "scmGitReferences";
      };
    };
    pullRequest?: {
      data?: {
        id: string;
        type: "scmPullRequests";
      };
    };
  };
}

export interface CiBuildRunsResponse {
  data: CiBuildRun[];
  included?: Array<{
    id: string;
    type: "builds" | "ciWorkflows" | "ciProducts" | "scmGitReferences" | "scmPullRequests";
    attributes: any;
  }>;
  links?: {
    self: string;
    first?: string;
    next?: string;
  };
  meta?: {
    paging: {
      total: number;
      limit: number;
    };
  };
}

export interface CiBuildRunFilters {
  number?: number;
  createdDate?: string;
  startedDate?: string;
  finishedDate?: string;
  isPullRequestBuild?: boolean;
  executionProgress?: "PENDING" | "RUNNING" | "COMPLETE";
  completionStatus?: "SUCCEEDED" | "FAILED" | "ERRORED" | "CANCELED" | "SKIPPED";
  startReason?: "MANUAL" | "SCM_CHANGE" | "PULL_REQUEST_UPDATE" | "SCHEDULED";
  cancelReason?: "AUTOMATICALLY_BY_NEWER_BUILD" | "MANUALLY_BY_USER";
}

export type CiBuildRunSortOptions = 
  | "number" | "-number"
  | "createdDate" | "-createdDate"
  | "startedDate" | "-startedDate"
  | "finishedDate" | "-finishedDate";

export type CiBuildRunFieldOptions = 
  | "number"
  | "createdDate"
  | "startedDate"
  | "finishedDate"
  | "sourceCommit"
  | "destinationCommit"
  | "isPullRequestBuild"
  | "issueCounts"
  | "executionProgress"
  | "completionStatus"
  | "startReason"
  | "cancelReason"
  | "clean";

export type CiBuildRunIncludeOptions =
  | "builds"
  | "workflow"
  | "product"
  | "sourceBranchOrTag"
  | "destinationBranch"
  | "pullRequest";