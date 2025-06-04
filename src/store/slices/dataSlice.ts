import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { FieldInfo, PaginationInfo } from "../../types";
import { apiService } from "../../services/apiService";
import { parseJsonFields } from "../../utils/fieldParser";

interface DataState {
  source: any[];
  sourceFields: FieldInfo[];
  targetFields: FieldInfo[];
  loading: boolean;
  pagination?: PaginationInfo;
  error?: string;
}

const initialState: DataState = {
  source: [],
  sourceFields: [],
  targetFields: [],
  loading: false,
};

// 异步thunk：获取源数据
export const fetchSourceData = createAsyncThunk(
  "data/fetchSourceData",
  async (params: { page?: number; pageSize?: number }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const config = state.connection.config;

      const response = await apiService.fetchData(config, params);

      // 解析字段结构
      const fields = parseJsonFields(response.data.records || response.data);

      return {
        records: response.data.records || response.data,
        fields,
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "获取数据失败");
    }
  }
);

// 异步thunk：获取所有分页数据
export const fetchAllPages = createAsyncThunk(
  "data/fetchAllPages",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const config = state.connection.config;

      let allRecords: any[] = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await apiService.fetchData(config, {
          page: currentPage,
          pageSize: 100,
        });

        const records = response.data.records || response.data;
        allRecords = [...allRecords, ...records];

        const pagination = response.data.pagination;
        hasMore = pagination?.hasNext || false;
        currentPage++;

        // 避免无限循环
        if (currentPage > 1000) {
          throw new Error("数据页数过多，请检查分页逻辑");
        }
      }

      // 解析字段结构
      const fields = parseJsonFields(allRecords);

      return {
        records: allRecords,
        fields,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "获取全部数据失败");
    }
  }
);

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    setTargetFields: (state, action: PayloadAction<FieldInfo[]>) => {
      state.targetFields = action.payload;
    },
    addTargetField: (state, action: PayloadAction<FieldInfo>) => {
      state.targetFields.push(action.payload);
    },
    removeTargetField: (state, action: PayloadAction<string>) => {
      state.targetFields = state.targetFields.filter((field) => field.name !== action.payload);
    },
    updateTargetField: (
      state,
      action: PayloadAction<{ name: string; field: Partial<FieldInfo> }>
    ) => {
      const index = state.targetFields.findIndex((field) => field.name === action.payload.name);
      if (index !== -1) {
        state.targetFields[index] = { ...state.targetFields[index], ...action.payload.field };
      }
    },
    clearData: (state) => {
      state.source = [];
      state.sourceFields = [];
      state.pagination = undefined;
      state.error = undefined;
    },
    clearError: (state) => {
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取源数据
      .addCase(fetchSourceData.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchSourceData.fulfilled, (state, action) => {
        state.loading = false;
        state.source = action.payload.records;
        state.sourceFields = action.payload.fields;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSourceData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 获取所有分页数据
      .addCase(fetchAllPages.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchAllPages.fulfilled, (state, action) => {
        state.loading = false;
        state.source = action.payload.records;
        state.sourceFields = action.payload.fields;
        state.pagination = undefined; // 清除分页信息，表示已获取全部数据
      })
      .addCase(fetchAllPages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setTargetFields,
  addTargetField,
  removeTargetField,
  updateTargetField,
  clearData,
  clearError,
} = dataSlice.actions;

export default dataSlice.reducer;
