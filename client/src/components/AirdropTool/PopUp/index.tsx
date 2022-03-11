import useDualThemeClass from "hooks/useDualThemeClass";
import Logo from "assets/logo.png";
import { PopUpType, PopUpProps } from "utils";
import "./index.scss";
import { Button } from "@arco-design/web-react";

const CONTAINER_CLASS = "popup";

export default function PopUp({ show, type, text, closePopUp }: PopUpProps) {
  const [CLASS, EL_CLASS] = useDualThemeClass({
    main: CONTAINER_CLASS,
    el: "btn",
  });

  const getLogoClass = () => {
    let logoClass = `${CONTAINER_CLASS}__logo`;
    if (show) {
      logoClass += ` ${CONTAINER_CLASS}__logo-loading`;
    }
    return logoClass;
  };

  return show ? (
    <div className={`${CONTAINER_CLASS}-container`}>
      <div className={CLASS}>
        <h1>{text}</h1>
        {type === PopUpType.LOADING ? (
          <img src={Logo} className={getLogoClass()}></img>
        ) : null}
        <Button onClick={() => closePopUp()} className={EL_CLASS}>
          Close
        </Button>
      </div>
    </div>
  ) : null;
}
