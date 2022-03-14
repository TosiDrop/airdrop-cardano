import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Token, GlobalState, AddressAmountMap, defaultToken } from "utils";

const initialState: GlobalState = {
  darkTheme: false,
  tokenArray: [],
  selectedToken: defaultToken,
  addressArray: [],
  totalAmountToAirdrop: 0,
  loadingApi: false,
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.darkTheme = !state.darkTheme;
    },
    updateTokenArray: (state, { payload }: PayloadAction<Token[]>) => {
      state.tokenArray = payload;
    },
    updateSelectedToken: (state, { payload }: PayloadAction<Token>) => {
      state.selectedToken = { ...payload };
    },
    resetSelectedToken: (state) => {
      state.selectedToken = defaultToken;
    },
    updateLoadingApi: (state, { payload }: PayloadAction<boolean>) => {
      state.loadingApi = payload;
    },
    updateAddressArray: (
      state,
      { payload }: PayloadAction<AddressAmountMap[]>
    ) => {
      state.addressArray = payload;
      state.totalAmountToAirdrop = payload.reduce(
        (sum, item) => (sum += item.amount),
        0
      );
    },
  },
});

export const {
  toggleTheme,
  updateTokenArray,
  updateSelectedToken,
  updateAddressArray,
  updateLoadingApi,
  resetSelectedToken,
} = globalSlice.actions;

export default globalSlice.reducer;
