// 数据库配置接口
export interface DatabaseConfig {
  type: "api" | "database"; // 配置类型：API 或内网数据库
  url: string;
  apiKey: string;
  tableName: string;
  headers?: Record<string, string>;
  timeout?: number;
  // 内网数据库特有配置
  username?: string;
  password?: string;
  port?: number;
  database?: string;
}

// 字段信息接口
export interface FieldInfo {
  id?: string;
  name: string;
  type: "string" | "number" | "boolean" | "date" | "object" | "array";
  path: string; // JSONPath表达式
  nullable: boolean;
  description?: string;
  constraints?: FieldConstraints;
  required?: boolean;
  sample?: any;
  defaultValue?: any;
}

// 字段约束接口
export interface FieldConstraints {
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  enum?: string[];
  format?: string;
}

// 映射规则接口
export interface MappingRule {
  id: string;
  sourceField: string;
  targetField: string;
  transform?: TransformRule;
  validated: boolean;
  confidence?: number; // 添加置信度字段
}

// 转换规则接口
export interface TransformRule {
  type: "direct" | "format" | "calculate" | "lookup" | "expression" | "constant";
  expression?: string;
  defaultValue?: any;
  nullable?: boolean;
  parameters?: Record<string, any>;
}

// 拖拽状态接口
export interface DragState {
  isDragging: boolean;
  draggedField?: FieldInfo;
  dropTarget?: string;
}

// 分页信息接口
export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 映射配置接口
export interface MappingConfig {
  id: string;
  name: string;
  description?: string;
  sourceConfig: DatabaseConfig;
  targetFields: FieldInfo[];
  mappings: MappingRule[];
  createdAt: Date;
  updatedAt: Date;
}

// 应用状态接口
export interface AppState {
  // 连接状态
  connection: {
    status: "idle" | "connecting" | "connected" | "error";
    config: DatabaseConfig;
    error?: string;
  };

  // 数据状态
  data: {
    source: any[];
    sourceFields: FieldInfo[];
    targetFields: FieldInfo[];
    loading: boolean;
    pagination?: PaginationInfo;
  };

  // 映射状态
  mapping: {
    rules: MappingRule[];
    dragState: DragState;
  };

  // UI状态
  ui: {
    leftPanelView: "json" | "table" | "fields";
    selectedMapping?: string;
    sidebarCollapsed: boolean;
  };
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationInfo;
}

// 导出配置接口
export interface ExportConfig {
  format: "json" | "xml" | "sql" | "csv";
  includeData: boolean;
  includeSchema: boolean;
  customTemplate?: string;
}

// 验证结果接口
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  ruleId?: string; // 添加可选的ruleId属性
  message: string;
  type: "type_mismatch" | "required_missing" | "constraint_violation";
}

export interface ValidationWarning {
  field: string;
  message: string;
  type: "performance" | "compatibility" | "best_practice";
}
