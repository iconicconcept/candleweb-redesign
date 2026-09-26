import React, { useEffect, useState } from "react";
import { Header } from "ui";
import Logo from "../public/logo.png";
import { CgMenuRight } from "react-icons/cg";
import Image from "next/image";
import Head from "next/head";
import { useRouter } from "next/router";
import { GoogleAnalytics } from "@next/third-parties/google";

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  const router = useRouter();
  const path = router.pathname.split("/")[1];

  // Pages on the shared public chrome (PublicHeader/Footer) or the self-contained
  // auth chrome — they get the light/dark site theme and a matching light
  // surround behind the content.
  const isPublicChrome = [
    "",
    "about",
    "blog",
    "tutor",
    "candleai",
    "docs",
    "terms",
    "privacy",
    "login",
    "register",
  ].includes(path);
  const isDashboard = path === "dashboard";

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
      <div
        className="main__body relative overflow-hidden min-h-screen !max-w-[100vw]"
        data-chrome={isPublicChrome ? "public" : isDashboard ? "dashboard" : undefined}
      >
        {/* {(!path.includes("dashboard") && !path.includes("register") && !path.includes("tutor")) && ( */}
        {path !== "" &&
          path !== "about" &&
          !path.includes("dashboard") &&
          !path.includes("register") &&
          !path.includes("tutor") &&
          !path.includes("blog") &&
          !path.includes("candleai") &&
          !path.includes("privacy") &&
          !path.includes("terms") &&
          !path.includes("login") &&
          !path.includes("docs") && (
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
      </div>
      {/* {isFooter && <Footer />} */}
    </>
  );
};

export default Layout;
