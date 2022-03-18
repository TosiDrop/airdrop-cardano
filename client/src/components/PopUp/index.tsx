import useDualThemeClass from "hooks/useDualThemeClass";
import Logo from "assets/logo.png";
import { PopUpType, PopUpProps } from "utils";
import "./index.scss";
import { Button } from "@arco-design/web-react";
import { IconCheckCircle, IconCloseCircle } from "@arco-design/web-react/icon";
import { closePopUp } from "reducers/globalSlice";
import { useDispatch, useSelector, RootStateOrAny } from "react-redux";
import { useEffect } from "react";

const CONTAINER_CLASS = "popup";

export default function PopUp() {
  const dispatch = useDispatch();
  const { popUp } = useSelector((state: RootStateOrAny) => state.global);
  const { show, text, type } = popUp;

  const [CLASS, EL_CLASS] = useDualThemeClass({
    main: CONTAINER_CLASS,
    el: "btn",
  });

  const getLogoClass = () => {
    let logoClass = `${CONTAINER_CLASS}__symbol`;
    if (show) {
      logoClass += ` ${CONTAINER_CLASS}__symbol-loading`;
    }
    return logoClass;
  };

  const getSymbol = (type: PopUpType) => {
    switch (type) {
      case PopUpType.LOADING:
        return <img src={Logo} className={getLogoClass()}></img>;
      case PopUpType.FAIL:
        return (
          <IconCloseCircle
            className={`${CONTAINER_CLASS}__symbol ${CONTAINER_CLASS}__symbol-fail`}
          />
        );
      case PopUpType.SUCCESS:
        return (
          <IconCheckCircle
            className={`${CONTAINER_CLASS}__symbol ${CONTAINER_CLASS}__symbol-success`}
          />
        );
    }
  };

  return (
    <div
      className={`${getVisibilityClass(
        show,
        CONTAINER_CLASS + "-container"
      )} ${CONTAINER_CLASS}-container`}
    >
      <div className={`${CLASS} ${getVisibilityClass(show, CONTAINER_CLASS)}`}>
        <h2>{text}</h2>
        {getSymbol(type)}
        <Button onClick={() => dispatch(closePopUp())} className={EL_CLASS}>
          Close
        </Button>
      </div>
    </div>
  );
}

function getVisibilityClass(show: boolean, classname: string) {
  console.log(show);
  if (show) {
    return `${classname}-show`;
  } else {
    return `${classname}-hide`;
  }
}
