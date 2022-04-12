import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import styles from "styles/Home.module.scss";
import { useEffect, useLayoutEffect } from "react";
import { useDispatch, useSelector, RootStateOrAny } from "react-redux";
import Navbar from "components/Navbar";
import AirdropTool from "components/AirdropTool";
import PopUp from "components/PopUp";
import useWallet from "hooks/useWallet";
import {
  resetSelectedToken,
  setDarkTheme,
  setLoadingApi,
  setTokenArray,
} from "reducers/globalSlice";
import { setWalletAddress, setPopUp } from "reducers/globalSlice";
import { Address } from "@emurgo/cardano-serialization-lib-asmjs";
import { Buffer } from "buffer";
import usePopUp from "hooks/usePopUp";
import useDualThemeClass from "hooks/useDualThemeClass";
import axios from 'axios'

const APP = "App";
const APP_CONTAINER = "app-container";

const Home: NextPage = () => {
  const dispatch = useDispatch();
  const api = useSelector((state: RootStateOrAny) => state.global.api);
  const CONTAINER_CLASS = useDualThemeClass({ className: APP_CONTAINER });
  const APP_CLASS = useDualThemeClass({ className: APP });
  const { setPopUpError } = usePopUp();
  const { getTokenArrayInWallet, enableWallet } = useWallet();

  useLayoutEffect(() => {
    /**
     * Use setInterval so we can retry if wallet
     * does not want to connect
     */
    const enableWalletInterval = setInterval(() => {
      try {
        const selectedWallet = localStorage.getItem("wallet");
        if (selectedWallet) {
          enableWallet(selectedWallet);
        }
        console.log("[Tosidrop] wallet connected");
        clearInterval(enableWalletInterval);
      } catch (e) {
        console.log("[Tosidrop] wallet not ready");
      }
    }, 100);
    const darkMode = localStorage.getItem("darkMode");
    if (darkMode === "true") {
      dispatch(setDarkTheme(true));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    axios.get('/api/hello')
      .then(res => console.log(res.data.name))
  }, [])

  useEffect(() => {
    /**
     * check if wallet is connected
     * and api is working
     */
    (async function () {
      if (api == null) return;
      let address = (await api.getUsedAddresses())[0];

      /**
       * if api changes, set tokenArrayInWallet to []
       * so that it is locked until the new one syncs
       */
      dispatch(resetSelectedToken());
      dispatch(setTokenArray([]));
      dispatch(setLoadingApi(true));

      try {
        address = Address.from_bytes(Buffer.from(address, "hex")).to_bech32();
        if (address) {
          dispatch(setWalletAddress(address));
        }
      } catch (err: any) {
        setPopUpError(err.message);
      }

      await getTokenArrayInWallet(api);
      dispatch(setLoadingApi(false));
    })();
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Head>
        <title>Tosidrop</title>
      </Head>
      <div className={APP_CLASS}>
        <div className={CONTAINER_CLASS}>
          <Navbar></Navbar>
        <AirdropTool></AirdropTool>
        <PopUp></PopUp>
        </div>
      </div>
    </>
  );
};

export default Home;
