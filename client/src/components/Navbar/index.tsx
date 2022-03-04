import { Button, Popover } from "@arco-design/web-react";
import ThemeSwitch from "components/Navbar/ThemeSwitch";
import useDualThemeClass from "hooks/useDualThemeClass";
import useWallet from "hooks/useWallet";
import { useEffect, useState } from "react";
import { RootStateOrAny, useSelector } from "react-redux";
import { WalletName } from "utils";
import Logo from "assets/logo.png"
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
    (state: RootStateOrAny) => state.blockchain.walletAddress
  );

  useEffect(() => {
    if (walletAddress) {
      setBtnText(`addr1...${walletAddress.slice(walletAddress.length - 8)}`);
    }
  }, [walletAddress]);

  const selectWalletBtns = () => {
    return (
      <div className={`${CONTAINER_CLASS}__select-wallet`}>
        <Button onClick={() => enableWallet(WalletName.NAMI)}>Nami</Button>
        <Button onClick={() => enableWallet(WalletName.CCVAULT)}>
          CCVault
        </Button>
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
        <Button className={EL_CLASS}>{btnText}</Button>
      </Popover>
      <img className={`${CONTAINER_CLASS}__logo`} src={Logo}></img>
    </div>
  );
}
