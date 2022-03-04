import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import globalReducer from "./reducers/globalSlice";
import blockchainReducer from "./reducers/blockchainSlice";

export default configureStore({
  reducer: {
    global: globalReducer,
    blockchain: blockchainReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
