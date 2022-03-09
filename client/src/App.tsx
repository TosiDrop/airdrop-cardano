import "App.scss";
import useBackgroundImage from "hooks/useBackgroundImage";
import Navbar from "components/Navbar";
import AirdropTool from "components/AirdropTool";
import useDualThemeClass from "hooks/useDualThemeClass";
import { useEffect, useState } from "react";
import { useDispatch, useSelector, RootStateOrAny } from "react-redux";
import { updateLoadingApi, updateSelectedToken, updateTokenArray } from "reducers/globalSlice";
import { setWalletAddress } from "reducers/blockchainSlice";
import { Address } from "@emurgo/cardano-serialization-lib-asmjs";
import { Buffer } from "buffer";
import useWallet from "hooks/useWallet";

function App() {
  const [loading, setLoading] = useState(false)
  const CONTAINER_CLASS = useDualThemeClass({ main: "container", el: "" })[0];
  const api = useSelector((state: RootStateOrAny) => state.blockchain.api);
  const dispatch = useDispatch();
  const { getWalletSummary, enableWallet } = useWallet();

  useEffect(() => {
    setTimeout(() => {
      const selectedWallet = localStorage.getItem("wallet");
      if (selectedWallet) {
        enableWallet(selectedWallet);
      }
    }, 500);
  }, []);

  useEffect(() => {
    /**
     * check if wallet is connected
     * and api is working
     */
    (async function () {
      if (api == null) return;
      let address = await api.getChangeAddress();

      /**
       * if api changes, set walletSummary to []
       * so that it is locked until the new one syncs
       */
      dispatch(updateTokenArray([]));
      dispatch(updateLoadingApi(true))

      try {
        address = Address.from_bytes(Buffer.from(address, "hex")).to_bech32();
        if (address) {
          dispatch(setWalletAddress(address));
        }
      } catch (err) {
        console.log(err);
      }
      const walletSummary = await getWalletSummary(api);
      walletSummary.sort((a, b) => (a.name < b.name ? -1 : 1))

      dispatch(updateSelectedToken({
        name: "",
        amount: 0,
        decimals: 0,
      }));
      dispatch(updateTokenArray(walletSummary));
      dispatch(updateLoadingApi(false))
    })();
  }, [api]);

  return (
    <div className="App" style={useBackgroundImage()}>
      <div className={CONTAINER_CLASS}>
        <Navbar></Navbar>
        {
          loading ? 'Loading assets...' : null
        }
        <AirdropTool></AirdropTool>
      </div>
    </div>
  );
}

export default App;
