/**
 * 存储工具函数
 * 用于在本地存储中保存和加载配置
 */

/**
 * 将配置保存到本地存储
 * @param key 存储键名
 * @param data 要保存的数据
 */
export function saveConfigToStorage<T>(key: string, data: T): void {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error("保存配置到本地存储失败:", error);
  }
}

/**
 * 从本地存储加载配置
 * @param key 存储键名
 * @returns 加载的数据，如果不存在则返回null
 */
export function loadConfigFromStorage<T>(key: string): T | null {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return null;
    }
    return JSON.parse(serializedData) as T;
  } catch (error) {
    console.error("从本地存储加载配置失败:", error);
    return null;
  }
}

/**
 * 从本地存储中清除配置
 * @param key 存储键名
 */
export function clearConfigFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("从本地存储清除配置失败:", error);
  }
}

/**
 * 获取本地存储中所有键名
 * @returns 键名数组
 */
export function getStorageKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  } catch (error) {
    console.error("获取本地存储键名失败:", error);
    return [];
  }
}

/**
 * 检查本地存储是否可用
 * @returns 是否可用
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}
