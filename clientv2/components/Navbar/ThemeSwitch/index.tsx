import { useDispatch, useSelector, RootStateOrAny } from "react-redux";
import { Switch } from "@arco-design/web-react";
import { IconSun, IconMoon } from "@arco-design/web-react/icon";
import useDualThemeClass from "hooks/useDualThemeClass";
import { setDarkTheme } from "reducers/globalSlice";

const COMPONENT_CLASS = "theme-switch";

export default function ThemeSwitch() {
  const darkMode = useSelector(
    (state: RootStateOrAny) => state.global.darkTheme
  );
  const dispatch = useDispatch();
  const CLASS = useDualThemeClass({
    className: COMPONENT_CLASS,
  });

  return (
    <div className={CLASS}>
      <IconSun></IconSun>
      <Switch
        onChange={(v) => {
          dispatch(setDarkTheme(v));
        }}
        checked={darkMode}
        className={`${COMPONENT_CLASS}__switch`}
      />
      <IconMoon></IconMoon>
    </div>
  );
}
