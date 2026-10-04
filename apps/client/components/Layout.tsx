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
    "pricing",
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
        /* No `overflow-hidden` here: that utility beat the `.main__body
           { overflow: clip }` rule in globals.css (same specificity, later in
           the bundle), which made this a scroll container and stopped the
           sticky PublicHeader from sticking to the viewport. `clip` still
           guards horizontal overflow without creating a scrollport. */
        className="main__body relative min-h-screen !max-w-[100vw]"
        data-chrome={isPublicChrome ? "public" : isDashboard ? "dashboard" : undefined}
      >
        {/* The legacy header is only for pages that haven't been redesigned
            yet. This used to repeat the isPublicChrome list as a chain of
            !path.includes(...) checks, so a page added to one list and not
            the other rendered BOTH headers. */}
        {!isPublicChrome && !isDashboard && (
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
