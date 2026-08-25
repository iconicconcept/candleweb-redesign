import React, { useEffect, useState } from "react";
import { Header } from "ui";
import Logo from "../public/logo.png";
import { CgMenuRight } from "react-icons/cg";
import Image from "next/image";
import Head from "next/head";
import { useRouter } from "next/router";
import { GoogleAnalytics } from '@next/third-parties/google'

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  const router = useRouter();
  const path = router.pathname.split("/")[1];


  return (
    <>

      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#27ecb0" />
        <meta name="msapplication-TileColor" content="#27ecb0" />
        <meta name="application-name" content="Candleweb" />
        <meta name="theme-color" content="#ffffff"></meta>
      </Head>
      <GoogleAnalytics gaId="G-Z3EMQKEN56" />
      <div className="main__body relative overflow-hidden min-h-screen pb-10 !max-w-[100vw]">
        {/* {(!path.includes("dashboard") && !path.includes("register") && !path.includes("tutor")) && ( */}
        {path !== "" && (!path.includes("dashboard") && !path.includes("register") && !path.includes("tutor")) && (
          <Header
            route={path}
            Icon={CgMenuRight}
            Logo={
              <Image
                src={Logo}
                alt="Home Logo"
                className="max-w-[150px] md:max-w-[170px]"
              />
            }
          />
        )}
        {children}
        <div className={`bottom__border absolute bottom-0 left-0 right-0 bg-bottom-border w-full h-[31px] ${path.includes("dashboard") ? "ai:!hidden" : ""}`}></div>
      </div>
      {/* {isFooter && <Footer />} */}

    </>
  );
};

export default Layout;
