import { validateRequired, sanitizeLimit, buildFilterParams } from '../utils/index.js';
export class AnalyticsHandlers {
    client;
    config;
    constructor(client, config) {
        this.client = client;
        this.config = config;
    }
    async createAnalyticsReportRequest(args) {
        const { appId, accessType = "ONE_TIME_SNAPSHOT" } = args;
        validateRequired(args, ['appId']);
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
        return this.client.post('/analyticsReportRequests', requestBody);
    }
    async listAnalyticsReports(args) {
        const { reportRequestId, limit = 100, filter } = args;
        validateRequired(args, ['reportRequestId']);
        const params = {
            limit: sanitizeLimit(limit)
        };
        Object.assign(params, buildFilterParams(filter));
        return this.client.get(`/analyticsReportRequests/${reportRequestId}/reports`, params);
    }
    async listAnalyticsReportSegments(args) {
        const { reportId, limit = 100 } = args;
        validateRequired(args, ['reportId']);
        return this.client.get(`/analyticsReports/${reportId}/segments`, {
            limit: sanitizeLimit(limit)
        });
    }
    async downloadAnalyticsReportSegment(args) {
        const { segmentUrl } = args;
        validateRequired(args, ['segmentUrl']);
        return this.client.downloadFromUrl(segmentUrl);
    }
    async downloadSalesReport(args) {
        const { vendorNumber = this.config?.vendorNumber, reportType = "SALES", reportSubType = "SUMMARY", frequency = "MONTHLY", reportDate } = args;
        if (!vendorNumber) {
            throw new Error('Vendor number is required. Please provide it as an argument or set APP_STORE_CONNECT_VENDOR_NUMBER environment variable.');
        }
        validateRequired({ reportDate }, ['reportDate']);
        const filters = {
            reportDate,
            reportType,
            reportSubType,
            frequency,
            vendorNumber
        };
        return this.client.get('/salesReports', buildFilterParams(filters));
    }
    async downloadFinanceReport(args) {
        const { vendorNumber = this.config?.vendorNumber, reportDate, regionCode } = args;
        if (!vendorNumber) {
            throw new Error('Vendor number is required. Please provide it as an argument or set APP_STORE_CONNECT_VENDOR_NUMBER environment variable.');
        }
        validateRequired({ reportDate, regionCode }, ['reportDate', 'regionCode']);
        const filters = {
            reportDate,
            regionCode,
            vendorNumber
        };
        return this.client.get('/financeReports', buildFilterParams(filters));
    }
}
