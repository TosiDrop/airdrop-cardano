import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Token, GlobalState, AddressAmountMap, defaultToken } from "utils";

const initialState: GlobalState = {
  api: undefined,
  walletAddress: "",
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
    setApi: (state, { payload }: PayloadAction<Object | undefined>) => {
      state.api = payload;
    },
    setWalletAddress: (state, { payload }: PayloadAction<string>) => {
      state.walletAddress = payload;
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
  setApi, 
  setWalletAddress,
} = globalSlice.actions;

export default globalSlice.reducer;
