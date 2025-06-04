import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MappingRule, DragState, FieldInfo } from "../../types";
import { generateId, getFieldNameSimilarity } from "../../utils/helpers";

interface MappingState {
  rules: MappingRule[];
  dragState: DragState;
}

const initialState: MappingState = {
  rules: [],
  dragState: {
    isDragging: false,
  },
};

const mappingSlice = createSlice({
  name: "mapping",
  initialState,
  reducers: {
    // 添加映射规则
    addMapping: (state, action: PayloadAction<{ sourceField: string; targetField: string }>) => {
      const { sourceField, targetField } = action.payload;

      // 检查是否已存在相同的映射
      const existingIndex = state.rules.findIndex(
        (rule) => rule.sourceField === sourceField || rule.targetField === targetField
      );

      const newRule: MappingRule = {
        id: generateId(),
        sourceField,
        targetField,
        validated: false,
        transform: {
          type: "direct",
          nullable: false,
        },
      };

      if (existingIndex !== -1) {
        // 替换现有映射
        state.rules[existingIndex] = newRule;
      } else {
        // 添加新映射
        state.rules.push(newRule);
      }
    },

    // 删除映射规则
    removeMapping: (state, action: PayloadAction<string>) => {
      state.rules = state.rules.filter((rule) => rule.id !== action.payload);
    },

    // 更新映射规则
    updateMapping: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<MappingRule> }>
    ) => {
      const { id, updates } = action.payload;
      const index = state.rules.findIndex((rule) => rule.id === id);
      if (index !== -1) {
        state.rules[index] = { ...state.rules[index], ...updates };
      }
    },

    // 批量添加映射
    addMappings: (state, action: PayloadAction<MappingRule[]>) => {
      state.rules = [...state.rules, ...action.payload];
    },

    // 清空所有映射
    clearMappings: (state) => {
      state.rules = [];
    },

    // 重置映射（保留目标字段，清除源字段映射）
    resetMappings: (state) => {
      state.rules = state.rules.map((rule) => ({
        ...rule,
        sourceField: "",
        validated: false,
      }));
    },

    // 自动映射（根据字段名称相似度）
    autoMapping: (
      state,
      action: PayloadAction<{
        sourceFields: FieldInfo[];
        targetFields: FieldInfo[];
        threshold?: number;
        considerType?: boolean;
      }>
    ) => {
      const { sourceFields, targetFields, threshold = 0.6, considerType = true } = action.payload;
      const newRules: MappingRule[] = [];
      const usedSourceFields = new Set<string>();

      // 第一轮：寻找完全匹配或高度相似的字段
      targetFields.forEach((targetField) => {
        // 按相似度对源字段进行排序
        const matchedFields = sourceFields
          .filter((sf) => !usedSourceFields.has(sf.name))
          .map((sf) => ({
            field: sf,
            similarity: getFieldNameSimilarity(sf.name, targetField.name, { considerType }),
          }))
          .filter((match) => match.similarity >= threshold)
          .sort((a, b) => b.similarity - a.similarity);

        if (matchedFields.length > 0) {
          const bestMatch = matchedFields[0];
          usedSourceFields.add(bestMatch.field.name);

          newRules.push({
            id: generateId(),
            sourceField: bestMatch.field.name,
            targetField: targetField.name,
            validated:
              bestMatch.field.type === targetField.type ||
              (bestMatch.field.type === "string" &&
                targetField.type !== "object" &&
                targetField.type !== "array") ||
              (bestMatch.field.type === "number" && targetField.type === "string"),
            transform: {
              type: "direct",
              nullable: false,
            },
            confidence: bestMatch.similarity, // 添加置信度字段
          });
        }
      });

      state.rules = newRules;
    },

    // 验证映射规则
    validateMapping: (state, action: PayloadAction<{ id: string; isValid: boolean }>) => {
      const { id, isValid } = action.payload;
      const index = state.rules.findIndex((rule) => rule.id === id);
      if (index !== -1) {
        state.rules[index].validated = isValid;
      }
    },

    // 验证所有映射规则
    validateAllMappings: (
      state,
      action: PayloadAction<{ sourceFields: FieldInfo[]; targetFields: FieldInfo[] }>
    ) => {
      const { sourceFields, targetFields } = action.payload;

      state.rules.forEach((rule) => {
        const sourceField = sourceFields.find((sf) => sf.name === rule.sourceField);
        const targetField = targetFields.find((tf) => tf.name === rule.targetField);

        if (sourceField && targetField) {
          // 简单的类型兼容性检查
          rule.validated =
            sourceField.type === targetField.type ||
            (sourceField.type === "string" &&
              targetField.type !== "object" &&
              targetField.type !== "array") ||
            (sourceField.type === "number" && targetField.type === "string");
        } else {
          rule.validated = false;
        }
      });
    },

    // 设置拖拽状态
    setDragState: (state, action: PayloadAction<Partial<DragState>>) => {
      state.dragState = { ...state.dragState, ...action.payload };
    },

    // 开始拖拽
    startDrag: (state, action: PayloadAction<FieldInfo>) => {
      state.dragState = {
        isDragging: true,
        draggedField: action.payload,
      };
    },

    // 结束拖拽
    endDrag: (state) => {
      state.dragState = {
        isDragging: false,
        draggedField: undefined,
        dropTarget: undefined,
      };
    },

    // 设置拖拽目标
    setDropTarget: (state, action: PayloadAction<string | undefined>) => {
      state.dragState.dropTarget = action.payload;
    },

    // 设置映射规则（用于从保存的配置中加载）
    setMappingRules: (state, action: PayloadAction<MappingRule[]>) => {
      state.rules = action.payload;
    },
  },
});

export const {
  addMapping,
  removeMapping,
  updateMapping,
  addMappings,
  clearMappings,
  resetMappings,
  autoMapping,
  validateMapping,
  validateAllMappings,
  setDragState,
  startDrag,
  endDrag,
  setDropTarget,
  setMappingRules,
} = mappingSlice.actions;

export default mappingSlice.reducer;
