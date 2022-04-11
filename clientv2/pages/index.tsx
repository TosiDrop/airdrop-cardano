import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.scss'
import useDualThemeClass from "../hooks/useDualThemeClass";

const APP = "App";
const APP_CONTAINER = "app-container";

const Home: NextPage = () => {
  const CONTAINER_CLASS = useDualThemeClass({ className: APP_CONTAINER });
  const APP_CLASS = useDualThemeClass({ className: APP });
  return (
    <div className={APP_CLASS}>
      <div className={CONTAINER_CLASS}>
        {/* <Navbar></Navbar>
        <AirdropTool></AirdropTool>
        <PopUp></PopUp> */}
      </div>
    </div>
  )
}

export default Home
