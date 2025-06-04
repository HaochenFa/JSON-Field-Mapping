import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  leftPanelView: "json" | "table" | "fields";
  selectedMapping?: string;
  sidebarCollapsed: boolean;
  loading: {
    connection: boolean;
    data: boolean;
    export: boolean;
  };
  modals: {
    configSave: boolean;
    configLoad: boolean;
    export: boolean;
    help: boolean;
  };
  notifications: Array<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
    duration?: number;
  }>;
}

const initialState: UiState = {
  leftPanelView: "json",
  sidebarCollapsed: false,
  loading: {
    connection: false,
    data: false,
    export: false,
  },
  modals: {
    configSave: false,
    configLoad: false,
    export: false,
    help: false,
  },
  notifications: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // 切换左侧面板视图
    setLeftPanelView: (state, action: PayloadAction<"json" | "table" | "fields">) => {
      state.leftPanelView = action.payload;
    },

    // 选择映射规则
    setSelectedMapping: (state, action: PayloadAction<string | undefined>) => {
      state.selectedMapping = action.payload;
    },

    // 切换侧边栏折叠状态
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    // 设置侧边栏状态
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },

    // 设置加载状态
    setLoading: (
      state,
      action: PayloadAction<{ key: keyof UiState["loading"]; value: boolean }>
    ) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },

    // 设置多个加载状态
    setLoadingStates: (state, action: PayloadAction<Partial<UiState["loading"]>>) => {
      state.loading = { ...state.loading, ...action.payload };
    },

    // 显示模态框
    showModal: (state, action: PayloadAction<keyof UiState["modals"]>) => {
      state.modals[action.payload] = true;
    },

    // 隐藏模态框
    hideModal: (state, action: PayloadAction<keyof UiState["modals"]>) => {
      state.modals[action.payload] = false;
    },

    // 隐藏所有模态框
    hideAllModals: (state) => {
      Object.keys(state.modals).forEach((key) => {
        state.modals[key as keyof UiState["modals"]] = false;
      });
    },

    // 添加通知
    addNotification: (state, action: PayloadAction<Omit<UiState["notifications"][0], "id">>) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      };
      state.notifications.push(notification);
    },

    // 移除通知
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },

    // 清空所有通知
    clearNotifications: (state) => {
      state.notifications = [];
    },

    // 显示成功通知
    showSuccessNotification: (state, action: PayloadAction<{ title: string; message: string }>) => {
      const notification = {
        ...action.payload,
        type: "success" as const,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        duration: 3000,
      };
      state.notifications.push(notification);
    },

    // 显示错误通知
    showErrorNotification: (state, action: PayloadAction<{ title: string; message: string }>) => {
      const notification = {
        ...action.payload,
        type: "error" as const,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        duration: 5000,
      };
      state.notifications.push(notification);
    },

    // 显示警告通知
    showWarningNotification: (state, action: PayloadAction<{ title: string; message: string }>) => {
      const notification = {
        ...action.payload,
        type: "warning" as const,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        duration: 4000,
      };
      state.notifications.push(notification);
    },

    // 显示信息通知
    showInfoNotification: (state, action: PayloadAction<{ title: string; message: string }>) => {
      const notification = {
        ...action.payload,
        type: "info" as const,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        duration: 3000,
      };
      state.notifications.push(notification);
    },
  },
});

export const {
  setLeftPanelView,
  setSelectedMapping,
  toggleSidebar,
  setSidebarCollapsed,
  setLoading,
  setLoadingStates,
  showModal,
  hideModal,
  hideAllModals,
  addNotification,
  removeNotification,
  clearNotifications,
  showSuccessNotification,
  showErrorNotification,
  showWarningNotification,
  showInfoNotification,
} = uiSlice.actions;

export default uiSlice.reducer;
