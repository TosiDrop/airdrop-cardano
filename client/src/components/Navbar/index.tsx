import { useEffect, useState } from "react";
import { RootStateOrAny, useSelector } from "react-redux";
import ThemeSwitch from "components/Navbar/ThemeSwitch";
import { Button, Popover } from "@arco-design/web-react";
import useDualThemeClass from "hooks/useDualThemeClass";
import useWallet from "hooks/useWallet";
import { supportedWallets, shortenAddress } from "utils";
import Logo from "assets/logo.png";
import "./index.scss";

const CONTAINER_CLASS = "navbar";

export default function Navbar() {
  const [CLASS, EL_CLASS] = useDualThemeClass({
    main: CONTAINER_CLASS,
    el: "button",
  });
  const { enableWallet } = useWallet();
  const [btnText, setBtnText] = useState("Connect wallet");
  const walletAddress = useSelector(
    (state: RootStateOrAny) => state.global.walletAddress
  );
  const loadingApi = useSelector(
    (state: RootStateOrAny) => state.global.loadingApi
  );

  useEffect(() => {
    if (walletAddress) {
      setBtnText(shortenAddress(walletAddress));
    }
  }, [walletAddress]);

  const selectWalletBtns = () => {
    return (
      <div className={`${CONTAINER_CLASS}__select-wallet`}>
        {supportedWallets.map((wallet) => {
          return (
            <Button key={wallet.name} onClick={() => enableWallet(wallet.name)}>
              {wallet.displayName}
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <div className={CLASS}>
      <ThemeSwitch></ThemeSwitch>
      <Popover
        trigger="hover"
        position="bottom"
        title="Select Wallet"
        content={selectWalletBtns()}
      >
        <Button className={EL_CLASS}>
          {btnText}
          {loadingApi ? <div className="lds-dual-ring"></div> : null}
        </Button>
      </Popover>
      <img className={`${CONTAINER_CLASS}__logo`} src={Logo} alt="logo"></img>
    </div>
  );
}
