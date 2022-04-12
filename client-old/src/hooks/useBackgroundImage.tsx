import { useSelector, RootStateOrAny } from "react-redux";

export default function useBackgroundImage() {
  const darkTheme = useSelector(
    (state: RootStateOrAny) => state.global.darkTheme
  );
  const bg = darkTheme ? "dark-bg.jpg" : "light-bg.jpg";

  return {
    backgroundImage: `url(${process.env.PUBLIC_URL + "/" + bg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}
