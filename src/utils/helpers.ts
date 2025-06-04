import { MappingConfig } from "../types";

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * 深拷贝对象
 * @param obj 要拷贝的对象
 * @returns 拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  if (typeof obj === "object") {
    const clonedObj = {} as T;
    Object.keys(obj).forEach((key) => {
      clonedObj[key as keyof T] = deepClone((obj as any)[key]);
    });
    return clonedObj;
  }

  return obj;
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param wait 等待时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastTime >= wait) {
      lastTime = now;
      func(...args);
    }
  };
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 格式化日期
 * @param date 日期
 * @param format 格式字符串
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string, format: string = "YYYY-MM-DD HH:mm:ss"): string {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return "无效日期";
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return format
    .replace("YYYY", year.toString())
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
}

/**
 * 下载文件
 * @param content 文件内容
 * @param filename 文件名
 * @param contentType 内容类型
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  contentType: string = "text/plain"
): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns Promise<boolean> 是否成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const result = document.execCommand("copy");
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error("复制到剪贴板失败:", error);
    return false;
  }
}

/**
 * 验证URL格式
 * @param url URL字符串
 * @returns 是否为有效URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证JSON格式
 * @param jsonString JSON字符串
 * @returns 是否为有效JSON
 */
export function isValidJson(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取字段名称的相似度
 * @param name1 字段名1
 * @param name2 字段名2
 * @param options 配置选项
 * @returns 相似度分数 (0-1)
 */
export function getFieldNameSimilarity(
  name1: string,
  name2: string,
  options: { considerType?: boolean; typeWeight?: number } = {}
): number {
  const {} = options;
  const str1 = name1.toLowerCase();
  const str2 = name2.toLowerCase();

  // 完全匹配
  if (str1 === str2) {
    return 1;
  }

  // 处理常见的前缀/后缀
  const normalizedStr1 = normalizeFieldName(str1);
  const normalizedStr2 = normalizeFieldName(str2);

  if (normalizedStr1 === normalizedStr2) {
    return 0.95; // 标准化后完全匹配
  }

  // 包含关系
  if (normalizedStr1.includes(normalizedStr2) || normalizedStr2.includes(normalizedStr1)) {
    return 0.8;
  }

  // 编辑距离算法
  const distance = levenshteinDistance(normalizedStr1, normalizedStr2);
  const maxLength = Math.max(normalizedStr1.length, normalizedStr2.length);
  const nameSimilarity = maxLength === 0 ? 1 : (maxLength - distance) / maxLength;

  return nameSimilarity;
}

/**
 * 标准化字段名称（移除常见前缀/后缀，处理驼峰和下划线等）
 * @param fieldName 字段名称
 * @returns 标准化后的字段名称
 */
export function normalizeFieldName(fieldName: string): string {
  // 转为小写
  let normalized = fieldName.toLowerCase();

  // 移除常见前缀
  const prefixes = [
    "fld_",
    "field_",
    "col_",
    "column_",
    "f_",
    "c_",
    "tbl_",
    "table_",
    "src_",
    "source_",
    "tgt_",
    "target_",
  ];
  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.substring(prefix.length);
      break;
    }
  }

  // 移除常见后缀
  const suffixes = [
    "_id",
    "_code",
    "_name",
    "_value",
    "_text",
    "_date",
    "_time",
    "_num",
    "_number",
  ];
  for (const suffix of suffixes) {
    if (normalized.endsWith(suffix)) {
      normalized = normalized.substring(0, normalized.length - suffix.length);
      break;
    }
  }

  // 处理驼峰命名转为下划线
  normalized = normalized.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();

  // 移除所有非字母数字字符
  normalized = normalized.replace(/[^a-z0-9]/g, "");

  return normalized;
}

/**
 * 计算两个字符串的编辑距离
 * @param str1 字符串1
 * @param str2 字符串2
 * @returns 编辑距离
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create a matrix of size (m+1)x(n+1) to store distances
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  // Return the bottom-right value of the matrix
  return dp[m][n];
}

/**
 * 保存配置到本地存储
 * @param key 存储键
 * @param config 配置对象
 */
export function saveConfigToStorage(key: string, config: any): void {
  try {
    const serialized = JSON.stringify(config);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error("保存配置失败:", error);
  }
}

/**
 * 从本地存储加载配置
 * @param key 存储键
 * @returns 配置对象或null
 */
export function loadConfigFromStorage<T = any>(key: string): T | null {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized) {
      return JSON.parse(serialized);
    }
  } catch (error) {
    console.error("加载配置失败:", error);
  }
  return null;
}

/**
 * 清除本地存储中的配置
 * @param key 存储键
 */
export function clearConfigFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("清除配置失败:", error);
  }
}

/**
 * 导出映射配置为JSON
 * @param config 映射配置
 * @returns JSON字符串
 */
export function exportMappingAsJson(config: MappingConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * 导出映射配置为SQL
 * @param config 映射配置
 * @returns SQL字符串
 */
export function exportMappingAsSql(config: MappingConfig): string {
  const tableName = config.sourceConfig.tableName || "target_table";
  const mappings = config.mappings.filter((m) => m.sourceField && m.targetField);

  if (mappings.length === 0) {
    return "-- 没有有效的映射规则";
  }

  const selectFields = mappings.map((m) => `  ${m.sourceField} AS ${m.targetField}`).join(",\n");

  return `-- 映射配置: ${config.name}
-- 生成时间: ${formatDate(new Date())}

SELECT
${selectFields}
FROM ${tableName};`;
}

/**
 * 导出映射配置为CSV
 * @param config 映射配置
 * @returns CSV字符串
 */
export function exportMappingAsCsv(config: MappingConfig): string {
  const headers = ["源字段", "目标字段", "类型转换", "验证状态"];
  const rows = config.mappings.map((m) => [
    m.sourceField || "",
    m.targetField || "",
    m.transform?.type || "直接映射",
    m.validated ? "已验证" : "未验证",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  return csvContent;
}

/**
 * 生成映射配置的哈希值
 * @param config 映射配置
 * @returns 哈希值
 */
export function generateConfigHash(config: MappingConfig): string {
  const content = JSON.stringify({
    sourceConfig: config.sourceConfig,
    mappings: config.mappings,
    targetFields: config.targetFields,
  });

  // 简单的哈希算法
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 转换为32位整数
  }

  return Math.abs(hash).toString(36);
}
