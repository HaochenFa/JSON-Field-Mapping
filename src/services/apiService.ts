import axios, { AxiosInstance, AxiosResponse } from "axios";
import { DatabaseConfig, ApiResponse, PaginationInfo } from "../types";

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // console.log("API Request:", config.method?.toUpperCase(), config.url); // 注释掉调试代码
        return config;
      },
      (error) => {
        console.error("Request Error:", error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        // console.log("API Response:", response.status, response.config.url); // 注释掉调试代码
        return response;
      },
      (error) => {
        console.error("Response Error:", error.response?.status, error.message);

        // 统一错误处理
        if (error.response?.status === 401) {
          throw new Error("认证失败，请检查API密钥");
        } else if (error.response?.status === 403) {
          throw new Error("权限不足，无法访问该资源");
        } else if (error.response?.status === 404) {
          throw new Error("请求的资源不存在");
        } else if (error.response?.status >= 500) {
          throw new Error("服务器内部错误，请稍后重试");
        } else if (error.code === "ECONNABORTED") {
          throw new Error("请求超时，请检查网络连接");
        } else if (error.code === "ERR_NETWORK") {
          throw new Error("网络错误，请检查网络连接");
        }

        return Promise.reject(error);
      }
    );
  }

  // 测试数据库连接
  async testConnection(config: DatabaseConfig): Promise<ApiResponse> {
    try {
      let endpoint = "/test-connection";

      // 根据配置类型选择不同的端点
      if (config.type === "database") {
        endpoint = "/test-database-connection";
      }

      const response = await this.client.post(endpoint, config);

      return {
        success: true,
        data: response.data,
        message: "连接测试成功",
      };
    } catch (error: any) {
      throw new Error(error.message || "连接测试失败");
    }
  }

  // 连接数据库
  async connect(config: DatabaseConfig): Promise<ApiResponse> {
    try {
      let endpoint = "/connect";

      // 根据配置类型选择不同的端点
      if (config.type === "database") {
        endpoint = "/connect-database";
      }

      const response = await this.client.post(endpoint, config);

      return {
        success: true,
        data: response.data,
        message: "连接成功",
      };
    } catch (error: any) {
      throw new Error(error.message || "连接失败");
    }
  }

  // 获取数据
  async fetchData(
    config: DatabaseConfig,
    params: { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse> {
    try {
      const headers = {
        ...config.headers,
        Authorization: config.apiKey ? `Bearer ${config.apiKey}` : undefined,
      };

      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());
      if (config.tableName) queryParams.append("table", config.tableName);

      const url = `${config.url}/data${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

      const response = await this.client.get(url, {
        headers,
        timeout: config.timeout || 30000,
      });

      // 处理不同的响应格式
      let data = response.data;
      let pagination: PaginationInfo | undefined;

      // 检测分页信息
      if (data.data && data.pagination) {
        // 标准分页格式
        pagination = data.pagination;
        data = data.data;
      } else if (data.items && data.total) {
        // 另一种分页格式
        pagination = {
          currentPage: data.page || 1,
          pageSize: data.pageSize || data.items.length,
          totalPages: Math.ceil(data.total / (data.pageSize || data.items.length)),
          totalRecords: data.total,
          hasNext: (data.page || 1) * (data.pageSize || data.items.length) < data.total,
          hasPrevious: (data.page || 1) > 1,
        };
        data = data.items;
      } else if (Array.isArray(data)) {
        // 直接返回数组，无分页
        data = data;
      } else {
        // 其他格式，尝试提取数组数据
        const possibleArrayKeys = ["records", "results", "rows", "list"];
        for (const key of possibleArrayKeys) {
          if (data[key] && Array.isArray(data[key])) {
            data = data[key];
            break;
          }
        }
      }

      return {
        success: true,
        data: {
          records: Array.isArray(data) ? data : [data],
          pagination,
        },
        message: "数据获取成功",
      };
    } catch (error: any) {
      throw new Error(error.message || "数据获取失败");
    }
  }

  // 获取表结构
  async getTableSchema(config: DatabaseConfig): Promise<ApiResponse> {
    try {
      const headers = {
        ...config.headers,
        Authorization: config.apiKey ? `Bearer ${config.apiKey}` : undefined,
      };

      const response = await this.client.get(`${config.url}/schema/${config.tableName}`, {
        headers,
        timeout: config.timeout || 15000,
      });

      return {
        success: true,
        data: response.data,
        message: "表结构获取成功",
      };
    } catch (error: any) {
      throw new Error(error.message || "表结构获取失败");
    }
  }

  // 验证映射配置
  async validateMapping(mappingConfig: any): Promise<ApiResponse> {
    try {
      const response = await this.client.post("/validate", mappingConfig);

      return {
        success: true,
        data: response.data,
        message: "映射验证完成",
      };
    } catch (error: any) {
      throw new Error(error.message || "映射验证失败");
    }
  }

  // 导出映射配置
  async exportMapping(mappingConfig: any, format: string): Promise<Blob> {
    try {
      const response = await this.client.post(
        "/export",
        { ...mappingConfig, format },
        {
          responseType: "blob",
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(error.message || "导出失败");
    }
  }

  // 通用GET请求
  async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  // 通用POST请求
  async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  // 通用PUT请求
  async put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  // 通用DELETE请求
  async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }
}

export const apiService = new ApiService();
