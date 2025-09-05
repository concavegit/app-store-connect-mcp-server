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
  | "cancelReason";

export type CiBuildRunIncludeOptions =
  | "builds"
  | "workflow"
  | "product"
  | "sourceBranchOrTag"
  | "destinationBranch"
  | "pullRequest";

// CI Build Action Types
export interface CiBuildAction {
  id: string;
  type: "ciBuildActions";
  attributes: {
    name: string;
    actionType: "ANALYZE" | "BUILD" | "TEST" | "ARCHIVE";
    startedDate?: string;
    finishedDate?: string;
    issueCounts?: {
      analyzerWarnings?: number;
      errors?: number;
      testFailures?: number;
      warnings?: number;
    };
    executionProgress?: "PENDING" | "RUNNING" | "COMPLETE";
    completionStatus?: "SUCCEEDED" | "FAILED" | "ERRORED" | "CANCELED" | "SKIPPED";
  };
  relationships?: {
    buildRun?: {
      data?: {
        id: string;
        type: "ciBuildRuns";
      };
    };
    issues?: {
      data?: Array<{
        id: string;
        type: "ciIssues";
      }>;
    };
    testResults?: {
      data?: Array<{
        id: string;
        type: "ciTestResults";
      }>;
    };
    artifacts?: {
      data?: Array<{
        id: string;
        type: "ciArtifacts";
      }>;
    };
  };
}

export interface CiBuildActionsResponse {
  data: CiBuildAction[];
  included?: Array<{
    id: string;
    type: "ciBuildRuns" | "ciIssues" | "ciTestResults" | "ciArtifacts";
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

export interface CiBuildActionFilters {
  actionType?: "ANALYZE" | "BUILD" | "TEST" | "ARCHIVE";
  executionProgress?: "PENDING" | "RUNNING" | "COMPLETE";
  completionStatus?: "SUCCEEDED" | "FAILED" | "ERRORED" | "CANCELED" | "SKIPPED";
}

export type CiBuildActionSortOptions = 
  | "name" | "-name"
  | "actionType" | "-actionType"
  | "startedDate" | "-startedDate"
  | "finishedDate" | "-finishedDate";

export type CiBuildActionFieldOptions = 
  | "name"
  | "actionType"
  | "startedDate"
  | "finishedDate"
  | "issueCounts"
  | "executionProgress"
  | "completionStatus";

export type CiBuildActionIncludeOptions =
  | "buildRun"
  | "issues"
  | "testResults"
  | "artifacts";

// CI Issue Types
export interface CiIssue {
  id: string;
  type: "ciIssues";
  attributes: {
    issueType: "ANALYZER_WARNING" | "ERROR" | "TEST_FAILURE" | "WARNING";
    message: string;
    fileLocation?: {
      filePath?: string;
      line?: number;
      column?: number;
    };
    category?: string;
  };
  relationships?: {
    buildAction?: {
      data?: {
        id: string;
        type: "ciBuildActions";
      };
    };
    buildRun?: {
      data?: {
        id: string;
        type: "ciBuildRuns";
      };
    };
  };
}

export interface CiIssuesResponse {
  data: CiIssue[];
  included?: Array<{
    id: string;
    type: "ciBuildActions" | "ciBuildRuns";
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

export interface CiIssueFilters {
  issueType?: "ANALYZER_WARNING" | "ERROR" | "TEST_FAILURE" | "WARNING";
  category?: string;
}

export type CiIssueSortOptions = 
  | "issueType" | "-issueType"
  | "category" | "-category"
  | "message" | "-message";

export type CiIssueFieldOptions = 
  | "issueType"
  | "message"
  | "fileLocation"
  | "category";

export type CiIssueIncludeOptions =
  | "buildAction"
  | "buildRun";

// CI Test Result Types
export interface CiTestResult {
  id: string;
  type: "ciTestResults";
  attributes: {
    className?: string;
    name: string;
    status: "SUCCESS" | "FAILURE" | "SKIPPED";
    fileLocation?: {
      filePath?: string;
      line?: number;
    };
    failureMessage?: string;
    duration?: number;
  };
  relationships?: {
    buildAction?: {
      data?: {
        id: string;
        type: "ciBuildActions";
      };
    };
    buildRun?: {
      data?: {
        id: string;
        type: "ciBuildRuns";
      };
    };
  };
}

export interface CiTestResultsResponse {
  data: CiTestResult[];
  included?: Array<{
    id: string;
    type: "ciBuildActions" | "ciBuildRuns";
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

export interface CiTestResultFilters {
  status?: "SUCCESS" | "FAILURE" | "SKIPPED";
  className?: string;
  name?: string;
}

export type CiTestResultSortOptions = 
  | "className" | "-className"
  | "name" | "-name"
  | "status" | "-status"
  | "duration" | "-duration";

export type CiTestResultFieldOptions = 
  | "className"
  | "name"
  | "status"
  | "fileLocation"
  | "failureMessage"
  | "duration";

export type CiTestResultIncludeOptions =
  | "buildAction"
  | "buildRun";

// CI Artifact Types
export interface CiArtifact {
  id: string;
  type: "ciArtifacts";
  attributes: {
    fileName: string;
    fileType: "ARCHIVE" | "LOG" | "RESULT_BUNDLE" | "SOURCE_CODE";
    fileSize?: number;
    downloadUrl?: string;
  };
  relationships?: {
    buildAction?: {
      data?: {
        id: string;
        type: "ciBuildActions";
      };
    };
    buildRun?: {
      data?: {
        id: string;
        type: "ciBuildRuns";
      };
    };
  };
}

export interface CiArtifactsResponse {
  data: CiArtifact[];
  included?: Array<{
    id: string;
    type: "ciBuildActions" | "ciBuildRuns";
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

export interface CiArtifactFilters {
  fileType?: "ARCHIVE" | "LOG" | "RESULT_BUNDLE" | "SOURCE_CODE";
  fileName?: string;
}

export type CiArtifactSortOptions = 
  | "fileName" | "-fileName"
  | "fileType" | "-fileType"
  | "fileSize" | "-fileSize";

export type CiArtifactFieldOptions = 
  | "fileName"
  | "fileType"
  | "fileSize"
  | "downloadUrl";

export type CiArtifactIncludeOptions =
  | "buildAction"
  | "buildRun";