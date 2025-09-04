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