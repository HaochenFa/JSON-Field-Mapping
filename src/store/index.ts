import { configureStore } from "@reduxjs/toolkit";
import connectionReducer from "./slices/connectionSlice";
import dataReducer from "./slices/dataSlice";
import mappingReducer from "./slices/mappingSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    connection: connectionReducer,
    data: dataReducer,
    mapping: mappingReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
