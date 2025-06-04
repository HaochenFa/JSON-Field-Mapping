import { FieldInfo } from "../types";
import { isArray, isObject, isString, isNumber, isBoolean } from "lodash-es";
import { generateId } from "./helpers";

/**
 * 从JSON数据中解析字段信息
 * @param data JSON数据数组
 * @returns 字段信息数组
 */
export function parseJsonFields(data: any[]): FieldInfo[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const fieldMap = new Map<string, FieldInfo>();

  // 遍历所有记录，收集字段信息
  data.forEach((record, index) => {
    if (isObject(record) && !isArray(record)) {
      parseObjectFields(record, "", fieldMap, index === 0);
    }
  });

  // 转换为数组并排序
  const fields = Array.from(fieldMap.values());
  return fields.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * 递归解析对象字段
 * @param obj 对象
 * @param parentPath 父路径
 * @param fieldMap 字段映射
 * @param isFirstRecord 是否为第一条记录
 */
function parseObjectFields(
  obj: any,
  parentPath: string,
  fieldMap: Map<string, FieldInfo>,
  isFirstRecord: boolean
): void {
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    const currentPath = parentPath ? `${parentPath}.${key}` : key;
    const fieldName = currentPath;

    // 获取或创建字段信息
    let fieldInfo = fieldMap.get(fieldName);
    if (!fieldInfo) {
      fieldInfo = {
        id: generateId(),
        name: fieldName,
        type: "string",
        path: currentPath,
        nullable: false,
        required: false,
        sample: value,
      };
      fieldMap.set(fieldName, fieldInfo);
    } else if (value !== null && value !== undefined) {
      // 更新样例值
      fieldInfo.sample = value;
    }

    // 更新字段类型和可空性
    const valueType = getValueType(value);
    if (isFirstRecord || fieldInfo.type === "string") {
      fieldInfo.type = valueType;
    } else if (fieldInfo.type !== valueType && valueType !== "string") {
      // 如果类型不一致，设为string类型（最通用）
      fieldInfo.type = "string";
    }

    // 检查是否可空
    if (value === null || value === undefined) {
      fieldInfo.nullable = true;
    }

    // 递归处理嵌套对象
    if (isObject(value) && !isArray(value) && value !== null) {
      parseObjectFields(value, currentPath, fieldMap, isFirstRecord);
    }

    // 处理数组
    if (isArray(value) && value.length > 0) {
      // 为数组本身创建字段
      fieldInfo.type = "array";

      // 分析数组元素类型
      const elementTypes = new Set<string>();
      value.forEach((item, index) => {
        if (index < 10) {
          // 只分析前10个元素以提高性能
          const itemType = getValueType(item);
          elementTypes.add(itemType);

          // 如果数组元素是对象，递归解析
          if (isObject(item) && !isArray(item)) {
            parseObjectFields(
              item,
              `${currentPath}[${index}]`,
              fieldMap,
              isFirstRecord && index === 0
            );
          }
        }
      });

      // 设置数组元素类型描述
      if (elementTypes.size === 1) {
        fieldInfo.description = `Array of ${Array.from(elementTypes)[0]}`;
      } else {
        fieldInfo.description = `Array of mixed types: ${Array.from(elementTypes).join(", ")}`;
      }
    }
  });
}

/**
 * 获取值的类型
 * @param value 值
 * @returns 类型字符串
 */
function getValueType(value: any): FieldInfo["type"] {
  if (value === null || value === undefined) {
    return "string"; // 默认为string
  }

  if (isBoolean(value)) {
    return "boolean";
  }

  if (isNumber(value)) {
    return "number";
  }

  if (isString(value)) {
    // 尝试识别日期字符串
    if (isDateString(value)) {
      return "date";
    }
    return "string";
  }

  if (isArray(value)) {
    return "array";
  }

  if (isObject(value)) {
    return "object";
  }

  return "string";
}

/**
 * 检查字符串是否为日期格式
 * @param value 字符串值
 * @returns 是否为日期
 */
function isDateString(value: string): boolean {
  // 常见日期格式的正则表达式
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO 8601
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
  ];

  return datePatterns.some((pattern) => pattern.test(value)) && !isNaN(Date.parse(value));
}

/**
 * 扁平化嵌套字段路径
 * @param fields 字段数组
 * @returns 扁平化的字段数组
 */
export function flattenFields(fields: FieldInfo[]): FieldInfo[] {
  return fields.filter((field) => {
    // 过滤掉中间层的对象字段，只保留叶子节点
    return !fields.some(
      (otherField) => otherField.path.startsWith(field.path + ".") && otherField.path !== field.path
    );
  });
}

/**
 * 根据路径获取嵌套对象的值
 * @param obj 对象
 * @param path 路径
 * @returns 值
 */
export function getValueByPath(obj: any, path: string): any {
  if (!path || !obj) return undefined;

  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    // 处理数组索引
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayKey, index] = arrayMatch;
      current = current?.[arrayKey]?.[parseInt(index)];
    } else {
      current = current?.[key];
    }

    if (current === undefined || current === null) {
      return current;
    }
  }

  return current;
}

/**
 * 生成字段的JSONPath表达式
 * @param fieldPath 字段路径
 * @returns JSONPath表达式
 */
export function generateJsonPath(fieldPath: string): string {
  if (!fieldPath) return "$";

  // 将点分隔的路径转换为JSONPath格式
  const parts = fieldPath.split(".");
  let jsonPath = "$";

  for (const part of parts) {
    // 处理数组索引
    const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      jsonPath += `['${key}'][${index}]`;
    } else {
      jsonPath += `['${part}']`;
    }
  }

  return jsonPath;
}

/**
 * 验证字段类型兼容性
 * @param sourceType 源字段类型
 * @param targetType 目标字段类型
 * @returns 是否兼容
 */
export function isTypeCompatible(
  sourceType: FieldInfo["type"],
  targetType: FieldInfo["type"]
): boolean {
  // 完全匹配
  if (sourceType === targetType) {
    return true;
  }

  // 字符串可以转换为任何类型
  if (sourceType === "string") {
    return true;
  }

  // 数字可以转换为字符串
  if (sourceType === "number" && targetType === "string") {
    return true;
  }

  // 布尔值可以转换为字符串
  if (sourceType === "boolean" && targetType === "string") {
    return true;
  }

  // 日期可以转换为字符串
  if (sourceType === "date" && targetType === "string") {
    return true;
  }

  return false;
}
