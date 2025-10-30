#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolRequest,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';
import { z } from 'zod';

import { AppStoreConnectConfig } from './types/index.js';
import { AppStoreConnectClient } from './services/index.js';
import { 
  AppHandlers, 
  BetaHandlers, 
  BundleHandlers, 
  DeviceHandlers, 
  UserHandlers, 
  AnalyticsHandlers,
  XcodeHandlers,
  LocalizationHandlers,
  WorkflowHandlers
} from './handlers/index.js';

const baseConfig = z.object({
  APP_STORE_CONNECT_KEY_ID: z.string().min(1).describe("Your App Store Connect API Key ID (found in App Store Connect > Users and Access > Keys)"),
  APP_STORE_CONNECT_ISSUER_ID: z.string().min(1).describe("Your App Store Connect Issuer ID (found in App Store Connect > Users and Access > Keys)"),
  APP_STORE_CONNECT_VENDOR_NUMBER: z.string().optional().describe("Your vendor number from App Store Connect (optional - enables sales and finance reporting tools)")
});

const withBase64Key = z.object({
  APP_STORE_CONNECT_P8_B64_STRING: z.string().min(1).describe("Base64 encoded contents of your App Store Connect P8 private key file"),
  APP_STORE_CONNECT_P8_PATH: z.undefined().optional()
});

const withPathKey = z.object({
  APP_STORE_CONNECT_P8_PATH: z.string().min(1).describe("Absolute path to your App Store Connect P8 private key file"),
  APP_STORE_CONNECT_P8_B64_STRING: z.undefined().optional()
});

export const sessionConfig = baseConfig.and(z.union([withBase64Key, withPathKey]));

export const config = sessionConfig;

// Helper function to load config from environment variables
function loadConfigFromEnv(): AppStoreConnectConfig {
  return {
    keyId: process.env.APP_STORE_CONNECT_KEY_ID!,
    issuerId: process.env.APP_STORE_CONNECT_ISSUER_ID!,
    privateKeyPath: process.env.APP_STORE_CONNECT_P8_PATH,
    privateKeyString: process.env.APP_STORE_CONNECT_P8_B64_STRING,
    vendorNumber: process.env.APP_STORE_CONNECT_VENDOR_NUMBER,
  };
}

class AppStoreConnectServer {
  public server: Server;
  private client: AppStoreConnectClient;
  private appHandlers: AppHandlers;
  private betaHandlers: BetaHandlers;
  private bundleHandlers: BundleHandlers;
  private deviceHandlers: DeviceHandlers;
  private userHandlers: UserHandlers;
  private analyticsHandlers: AnalyticsHandlers;
  private xcodeHandlers: XcodeHandlers;
  private localizationHandlers: LocalizationHandlers;
  private workflowHandlers: WorkflowHandlers;
  private vendorNumber?: string;

  constructor(appConfig: AppStoreConnectConfig) {
    this.vendorNumber = appConfig.vendorNumber;
    this.server = new Server({
      name: "appstore-connect-server",
      version: "1.0.0"
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.client = new AppStoreConnectClient(appConfig);
    this.appHandlers = new AppHandlers(this.client);
    this.betaHandlers = new BetaHandlers(this.client);
    this.bundleHandlers = new BundleHandlers(this.client);
    this.deviceHandlers = new DeviceHandlers(this.client);
    this.userHandlers = new UserHandlers(this.client);
    this.analyticsHandlers = new AnalyticsHandlers(this.client, appConfig);
    this.xcodeHandlers = new XcodeHandlers();
    this.localizationHandlers = new LocalizationHandlers(this.client);
    this.workflowHandlers = new WorkflowHandlers(this.client);

    this.setupHandlers();
  }

  private buildToolsList() {
    const baseTools = [
        // App Management Tools
        {
          name: "list_apps",
          description: "Get a list of all apps in App Store Connect",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of apps to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            }
          }
        },
        {
          name: "get_app_info",
          description: "Get detailed information about a specific app",
          inputSchema: {
            type: "object", 
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app to get information for"
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "appClips", "appInfos", "appStoreVersions", "availableTerritories",
                    "betaAppReviewDetail", "betaGroups", "betaLicenseAgreement", "builds",
                    "endUserLicenseAgreement", "gameCenterEnabledVersions", "inAppPurchases",
                    "preOrder", "prices", "reviewSubmissions"
                  ]
                },
                description: "Optional relationships to include in the response"
              }
            },
            required: ["appId"]
          }
        },

        // Beta Testing Tools
        {
          name: "list_beta_groups",
          description: "Get a list of all beta groups (internal and external)",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of groups to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            }
          }
        },
        {
          name: "list_group_testers",
          description: "Get a list of all testers in a specific beta group",
          inputSchema: {
            type: "object",
            properties: {
              groupId: {
                type: "string",
                description: "The ID of the beta group"
              },
              limit: {
                type: "number",
                description: "Maximum number of testers to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["groupId"]
          }
        },
        {
          name: "add_tester_to_group",
          description: "Add a new tester to a beta group",
          inputSchema: {
            type: "object",
            properties: {
              groupId: {
                type: "string",
                description: "The ID of the beta group"
              },
              email: {
                type: "string",
                description: "Email address of the tester"
              },
              firstName: {
                type: "string",
                description: "First name of the tester"
              },
              lastName: {
                type: "string",
                description: "Last name of the tester"
              }
            },
            required: ["groupId", "email", "firstName", "lastName"]
          }
        },
        {
          name: "remove_tester_from_group",
          description: "Remove a tester from a beta group",
          inputSchema: {
            type: "object",
            properties: {
              groupId: {
                type: "string",
                description: "The ID of the beta group"
              },
              testerId: {
                type: "string",
                description: "The ID of the beta tester"
              }
            },
            required: ["groupId", "testerId"]
          }
        },
        {
          name: "list_beta_feedback_screenshots",
          description: "List all beta feedback screenshot submissions for an app. This includes feedback with screenshots, device information, and tester comments. You can identify the app using either appId or bundleId.",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app to get feedback for (e.g., '6747745091')"
              },
              bundleId: {
                type: "string",
                description: "The bundle ID of the app (e.g., 'com.example.app'). Can be used instead of appId."
              },
              buildId: {
                type: "string",
                description: "Filter by specific build ID (optional)"
              },
              devicePlatform: {
                type: "string",
                enum: ["IOS", "MAC_OS", "TV_OS", "VISION_OS"],
                description: "Filter by device platform (optional)"
              },
              appPlatform: {
                type: "string",
                enum: ["IOS", "MAC_OS", "TV_OS", "VISION_OS"],
                description: "Filter by app platform (optional)"
              },
              deviceModel: {
                type: "string",
                description: "Filter by device model (e.g., 'iPhone15_2') (optional)"
              },
              osVersion: {
                type: "string",
                description: "Filter by OS version (e.g., '18.4.1') (optional)"
              },
              testerId: {
                type: "string",
                description: "Filter by specific tester ID (optional)"
              },
              limit: {
                type: "number",
                description: "Maximum number of feedback items to return (default: 50, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                enum: ["createdDate", "-createdDate"],
                description: "Sort order for results (default: -createdDate for newest first)"
              },
              includeBuilds: {
                type: "boolean",
                description: "Include build information in response (optional)",
                default: false
              },
              includeTesters: {
                type: "boolean",
                description: "Include tester information in response (optional)",
                default: false
              }
            },
            required: []
          }
        },
        {
          name: "get_beta_feedback_screenshot",
          description: "Get detailed information about a specific beta feedback screenshot submission. By default, downloads and returns the screenshot image.",
          inputSchema: {
            type: "object",
            properties: {
              feedbackId: {
                type: "string",
                description: "The ID of the beta feedback screenshot submission"
              },
              includeBuilds: {
                type: "boolean",
                description: "Include build information in response (optional)",
                default: false
              },
              includeTesters: {
                type: "boolean",
                description: "Include tester information in response (optional)",
                default: false
              },
              downloadScreenshot: {
                type: "boolean",
                description: "Download and return the screenshot as an image (default: true)",
                default: true
              }
            },
            required: ["feedbackId"]
          }
        },
        
        // App Store Version Localization Tools
        {
          name: "create_app_store_version",
          description: "Create a new app store version for an app",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app"
              },
              platform: {
                type: "string",
                description: "The platform for this version",
                enum: ["IOS", "MAC_OS", "TV_OS", "VISION_OS"]
              },
              versionString: {
                type: "string",
                description: "Version string in format X.Y or X.Y.Z (e.g., '1.0' or '1.0.0')"
              },
              copyright: {
                type: "string",
                description: "Copyright text for this version (optional)"
              },
              releaseType: {
                type: "string",
                description: "How the app should be released",
                enum: ["MANUAL", "AFTER_APPROVAL", "SCHEDULED"]
              },
              earliestReleaseDate: {
                type: "string",
                description: "Earliest release date in ISO 8601 format (required when releaseType is SCHEDULED)"
              },
              buildId: {
                type: "string",
                description: "ID of the build to associate with this version (optional)"
              }
            },
            required: ["appId", "platform", "versionString"]
          }
        },
        {
          name: "list_app_store_versions",
          description: "Get all app store versions for a specific app",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app"
              },
              limit: {
                type: "number",
                description: "Maximum number of versions to return (default: 100)",
                minimum: 1,
                maximum: 200
              },
              filter: {
                type: "object",
                properties: {
                  platform: {
                    type: "string",
                    description: "Filter by platform (IOS, MAC_OS, TV_OS)",
                    enum: ["IOS", "MAC_OS", "TV_OS"]
                  },
                  versionString: {
                    type: "string",
                    description: "Filter by version string (e.g., '1.0.0')"
                  },
                  appStoreState: {
                    type: "string",
                    description: "Filter by app store state",
                    enum: [
                      "DEVELOPER_REMOVED_FROM_SALE",
                      "DEVELOPER_REJECTED", 
                      "IN_REVIEW",
                      "INVALID_BINARY",
                      "METADATA_REJECTED",
                      "PENDING_APPLE_RELEASE",
                      "PENDING_CONTRACT",
                      "PENDING_DEVELOPER_RELEASE",
                      "PREPARE_FOR_SUBMISSION",
                      "PREORDER_READY_FOR_SALE",
                      "PROCESSING_FOR_APP_STORE",
                      "READY_FOR_SALE",
                      "REJECTED",
                      "REMOVED_FROM_SALE",
                      "WAITING_FOR_EXPORT_COMPLIANCE",
                      "WAITING_FOR_REVIEW",
                      "REPLACED_WITH_NEW_VERSION"
                    ]
                  }
                },
                description: "Optional filters for app store versions"
              }
            },
            required: ["appId"]
          }
        },
        {
          name: "list_app_store_version_localizations",
          description: "Get all localizations for a specific app store version",
          inputSchema: {
            type: "object",
            properties: {
              appStoreVersionId: {
                type: "string",
                description: "The ID of the app store version"
              },
              limit: {
                type: "number",
                description: "Maximum number of localizations to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["appStoreVersionId"]
          }
        },
        {
          name: "get_app_store_version_localization",
          description: "Get detailed information about a specific app store version localization",
          inputSchema: {
            type: "object",
            properties: {
              localizationId: {
                type: "string",
                description: "The ID of the app store version localization"
              }
            },
            required: ["localizationId"]
          }
        },
        {
          name: "update_app_store_version_localization",
          description: "Update a specific field in an app store version localization",
          inputSchema: {
            type: "object",
            properties: {
              localizationId: {
                type: "string",
                description: "The ID of the app store version localization to update"
              },
              field: {
                type: "string",
                enum: ["description", "keywords", "marketingUrl", "promotionalText", "supportUrl", "whatsNew"],
                description: "The field to update"
              },
              value: {
                type: "string",
                description: "The new value for the field"
              }
            },
            required: ["localizationId", "field", "value"]
          }
        },

        // Bundle ID Tools
        {
          name: "create_bundle_id",
          description: "Register a new bundle ID for app development",
          inputSchema: {
            type: "object",
            properties: {
              identifier: {
                type: "string",
                description: "The bundle ID string (e.g., 'com.example.app')"
              },
              name: {
                type: "string",
                description: "A name for the bundle ID"
              },
              platform: {
                type: "string",
                enum: ["IOS", "MAC_OS", "UNIVERSAL"],
                description: "The platform for this bundle ID"
              },
              seedId: {
                type: "string",
                description: "Your team's seed ID (optional)"
              }
            },
            required: ["identifier", "name", "platform"]
          }
        },
        {
          name: "list_bundle_ids",
          description: "Find and list bundle IDs that are registered to your team",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of bundle IDs to return (default: 100, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                description: "Sort order for the results",
                enum: [
                  "name", "-name", "platform", "-platform", 
                  "identifier", "-identifier", "seedId", "-seedId", "id", "-id"
                ]
              },
              filter: {
                type: "object",
                properties: {
                  identifier: { type: "string", description: "Filter by bundle identifier" },
                  name: { type: "string", description: "Filter by name" },
                  platform: { 
                    type: "string", 
                    description: "Filter by platform",
                    enum: ["IOS", "MAC_OS", "UNIVERSAL"]
                  },
                  seedId: { type: "string", description: "Filter by seed ID" }
                }
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["profiles", "bundleIdCapabilities", "app"]
                },
                description: "Related resources to include in the response"
              }
            }
          }
        },
        {
          name: "get_bundle_id_info",
          description: "Get detailed information about a specific bundle ID",
          inputSchema: {
            type: "object",
            properties: {
              bundleIdId: {
                type: "string",
                description: "The ID of the bundle ID to get information for"
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["profiles", "bundleIdCapabilities", "app"]
                },
                description: "Optional relationships to include in the response"
              },
              fields: {
                type: "object",
                properties: {
                  bundleIds: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["name", "platform", "identifier", "seedId"]
                    },
                    description: "Fields to include for the bundle ID"
                  }
                },
                description: "Specific fields to include in the response"
              }
            },
            required: ["bundleIdId"]
          }
        },
        {
          name: "enable_bundle_capability",
          description: "Enable a capability for a bundle ID",
          inputSchema: {
            type: "object",
            properties: {
              bundleIdId: {
                type: "string",
                description: "The ID of the bundle ID"
              },
              capabilityType: {
                type: "string",
                description: "The type of capability to enable",
                enum: [
                  "ICLOUD", "IN_APP_PURCHASE", "GAME_CENTER", "PUSH_NOTIFICATIONS", "WALLET",
                  "INTER_APP_AUDIO", "MAPS", "ASSOCIATED_DOMAINS", "PERSONAL_VPN", "APP_GROUPS",
                  "HEALTHKIT", "HOMEKIT", "WIRELESS_ACCESSORY_CONFIGURATION", "APPLE_PAY",
                  "DATA_PROTECTION", "SIRIKIT", "NETWORK_EXTENSIONS", "MULTIPATH", "HOT_SPOT",
                  "NFC_TAG_READING", "CLASSKIT", "AUTOFILL_CREDENTIAL_PROVIDER", "ACCESS_WIFI_INFORMATION",
                  "NETWORK_CUSTOM_PROTOCOL", "COREMEDIA_HLS_LOW_LATENCY", "SYSTEM_EXTENSION_INSTALL",
                  "USER_MANAGEMENT", "APPLE_ID_AUTH"
                ]
              },
              settings: {
                type: "array",
                description: "Optional capability settings",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string", description: "The setting key" },
                    options: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          key: { type: "string" },
                          enabled: { type: "boolean" }
                        }
                      }
                    }
                  }
                }
              }
            },
            required: ["bundleIdId", "capabilityType"]
          }
        },
        {
          name: "disable_bundle_capability",
          description: "Disable a capability for a bundle ID",
          inputSchema: {
            type: "object",
            properties: {
              capabilityId: {
                type: "string",
                description: "The ID of the capability to disable"
              }
            },
            required: ["capabilityId"]
          }
        },

        // Device Management Tools
        {
          name: "list_devices",
          description: "Get a list of all devices registered to your team",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of devices to return (default: 100, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                description: "Sort order for the results",
                enum: [
                  "name", "-name", "platform", "-platform", "status", "-status",
                  "udid", "-udid", "deviceClass", "-deviceClass", "model", "-model",
                  "addedDate", "-addedDate"
                ]
              },
              filter: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Filter by device name" },
                  platform: { 
                    type: "string", 
                    description: "Filter by platform",
                    enum: ["IOS", "MAC_OS"]
                  },
                  status: { 
                    type: "string", 
                    description: "Filter by status",
                    enum: ["ENABLED", "DISABLED"]
                  },
                  udid: { type: "string", description: "Filter by device UDID" },
                  deviceClass: { 
                    type: "string", 
                    description: "Filter by device class",
                    enum: ["APPLE_WATCH", "IPAD", "IPHONE", "IPOD", "APPLE_TV", "MAC"]
                  }
                }
              },
              fields: {
                type: "object",
                properties: {
                  devices: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["name", "platform", "udid", "deviceClass", "status", "model", "addedDate"]
                    },
                    description: "Fields to include for each device"
                  }
                }
              }
            }
          }
        },

        // User Management Tools
        {
          name: "list_users",
          description: "Get a list of all users registered on your App Store Connect team",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of users to return (default: 100, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                description: "Sort order for the results",
                enum: ["username", "-username", "firstName", "-firstName", "lastName", "-lastName", "roles", "-roles"]
              },
              filter: {
                type: "object",
                properties: {
                  username: { type: "string", description: "Filter by username" },
                  roles: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: [
                        "ADMIN", "FINANCE", "TECHNICAL", "SALES", "MARKETING", "DEVELOPER",
                        "ACCOUNT_HOLDER", "READ_ONLY", "APP_MANAGER", "ACCESS_TO_REPORTS", "CUSTOMER_SUPPORT"
                      ]
                    },
                    description: "Filter by user roles"
                  },
                  visibleApps: {
                    type: "array",
                    items: { type: "string" },
                    description: "Filter by apps the user can see (app IDs)"
                  }
                }
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["visibleApps"]
                },
                description: "Related resources to include in the response"
              }
            }
          }
        },

        // Analytics & Reports Tools
        {
          name: "create_analytics_report_request",
          description: "Create a new analytics report request for an app",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app to generate analytics reports for"
              },
              accessType: {
                type: "string",
                enum: ["ONGOING", "ONE_TIME_SNAPSHOT"],
                description: "Access type for the analytics report (ONGOING for daily data, ONE_TIME_SNAPSHOT for historical data)",
                default: "ONE_TIME_SNAPSHOT"
              }
            },
            required: ["appId"]
          }
        },
        {
          name: "list_analytics_reports",
          description: "Get available analytics reports for a specific report request",
          inputSchema: {
            type: "object",
            properties: {
              reportRequestId: {
                type: "string",
                description: "The ID of the analytics report request"
              },
              limit: {
                type: "number",
                description: "Maximum number of reports to return (default: 100)",
                minimum: 1,
                maximum: 200
              },
              filter: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: ["APP_STORE_ENGAGEMENT", "APP_STORE_COMMERCE", "APP_USAGE", "FRAMEWORKS_USAGE", "PERFORMANCE"],
                    description: "Filter by report category"
                  }
                }
              }
            },
            required: ["reportRequestId"]
          }
        },
        {
          name: "list_analytics_report_segments",
          description: "Get segments for a specific analytics report (contains download URLs)",
          inputSchema: {
            type: "object",
            properties: {
              reportId: {
                type: "string",
                description: "The ID of the analytics report"
              },
              limit: {
                type: "number",
                description: "Maximum number of segments to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["reportId"]
          }
        },
        {
          name: "download_analytics_report_segment",
          description: "Download data from an analytics report segment URL",
          inputSchema: {
            type: "object",
            properties: {
              segmentUrl: {
                type: "string",
                description: "The URL of the analytics report segment to download"
              }
            },
            required: ["segmentUrl"]
          }
        },

        // Xcode Development Tools
        {
          name: "list_schemes",
          description: "List all available schemes in an Xcode project or workspace",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "Path to the Xcode project (.xcodeproj) or workspace (.xcworkspace)"
              }
            },
            required: ["projectPath"]
          }
        },

        // Workflow Management Tools  
        {
          name: "list_workflows",
          description: "List all App Store Connect workflows (CI products) and their associated apps",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of workflows to return (default: 100, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                description: "Sort order for the results",
                enum: ["name", "-name", "productType", "-productType"]
              },
              filter: {
                type: "object",
                properties: {
                  productType: {
                    type: "string",
                    description: "Filter by product type",
                    enum: ["IOS", "MAC_OS", "TV_OS", "VISION_OS"]
                  }
                }
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["app", "bundleId", "primaryRepositories"]
                },
                description: "Related resources to include in the response"
              },
              fields: {
                type: "object",
                properties: {
                  ciProducts: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["name", "productType"]
                    },
                    description: "Fields to include for each workflow"
                  }
                }
              }
            }
          }
        },

        // Build Run Management Tools
        {
          name: "list_build_runs",
          description: "List build runs for a specific workflow/CI product, including git commit information",
          inputSchema: {
            type: "object",
            properties: {
              ciProductId: {
                type: "string",
                description: "The ID of the CI product (workflow) to list build runs for"
              },
              limit: {
                type: "number",
                description: "Maximum number of build runs to return (default: 100, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                description: "Sort order for the results",
                enum: ["number", "-number", "createdDate", "-createdDate", "startedDate", "-startedDate", "finishedDate", "-finishedDate"]
              },
              filter: {
                type: "object",
                properties: {
                  number: {
                    type: "number",
                    description: "Filter by build run number"
                  },
                  isPullRequestBuild: {
                    type: "boolean",
                    description: "Filter by whether it's a pull request build"
                  },
                  executionProgress: {
                    type: "string",
                    enum: ["PENDING", "RUNNING", "COMPLETE"],
                    description: "Filter by execution progress"
                  },
                  completionStatus: {
                    type: "string",
                    enum: ["SUCCEEDED", "FAILED", "ERRORED", "CANCELED", "SKIPPED"],
                    description: "Filter by completion status"
                  },
                  startReason: {
                    type: "string",
                    enum: ["MANUAL", "SCM_CHANGE", "PULL_REQUEST_UPDATE", "SCHEDULED"],
                    description: "Filter by start reason"
                  }
                }
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["builds", "workflow", "product", "sourceBranchOrTag", "destinationBranch", "pullRequest"]
                },
                description: "Related resources to include in the response"
              },
              fields: {
                type: "object",
                properties: {
                  ciBuildRuns: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["number", "createdDate", "startedDate", "finishedDate", "sourceCommit", "destinationCommit", "isPullRequestBuild", "issueCounts", "executionProgress", "completionStatus", "startReason", "cancelReason"]
                    },
                    description: "Fields to include for each build run"
                  }
                }
              }
            },
            required: ["ciProductId"]
          }
        },

        // CI Build Actions Management
        {
          name: "list_ci_build_actions",
          description: "List build actions (analyze, build, test, archive) for a specific build run",
          inputSchema: {
            type: "object",
            properties: {
              buildRunId: {
                type: "string",
                description: "The ID of the build run to list actions for"
              },
              limit: {
                type: "number",
                description: "Maximum number of build actions to return (default: 100, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                description: "Sort order for the results",
                enum: ["name", "-name", "actionType", "-actionType", "startedDate", "-startedDate", "finishedDate", "-finishedDate"]
              },
              filter: {
                type: "object",
                properties: {
                  actionType: {
                    type: "string",
                    enum: ["ANALYZE", "BUILD", "TEST", "ARCHIVE"],
                    description: "Filter by action type"
                  },
                  executionProgress: {
                    type: "string",
                    enum: ["PENDING", "RUNNING", "COMPLETE"],
                    description: "Filter by execution progress"
                  },
                  completionStatus: {
                    type: "string",
                    enum: ["SUCCEEDED", "FAILED", "ERRORED", "CANCELED", "SKIPPED"],
                    description: "Filter by completion status"
                  }
                }
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["buildRun", "issues", "testResults"]
                },
                description: "Related resources to include in the response"
              },
              fields: {
                type: "object",
                properties: {
                  ciBuildActions: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["name", "actionType", "startedDate", "finishedDate", "issueCounts", "executionProgress", "completionStatus"]
                    },
                    description: "Fields to include for each build action"
                  }
                }
              }
            },
            required: ["buildRunId"]
          }
        },

        {
          name: "get_ci_build_action",
          description: "Get detailed information about a specific build action",
          inputSchema: {
            type: "object",
            properties: {
              buildActionId: {
                type: "string",
                description: "The ID of the build action"
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["buildRun", "issues", "testResults"]
                },
                description: "Related resources to include in the response"
              },
              fields: {
                type: "object",
                properties: {
                  ciBuildActions: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["name", "actionType", "startedDate", "finishedDate", "issueCounts", "executionProgress", "completionStatus"]
                    },
                    description: "Fields to include for the build action"
                  }
                }
              }
            },
            required: ["buildActionId"]
          }
        },

        // CI Issues Management
        {
          name: "list_ci_issues",
          description: "List issues and errors from a build run or build action",
          inputSchema: {
            type: "object",
            properties: {
              buildRunId: {
                type: "string",
                description: "The ID of the build run to list issues for (provide either buildRunId or buildActionId)"
              },
              buildActionId: {
                type: "string",
                description: "The ID of the build action to list issues for (provide either buildRunId or buildActionId)"
              },
              limit: {
                type: "number",
                description: "Maximum number of issues to return (default: 100, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                description: "Sort order for the results",
                enum: ["issueType", "-issueType", "category", "-category", "message", "-message"]
              },
              filter: {
                type: "object",
                properties: {
                  issueType: {
                    type: "string",
                    enum: ["ANALYZER_WARNING", "ERROR", "TEST_FAILURE", "WARNING"],
                    description: "Filter by issue type"
                  },
                  category: {
                    type: "string",
                    description: "Filter by issue category"
                  }
                }
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["buildAction", "buildRun"]
                },
                description: "Related resources to include in the response"
              },
              fields: {
                type: "object",
                properties: {
                  ciIssues: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["issueType", "message", "fileSource", "category"]
                    },
                    description: "Fields to include for each issue"
                  }
                }
              }
            }
          }
        },

        // CI Test Results Management
        {
          name: "list_ci_test_results",
          description: "List test results from a build run or build action",
          inputSchema: {
            type: "object",
            properties: {
              buildRunId: {
                type: "string",
                description: "The ID of the build run to list test results for (provide either buildRunId or buildActionId)"
              },
              buildActionId: {
                type: "string",
                description: "The ID of the build action to list test results for (provide either buildRunId or buildActionId)"
              },
              limit: {
                type: "number",
                description: "Maximum number of test results to return (default: 100, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                description: "Sort order for the results",
                enum: ["className", "-className", "name", "-name", "status", "-status", "duration", "-duration"]
              },
              filter: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["SUCCESS", "FAILURE", "SKIPPED"],
                    description: "Filter by test status"
                  },
                  className: {
                    type: "string",
                    description: "Filter by test class name"
                  },
                  name: {
                    type: "string",
                    description: "Filter by test name"
                  }
                }
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["buildAction", "buildRun"]
                },
                description: "Related resources to include in the response"
              },
              fields: {
                type: "object",
                properties: {
                  ciTestResults: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["className", "name", "status", "fileLocation", "failureMessage", "duration"]
                    },
                    description: "Fields to include for each test result"
                  }
                }
              }
            }
          }
        }
    ];

    // Sales and Finance Report tools - only available if vendor number is configured
    const paymentReportTools = [
      {
        name: "download_sales_report",
        description: "Download sales and trends reports",
        inputSchema: {
          type: "object",
          properties: {
            vendorNumber: {
              type: "string",
              description: "Your vendor number from App Store Connect (optional if set as environment variable)",
              default: this.vendorNumber
            },
            reportType: {
              type: "string",
              enum: ["SALES"],
              description: "Type of report to download",
              default: "SALES"
            },
            reportSubType: {
              type: "string",
              enum: ["SUMMARY", "DETAILED"],
              description: "Sub-type of the report",
              default: "SUMMARY"
            },
            frequency: {
              type: "string",
              enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
              description: "Frequency of the report",
              default: "MONTHLY"
            },
            reportDate: {
              type: "string",
              description: "Report date in YYYY-MM format (e.g., '2024-01')"
            }
          },
          required: ["reportDate"]
        }
      },
      {
        name: "download_finance_report",
        description: "Download finance reports for a specific region",
        inputSchema: {
          type: "object",
          properties: {
            vendorNumber: {
              type: "string",
              description: "Your vendor number from App Store Connect (optional if set as environment variable)",
              default: this.vendorNumber
            },
            reportDate: {
              type: "string",
              description: "Report date in YYYY-MM format (e.g., '2024-01')"
            },
            regionCode: {
              type: "string",
              description: "Region code (e.g., 'Z1' for worldwide, 'WW' for Europe)"
            }
          },
          required: ["reportDate", "regionCode"]
        }
      }
    ];

    // Only include payment report tools if vendor number is configured
    if (this.vendorNumber) {
      return [...baseTools, ...paymentReportTools];
    }

    return baseTools;
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.buildToolsList()
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      try {
        const args = request.params.arguments || {};
        
        // Helper to format responses
        const formatResponse = (data: any) => {
          return {
            content: [{
              type: "text",
              text: JSON.stringify(data, null, 2)
            }]
          };
        };
        
        switch (request.params.name) {
          // App Management
          case "list_apps":
            const appsData = await this.appHandlers.listApps(args as any);
            return formatResponse(appsData);
          
          case "get_app_info":
            const appInfo = await this.appHandlers.getAppInfo(args as any);
            return formatResponse(appInfo);

          // Beta Testing
          case "list_beta_groups":
            return { toolResult: await this.betaHandlers.listBetaGroups(args as any) };
          
          case "list_group_testers":
            return { toolResult: await this.betaHandlers.listGroupTesters(args as any) };
          
          case "add_tester_to_group":
            return { toolResult: await this.betaHandlers.addTesterToGroup(args as any) };
          
          case "remove_tester_from_group":
            return { toolResult: await this.betaHandlers.removeTesterFromGroup(args as any) };
          
          case "list_beta_feedback_screenshots":
            const feedbackData = await this.betaHandlers.listBetaFeedbackScreenshots(args as any);
            return formatResponse(feedbackData);
          
          case "get_beta_feedback_screenshot":
            const result = await this.betaHandlers.getBetaFeedbackScreenshot(args as any);
            // If the result already contains content (image), return it directly
            if (result.content) {
              return result;
            }
            // Otherwise format as text
            return formatResponse(result);

          // App Store Version Localizations
          case "create_app_store_version":
            return { toolResult: await this.localizationHandlers.createAppStoreVersion(args as any) };
          
          case "list_app_store_versions":
            return { toolResult: await this.localizationHandlers.listAppStoreVersions(args as any) };
          
          case "list_app_store_version_localizations":
            return { toolResult: await this.localizationHandlers.listAppStoreVersionLocalizations(args as any) };
          
          case "get_app_store_version_localization":
            return { toolResult: await this.localizationHandlers.getAppStoreVersionLocalization(args as any) };
          
          case "update_app_store_version_localization":
            return { toolResult: await this.localizationHandlers.updateAppStoreVersionLocalization(args as any) };

          // Bundle IDs
          case "create_bundle_id":
            return { toolResult: await this.bundleHandlers.createBundleId(args as any) };
          
          case "list_bundle_ids":
            return { toolResult: await this.bundleHandlers.listBundleIds(args as any) };
          
          case "get_bundle_id_info":
            return { toolResult: await this.bundleHandlers.getBundleIdInfo(args as any) };
          
          case "enable_bundle_capability":
            return { toolResult: await this.bundleHandlers.enableBundleCapability(args as any) };
          
          case "disable_bundle_capability":
            return { toolResult: await this.bundleHandlers.disableBundleCapability(args as any) };

          // Devices
          case "list_devices":
            return { toolResult: await this.deviceHandlers.listDevices(args as any) };

          // Users
          case "list_users":
            return { toolResult: await this.userHandlers.listUsers(args as any) };

          // Analytics & Reports
          case "create_analytics_report_request":
            return { toolResult: await this.analyticsHandlers.createAnalyticsReportRequest(args as any) };
          
          case "list_analytics_reports":
            return { toolResult: await this.analyticsHandlers.listAnalyticsReports(args as any) };
          
          case "list_analytics_report_segments":
            return { toolResult: await this.analyticsHandlers.listAnalyticsReportSegments(args as any) };
          
          case "download_analytics_report_segment":
            return { toolResult: await this.analyticsHandlers.downloadAnalyticsReportSegment(args as any) };
          
          case "download_sales_report":
            if (!this.vendorNumber) {
              throw new McpError(
                ErrorCode.MethodNotFound,
                "Sales reports are not available. Please set APP_STORE_CONNECT_VENDOR_NUMBER environment variable."
              );
            }
            return { toolResult: await this.analyticsHandlers.downloadSalesReport(args as any) };
          
          case "download_finance_report":
            if (!this.vendorNumber) {
              throw new McpError(
                ErrorCode.MethodNotFound,
                "Finance reports are not available. Please set APP_STORE_CONNECT_VENDOR_NUMBER environment variable."
              );
            }
            return { toolResult: await this.analyticsHandlers.downloadFinanceReport(args as any) };

          // Xcode Development Tools
          case "list_schemes":
            return { toolResult: await this.xcodeHandlers.listSchemes(args as any) };

          // Workflow Management Tools
          case "list_workflows":
            const workflowsData = await this.workflowHandlers.listWorkflows(args as any);
            return formatResponse(workflowsData);

          case "list_build_runs":
            const buildRunsData = await this.workflowHandlers.listBuildRuns(args as any);
            return formatResponse(buildRunsData);

          // CI Build Actions Management
          case "list_ci_build_actions":
            const buildActionsData = await this.workflowHandlers.listBuildActions(args as any);
            return formatResponse(buildActionsData);

          case "get_ci_build_action":
            const buildActionData = await this.workflowHandlers.getBuildAction(args as any);
            return formatResponse(buildActionData);

          // CI Issues Management
          case "list_ci_issues":
            const issuesData = await this.workflowHandlers.listIssues(args as any);
            return formatResponse(issuesData);

          // CI Test Results Management
          case "list_ci_test_results":
            const testResultsData = await this.workflowHandlers.listTestResults(args as any);
            return formatResponse(testResultsData);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new McpError(
            ErrorCode.InternalError,
            `App Store Connect API error: ${error.response?.data?.errors?.[0]?.detail ?? error.message}`
          );
        }
        throw error;
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("App Store Connect MCP server running on stdio");
  }
}

function createServer({ config: smitheryConfig }: { config?: z.infer<typeof sessionConfig> } = {}) {
  if (smitheryConfig) {
    console.log("Smithery config received, setting credentials...");
    process.env.APP_STORE_CONNECT_KEY_ID = smitheryConfig.APP_STORE_CONNECT_KEY_ID;
    process.env.APP_STORE_CONNECT_ISSUER_ID = smitheryConfig.APP_STORE_CONNECT_ISSUER_ID;
    if (smitheryConfig.APP_STORE_CONNECT_P8_B64_STRING) {
      process.env.APP_STORE_CONNECT_P8_B64_STRING = smitheryConfig.APP_STORE_CONNECT_P8_B64_STRING;
    }
    if (smitheryConfig.APP_STORE_CONNECT_P8_PATH) {
      process.env.APP_STORE_CONNECT_P8_PATH = smitheryConfig.APP_STORE_CONNECT_P8_PATH;
    }
    if (smitheryConfig.APP_STORE_CONNECT_VENDOR_NUMBER) {
      process.env.APP_STORE_CONNECT_VENDOR_NUMBER = smitheryConfig.APP_STORE_CONNECT_VENDOR_NUMBER;
    }
  }
  
  const appConfig = loadConfigFromEnv();
  
  if (!appConfig.keyId || !appConfig.issuerId) {
    console.warn(
      "Warning: Missing App Store Connect credentials. " +
      "Please configure APP_STORE_CONNECT_KEY_ID and APP_STORE_CONNECT_ISSUER_ID. " +
      "Tools will fail until credentials are provided."
    );
  }
  
  if (!appConfig.privateKeyPath && !appConfig.privateKeyString) {
    console.warn(
      "Warning: Missing App Store Connect private key. " +
      "Please configure either APP_STORE_CONNECT_P8_PATH or APP_STORE_CONNECT_P8_B64_STRING. " +
      "Tools will fail until a private key is provided."
    );
  }
  
  const server = new AppStoreConnectServer(appConfig);
  return server.server;
}

Object.assign(createServer, { config: sessionConfig });

export default createServer;
export { sessionConfig as configSchema };

// Start the server directly when run as a script (not through Smithery)
if (import.meta.url === `file://${process.argv[1]}`) {
  const appConfig = loadConfigFromEnv();
  const server = new AppStoreConnectServer(appConfig);
  server.run().catch(console.error);
}
