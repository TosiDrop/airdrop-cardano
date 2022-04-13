import ToolSelector from "./ToolSelector";
import style from "./Navbar.module.scss";

const Navbar = () => {
  return (
    <div className={style.Navbar}>
      <div className={`${style.logo}`}>
        <img src="/logo.png"></img>
        Tosidrop
      </div>
      <ToolSelector />
    </div>
  );
};

export default Navbar;
