import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema, ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import axios from 'axios';
// Load environment variables
const config = {
    keyId: process.env.APP_STORE_CONNECT_KEY_ID,
    issuerId: process.env.APP_STORE_CONNECT_ISSUER_ID,
    privateKeyPath: process.env.APP_STORE_CONNECT_P8_PATH,
};
// Validate required environment variables
if (!config.keyId || !config.issuerId || !config.privateKeyPath) {
    throw new Error("Missing required environment variables. Please set: " +
        "APP_STORE_CONNECT_KEY_ID, APP_STORE_CONNECT_ISSUER_ID, APP_STORE_CONNECT_P8_PATH");
}
class AppStoreConnectServer {
    server;
    axiosInstance;
    constructor() {
        this.server = new Server({
            name: "appstore-connect-server",
            version: "1.0.0"
        }, {
            capabilities: {
                tools: {}
            }
        });
        this.axiosInstance = axios.create({
            baseURL: 'https://api.appstoreconnect.apple.com/v1',
        });
        this.setupHandlers();
    }
    async generateToken() {
        const privateKey = await fs.readFile(config.privateKeyPath, 'utf-8');
        const token = jwt.sign({}, privateKey, {
            algorithm: 'ES256',
            expiresIn: '20m', // App Store Connect tokens can be valid for up to 20 minutes
            audience: 'appstoreconnect-v1',
            keyid: config.keyId,
            issuer: config.issuerId,
        });
        return token;
    }
    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [{
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
                }, {
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
                }, {
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
                }, {
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
                }, {
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
                }, {
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
                                        "appClips",
                                        "appInfos",
                                        "appStoreVersions",
                                        "availableTerritories",
                                        "betaAppReviewDetail",
                                        "betaGroups",
                                        "betaLicenseAgreement",
                                        "builds",
                                        "endUserLicenseAgreement",
                                        "gameCenterEnabledVersions",
                                        "inAppPurchases",
                                        "preOrder",
                                        "prices",
                                        "reviewSubmissions"
                                    ]
                                },
                                description: "Optional relationships to include in the response"
                            }
                        },
                        required: ["appId"]
                    }
                }, {
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
                                description: "Your team's seed ID (optional)",
                                required: false
                            }
                        },
                        required: ["identifier", "name", "platform"]
                    }
                }, {
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
                                    "name", "-name",
                                    "platform", "-platform",
                                    "identifier", "-identifier",
                                    "seedId", "-seedId",
                                    "id", "-id"
                                ]
                            },
                            filter: {
                                type: "object",
                                properties: {
                                    identifier: {
                                        type: "string",
                                        description: "Filter by bundle identifier"
                                    },
                                    name: {
                                        type: "string",
                                        description: "Filter by name"
                                    },
                                    platform: {
                                        type: "string",
                                        description: "Filter by platform",
                                        enum: ["IOS", "MAC_OS", "UNIVERSAL"]
                                    },
                                    seedId: {
                                        type: "string",
                                        description: "Filter by seed ID"
                                    }
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
                }, {
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
                                    enum: ["profiles", "bundleIdCapabilities", "app"],
                                    description: "Related resources to include in the response"
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
                }, {
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
                                    "name", "-name",
                                    "platform", "-platform",
                                    "status", "-status",
                                    "udid", "-udid",
                                    "deviceClass", "-deviceClass",
                                    "model", "-model",
                                    "addedDate", "-addedDate"
                                ]
                            },
                            filter: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string",
                                        description: "Filter by device name"
                                    },
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
                                    udid: {
                                        type: "string",
                                        description: "Filter by device UDID"
                                    },
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
                }, {
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
                                    "ICLOUD",
                                    "IN_APP_PURCHASE",
                                    "GAME_CENTER",
                                    "PUSH_NOTIFICATIONS",
                                    "WALLET",
                                    "INTER_APP_AUDIO",
                                    "MAPS",
                                    "ASSOCIATED_DOMAINS",
                                    "PERSONAL_VPN",
                                    "APP_GROUPS",
                                    "HEALTHKIT",
                                    "HOMEKIT",
                                    "WIRELESS_ACCESSORY_CONFIGURATION",
                                    "APPLE_PAY",
                                    "DATA_PROTECTION",
                                    "SIRIKIT",
                                    "NETWORK_EXTENSIONS",
                                    "MULTIPATH",
                                    "HOT_SPOT",
                                    "NFC_TAG_READING",
                                    "CLASSKIT",
                                    "AUTOFILL_CREDENTIAL_PROVIDER",
                                    "ACCESS_WIFI_INFORMATION",
                                    "NETWORK_CUSTOM_PROTOCOL",
                                    "COREMEDIA_HLS_LOW_LATENCY",
                                    "SYSTEM_EXTENSION_INSTALL",
                                    "USER_MANAGEMENT",
                                    "APPLE_ID_AUTH"
                                ]
                            },
                            settings: {
                                type: "array",
                                description: "Optional capability settings",
                                items: {
                                    type: "object",
                                    properties: {
                                        key: {
                                            type: "string",
                                            description: "The setting key"
                                        },
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
                }, {
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
                }, {
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
                                enum: [
                                    "username", "-username",
                                    "firstName", "-firstName",
                                    "lastName", "-lastName",
                                    "roles", "-roles"
                                ]
                            },
                            filter: {
                                type: "object",
                                properties: {
                                    username: {
                                        type: "string",
                                        description: "Filter by username"
                                    },
                                    roles: {
                                        type: "array",
                                        items: {
                                            type: "string",
                                            enum: [
                                                "ADMIN",
                                                "FINANCE",
                                                "TECHNICAL",
                                                "SALES",
                                                "MARKETING",
                                                "DEVELOPER",
                                                "ACCOUNT_HOLDER",
                                                "READ_ONLY",
                                                "APP_MANAGER",
                                                "ACCESS_TO_REPORTS",
                                                "CUSTOMER_SUPPORT"
                                            ]
                                        },
                                        description: "Filter by user roles"
                                    },
                                    visibleApps: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        },
                                        description: "Filter by apps the user can see (app IDs)"
                                    }
                                }
                            },
                            include: {
                                type: "array",
                                items: {
                                    type: "string",
                                    enum: ["visibleApps"],
                                    description: "Related resources to include in the response"
                                }
                            }
                        }
                    }
                }, {
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
                }, {
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
                }, {
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
                }, {
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
                }, {
                    name: "download_sales_report",
                    description: "Download sales and trends reports",
                    inputSchema: {
                        type: "object",
                        properties: {
                            vendorNumber: {
                                type: "string",
                                description: "Your vendor number from App Store Connect"
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
                        required: ["vendorNumber", "reportDate"]
                    }
                }, {
                    name: "download_finance_report",
                    description: "Download finance reports for a specific region",
                    inputSchema: {
                        type: "object",
                        properties: {
                            vendorNumber: {
                                type: "string",
                                description: "Your vendor number from App Store Connect"
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
                        required: ["vendorNumber", "reportDate", "regionCode"]
                    }
                }]
        }));
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                const token = await this.generateToken();
                switch (request.params.name) {
                    case "list_apps":
                        const response = await this.axiosInstance.get('/apps', {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            params: {
                                limit: request.params.arguments?.limit || 100
                            }
                        });
                        return {
                            toolResult: response.data
                        };
                    case "list_beta_groups": {
                        const response = await this.axiosInstance.get('/betaGroups', {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            params: {
                                limit: request.params.arguments?.limit || 100,
                                // Include relationships to get more details
                                include: 'app,betaTesters'
                            }
                        });
                        return {
                            toolResult: response.data
                        };
                    }
                    case "list_group_testers": {
                        const { groupId, limit = 100 } = request.params.arguments || {};
                        if (!groupId) {
                            throw new McpError(ErrorCode.InvalidParams, "groupId is required");
                        }
                        const response = await this.axiosInstance.get(`/betaGroups/${groupId}/betaTesters`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            params: {
                                limit
                            }
                        });
                        return {
                            toolResult: response.data
                        };
                    }
                    case "add_tester_to_group": {
                        const { groupId, email, firstName, lastName } = request.params.arguments;
                        if (!groupId || !email || !firstName || !lastName) {
                            throw new McpError(ErrorCode.InvalidParams, "groupId, email, firstName, and lastName are required");
                        }
                        const requestBody = {
                            data: {
                                type: "betaTesters",
                                attributes: {
                                    email,
                                    firstName,
                                    lastName
                                },
                                relationships: {
                                    betaGroups: {
                                        data: [{
                                                id: groupId,
                                                type: "betaGroups"
                                            }]
                                    }
                                }
                            }
                        };
                        const response = await this.axiosInstance.post('/betaTesters', requestBody, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        return {
                            toolResult: response.data
                        };
                    }
                    case "remove_tester_from_group": {
                        const { groupId, testerId } = request.params.arguments;
                        if (!groupId || !testerId) {
                            throw new McpError(ErrorCode.InvalidParams, "groupId and testerId are required");
                        }
                        await this.axiosInstance.delete(`/betaGroups/${groupId}/relationships/betaTesters`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            data: {
                                data: [{
                                        id: testerId,
                                        type: "betaTesters"
                                    }]
                            }
                        });
                        return {
                            toolResult: { success: true, message: "Tester removed from group successfully" }
                        };
                    }
                    case "get_app_info": {
                        const { appId, include } = request.params.arguments;
                        if (!appId) {
                            throw new McpError(ErrorCode.InvalidParams, "appId is required");
                        }
                        const response = await this.axiosInstance.get(`/apps/${appId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            params: {
                                include: include?.join(',')
                            }
                        });
                        return {
                            toolResult: response.data
                        };
                    }
                    case "create_bundle_id": {
                        const { identifier, name, platform, seedId } = request.params.arguments;
                        if (!identifier || !name || !platform) {
                            throw new McpError(ErrorCode.InvalidParams, "identifier, name, and platform are required");
                        }
                        const requestBody = {
                            data: {
                                type: "bundleIds",
                                attributes: {
                                    identifier,
                                    name,
                                    platform,
                                    seedId
                                }
                            }
                        };
                        const response = await this.axiosInstance.post('/bundleIds', requestBody, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        return {
                            toolResult: response.data
                        };
                    }
                    case "list_bundle_ids": {
                        const { limit = 100, sort, filter, include } = request.params.arguments || {};
                        const params = {
                            limit: Math.min(Number(limit), 200)
                        };
                        // Add sort parameter if provided
                        if (sort) {
                            params.sort = sort;
                        }
                        // Add filters if provided
                        if (filter) {
                            if (filter.identifier)
                                params['filter[identifier]'] = filter.identifier;
                            if (filter.name)
                                params['filter[name]'] = filter.name;
                            if (filter.platform)
                                params['filter[platform]'] = filter.platform;
                            if (filter.seedId)
                                params['filter[seedId]'] = filter.seedId;
                        }
                        // Add includes if provided
                        if (Array.isArray(include) && include.length > 0) {
                            params.include = include.join(',');
                        }
                        const response = await this.axiosInstance.get('/bundleIds', {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            params
                        });
                        return {
                            toolResult: response.data
                        };
                    }
                    case "get_bundle_id_info": {
                        const { bundleIdId, include, fields } = request.params.arguments;
                        if (!bundleIdId) {
                            throw new McpError(ErrorCode.InvalidParams, "bundleIdId is required");
                        }
                        const params = {};
                        // Add fields if provided
                        if (fields?.bundleIds?.length) {
                            params['fields[bundleIds]'] = fields.bundleIds.join(',');
                        }
                        // Add includes if provided
                        if (include?.length) {
                            params.include = include.join(',');
                        }
                        const response = await this.axiosInstance.get(`/bundleIds/${bundleIdId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            params
                        });
                        return {
                            toolResult: response.data
                        };
                    }
                    case "list_devices": {
                        const { limit = 100, sort, filter, fields } = request.params.arguments || {};
                        const params = {
                            limit: Math.min(Number(limit), 200)
                        };
                        // Add sort parameter if provided
                        if (sort) {
                            params.sort = sort;
                        }
                        // Add filters if provided
                        if (filter) {
                            if (filter.name)
                                params['filter[name]'] = filter.name;
                            if (filter.platform)
                                params['filter[platform]'] = filter.platform;
                            if (filter.status)
                                params['filter[status]'] = filter.status;
                            if (filter.udid)
                                params['filter[udid]'] = filter.udid;
                            if (filter.deviceClass)
                                params['filter[deviceClass]'] = filter.deviceClass;
                        }
                        // Add fields if provided
                        if (fields?.devices?.length) {
                            params['fields[devices]'] = fields.devices.join(',');
                        }
                        const response = await this.axiosInstance.get('/devices', {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            params
                        });
                        return {
                            toolResult: response.data
                        };
                    }
                    case "enable_bundle_capability": {
                        const { bundleIdId, capabilityType, settings } = request.params.arguments;
                        if (!bundleIdId || !capabilityType) {
                            throw new McpError(ErrorCode.InvalidParams, "bundleIdId and capabilityType are required");
                        }
                        const requestBody = {
                            data: {
                                type: "bundleIdCapabilities",
                                attributes: {
                                    capabilityType,
                                    settings
                                },
                                relationships: {
                                    bundleId: {
                                        data: {
                                            id: bundleIdId,
                                            type: "bundleIds"
                                        }
                                    }
                                }
                            }
                        };
                        const response = await this.axiosInstance.post('/bundleIdCapabilities', requestBody, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        return {
                            toolResult: response.data
                        };
                    }
                    case "disable_bundle_capability": {
                        const { capabilityId } = request.params.arguments;
                        if (!capabilityId) {
                            throw new McpError(ErrorCode.InvalidParams, "capabilityId is required");
                        }
                        await this.axiosInstance.delete(`/bundleIdCapabilities/${capabilityId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        return {
                            toolResult: {
                                success: true,
                                message: "Capability disabled successfully"
                            }
                        };
                    }
                    case "list_users": {
                        const { limit = 100, sort, filter, include } = request.params.arguments || {};
                        const params = {
                            limit: Math.min(Number(limit), 200)
                        };
                        // Add sort parameter if provided
                        if (sort) {
                            params.sort = sort;
                        }
                        // Add filters if provided
                        if (filter) {
                            if (filter.username)
                                params['filter[username]'] = filter.username;
                            if (filter.roles?.length)
                                params['filter[roles]'] = filter.roles.join(',');
                            if (filter.visibleApps?.length)
                                params['filter[visibleApps]'] = filter.visibleApps.join(',');
                        }
                        // Add includes if provided
                        if (Array.isArray(include) && include.length > 0) {
                            params.include = include.join(',');
                        }
                        const response = await this.axiosInstance.get('/users', {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            params
                        });
                        return {
                            toolResult: response.data
                        };
                    }
                    case "create_analytics_report_request": {
                        const { appId, accessType = "ONE_TIME_SNAPSHOT" } = request.params.arguments;
                        if (!appId) {
                            throw new McpError(ErrorCode.InvalidParams, "appId is required");
                        }
                        const requestBody = {
                            data: {
                                type: "analyticsReportRequests",
                                attributes: {
                                    accessType
                                },
                                relationships: {
                                    app: {
                                        data: {
                                            id: appId,
                                            type: "apps"
                                        }
                                    }
                                }
                            }
                        };
                        const response = await this.axiosInstance.post('/analyticsReportRequests', requestBody, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        return {
                            toolResult: response.data
                        };
                    }
                    case "list_analytics_reports": {
                        const { reportRequestId, limit = 100, filter } = request.params.arguments;
                        if (!reportRequestId) {
                            throw new McpError(ErrorCode.InvalidParams, "reportRequestId is required");
                        }
                        const params = {
                            limit: Math.min(Number(limit), 200)
                        };
                        // Add filter if provided
                        if (filter?.category) {
                            params['filter[category]'] = filter.category;
                        }
                        const response = await this.axiosInstance.get(`/analyticsReportRequests/${reportRequestId}/reports`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            params
                        });
                        return {
                            toolResult: response.data
                        };
                    }
                    case "list_analytics_report_segments": {
                        const { reportId, limit = 100 } = request.params.arguments;
                        if (!reportId) {
                            throw new McpError(ErrorCode.InvalidParams, "reportId is required");
                        }
                        const response = await this.axiosInstance.get(`/analyticsReports/${reportId}/segments`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            params: {
                                limit: Math.min(Number(limit), 200)
                            }
                        });
                        return {
                            toolResult: response.data
                        };
                    }
                    case "download_analytics_report_segment": {
                        const { segmentUrl } = request.params.arguments;
                        if (!segmentUrl) {
                            throw new McpError(ErrorCode.InvalidParams, "segmentUrl is required");
                        }
                        // Download from the provided URL (these are pre-signed URLs from Apple)
                        const response = await axios.get(segmentUrl, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        return {
                            toolResult: {
                                data: response.data,
                                contentType: response.headers['content-type'],
                                size: response.headers['content-length']
                            }
                        };
                    }
                    case "download_sales_report": {
                        const { vendorNumber, reportType = "SALES", reportSubType = "SUMMARY", frequency = "MONTHLY", reportDate } = request.params.arguments;
                        if (!vendorNumber || !reportDate) {
                            throw new McpError(ErrorCode.InvalidParams, "vendorNumber and reportDate are required");
                        }
                        const params = {
                            'filter[reportDate]': reportDate,
                            'filter[reportType]': reportType,
                            'filter[reportSubType]': reportSubType,
                            'filter[frequency]': frequency,
                            'filter[vendorNumber]': vendorNumber
                        };
                        const response = await this.axiosInstance.get('/salesReports', {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            params
                        });
                        return {
                            toolResult: response.data
                        };
                    }
                    case "download_finance_report": {
                        const { vendorNumber, reportDate, regionCode } = request.params.arguments;
                        if (!vendorNumber || !reportDate || !regionCode) {
                            throw new McpError(ErrorCode.InvalidParams, "vendorNumber, reportDate, and regionCode are required");
                        }
                        const params = {
                            'filter[reportDate]': reportDate,
                            'filter[regionCode]': regionCode,
                            'filter[vendorNumber]': vendorNumber
                        };
                        const response = await this.axiosInstance.get('/financeReports', {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            params
                        });
                        return {
                            toolResult: response.data
                        };
                    }
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
            }
            catch (error) {
                if (axios.isAxiosError(error)) {
                    throw new McpError(ErrorCode.InternalError, `App Store Connect API error: ${error.response?.data?.errors?.[0]?.detail ?? error.message}`);
                }
                throw error;
            }
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("App Store Connect MCP server running on stdio");
    }
}
// Start the server
const server = new AppStoreConnectServer();
server.run().catch(console.error);
