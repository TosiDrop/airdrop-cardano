import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Token, GlobalState, AddressAmount, defaultToken } from "utils";

const initialState: GlobalState = {
  api: undefined,
  walletAddress: "",
  darkTheme: false,
  tokenArray: [],
  selectedToken: defaultToken,
  addressArray: [],
  totalAmountToAirdrop: 0,
  loadingApi: false,
  addressContainingAda: [],
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.darkTheme = !state.darkTheme;
    },
    setTokenArray: (state, { payload }: PayloadAction<Token[]>) => {
      state.tokenArray = payload;
    },
    setSelectedToken: (state, { payload }: PayloadAction<Token>) => {
      state.selectedToken = { ...payload };
    },
    resetSelectedToken: (state) => {
      state.selectedToken = defaultToken;
    },
    setLoadingApi: (state, { payload }: PayloadAction<boolean>) => {
      state.loadingApi = payload;
    },
    setAddressContainingAda: (
      state,
      { payload }: PayloadAction<AddressAmount[]>
    ) => {
      state.addressContainingAda = payload;
    },
    setAddressArray: (state, { payload }: PayloadAction<AddressAmount[]>) => {
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
  resetSelectedToken,
  setTokenArray,
  setSelectedToken,
  setAddressArray,
  setLoadingApi,
  setApi,
  setWalletAddress,
  setAddressContainingAda,
} = globalSlice.actions;

export default globalSlice.reducer;
