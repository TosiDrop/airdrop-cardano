import { Switch } from "@arco-design/web-react";
import { IconSun, IconMoon } from "@arco-design/web-react/icon";
import { useDispatch } from "react-redux";
import { toggleTheme } from "reducers/globalSlice";
import useDualThemeClass from "hooks/useDualThemeClass";
import "./index.scss";

export default function ThemeSwitch() {
  const dispatch = useDispatch();
  const [CLASS, EL_CLASS] = useDualThemeClass({
    main: "theme-switch",
    el: "switch",
  });

  return (
    <div className={CLASS}>
      <IconSun></IconSun>
      <Switch
        onChange={() => {
          dispatch(toggleTheme());
        }}
        className={EL_CLASS}
      />
      <IconMoon></IconMoon>
    </div>
  );
}
