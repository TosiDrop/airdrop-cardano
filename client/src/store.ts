import { configureStore } from "@reduxjs/toolkit";
import globalReducer from "./reducers/globalSlice";

export default configureStore({
  reducer: {
    global: globalReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
