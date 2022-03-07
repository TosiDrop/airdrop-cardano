import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Token, GlobalState, AddressAmount } from "utils";

const initialState: GlobalState = {
  darkTheme: false,
  tokenArray: [],
  selectedToken: {
    name: "",
    amount: 0,
  },
  addressArray: [],
  totalAmountToAirdrop: 0,
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
      state.selectedToken.name = payload.name;
      state.selectedToken.amount = payload.amount;
    },
    updateAddressArray: (
      state,
      { payload }: PayloadAction<AddressAmount[]>
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
} = globalSlice.actions;

export default globalSlice.reducer;
