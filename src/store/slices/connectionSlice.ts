import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { DatabaseConfig } from "../../types";
import { apiService } from "../../services/apiService";

interface ConnectionState {
  status: "idle" | "connecting" | "connected" | "error";
  config: DatabaseConfig;
  error?: string;
}

const initialState: ConnectionState = {
  status: "idle",
  config: {
    type: "api", // 默认为 API 类型
    url: "",
    apiKey: "",
    tableName: "",
  },
};

// 异步thunk：测试数据库连接
export const testConnection = createAsyncThunk(
  "connection/testConnection",
  async (config: DatabaseConfig, { rejectWithValue }) => {
    try {
      const response = await apiService.testConnection(config);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "连接失败");
    }
  }
);

// 异步thunk：连接数据库
export const connectDatabase = createAsyncThunk(
  "connection/connectDatabase",
  async (config: DatabaseConfig, { rejectWithValue }) => {
    try {
      const response = await apiService.connect(config);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "连接失败");
    }
  }
);

const connectionSlice = createSlice({
  name: "connection",
  initialState,
  reducers: {
    updateConfig: (state, action: PayloadAction<Partial<DatabaseConfig>>) => {
      state.config = { ...state.config, ...action.payload };
    },
    resetConnection: (state) => {
      state.status = "idle";
      state.error = undefined;
    },
    clearError: (state) => {
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      // 测试连接
      .addCase(testConnection.pending, (state) => {
        state.status = "connecting";
        state.error = undefined;
      })
      .addCase(testConnection.fulfilled, (state) => {
        state.status = "connected";
      })
      .addCase(testConnection.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload as string;
      })
      // 连接数据库
      .addCase(connectDatabase.pending, (state) => {
        state.status = "connecting";
        state.error = undefined;
      })
      .addCase(connectDatabase.fulfilled, (state) => {
        state.status = "connected";
      })
      .addCase(connectDatabase.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload as string;
      });
  },
});

export const { updateConfig, resetConnection, clearError } = connectionSlice.actions;
export default connectionSlice.reducer;
