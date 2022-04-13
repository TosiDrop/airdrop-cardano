import type { NextPage } from "next";
import styles from "./Airdrop.module.scss";
import Navbar from "components/Navbar"

const Airdrop: NextPage = () => {
  return (
    <div className={styles.Airdrop}>
      <Navbar/>
    </div>
  );
};

export default Airdrop;
