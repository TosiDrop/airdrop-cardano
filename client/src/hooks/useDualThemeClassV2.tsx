import { useSelector, RootStateOrAny } from "react-redux";

interface Props {
  className: string;
}

export default function useDualThemeClassV2({ className }: Props) {
  const darkTheme = useSelector(
    (state: RootStateOrAny) => state.global.darkTheme
  );
  const MAIN_CLASS = className;
  const ADD_CLASS = MAIN_CLASS + (darkTheme ? "-dark" : "-light");
  const CLASS = `${MAIN_CLASS} ${ADD_CLASS}`;
  return CLASS;
}
