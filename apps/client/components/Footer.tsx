import { FaTelegram } from "react-icons/fa";
import { RiInstagramFill } from "react-icons/ri";
import { AiFillLinkedin, AiFillTwitterCircle } from "react-icons/ai";
import { SiGmail } from "react-icons/si";
import Image from "next/image";
import Logo from "../public/logo.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Heading,
  Typography,
} from "ui";

import Link from "next/link";
import useEthereum from "../lib/hooks/useEthereum";
import { loginUser } from "../utils/loginUser";
import useUserStore from "../lib/hooks/useUserStore";
import { useRouter } from "next/router";
import { useState } from "react";

type IFooterProps = {};

const Footer = (props: IFooterProps) => {
  const { connectWallet } = useEthereum();
  const router = useRouter()
  const { setUser } = useUserStore((state: any) => state);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  return (
    <>
      <div className="footer__section hidden md:flex sm:flex-col items-start py-10 mt-[151px] max-w-[1065px] m-auto sm:mx-9 lg:mx-7">
        <div className="footer__left--details md:flex-1">
          <div className="footer__logo mb-4">
            <Link href="/">
              <Image
                src={Logo}
                alt="Candleweb Logo"
                className="max-w-[150px] md:max-w-[180px]"
              />
            </Link>
          </div>
          <div className="footer__socials flex items-center gap-2">
            <Link href="https://www.linkedin.com/company/candleweb-services/" target="_blank" rel="noopener noreferrer">
              <AiFillLinkedin className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient transition duration-700 hover:text-primary" />
            </Link>
            <Link href="https://twitter.com/Candleweb_AI?t=3swlPh95OFEqwxeL8SX3Yg&s=09" target="_blank" rel="noopener noreferrer">
              {/* <FaXTwitter className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient transition duration-700 hover:text-primary" /> */}
              <svg className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient transition duration-700 hover:text-primary" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0,0,256,256" width="50px" height="50px"><g fill="#ffffff" fillRule="nonzero" stroke="none" strokeWidth="1" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10" strokeDasharray="" strokeDashoffset="0" fontFamily="none" fontWeight="none" fontSize="none" style={{ mixBlendMode: "normal" }}><g transform="scale(5.12,5.12)"><path d="M11,4c-3.866,0 -7,3.134 -7,7v28c0,3.866 3.134,7 7,7h28c3.866,0 7,-3.134 7,-7v-28c0,-3.866 -3.134,-7 -7,-7zM13.08594,13h7.9375l5.63672,8.00977l6.83984,-8.00977h2.5l-8.21094,9.61328l10.125,14.38672h-7.93555l-6.54102,-9.29297l-7.9375,9.29297h-2.5l9.30859,-10.89648zM16.91406,15l14.10742,20h3.06445l-14.10742,-20z"></path></g></g></svg>
            </Link>
            <Link href="https://t.me/candleweb" target="_blank" rel="noopener noreferrer">
              <FaTelegram className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient transition duration-700 hover:text-primary" />
            </Link>
            <Link href="https://instagram.com/candleweb_ai?igshid=OGQ5ZDc2ODk2ZA==">
              <RiInstagramFill className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient transition duration-700 hover:text-primary" />
            </Link>
            <Link href="https://medium.com/@candleweb">
              <SiGmail className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient transition duration-700 hover:text-primary" />
            </Link>
          </div>
        </div>
        <div className="footer__right--details flex sm:flex-col items-start sm:gap-10 sm:mt-10 md:gap-20">
          <div className="footer__products ">
            <Heading textsize="sm" boldness="semibold" classstyle="inter mb-2">
              Products
            </Heading>
            <ul className="footer__product--items">
              <Link href="/#candle">
                <li className="footer__product--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                  CandleAI
                </li>
              </Link>
              {/* <Link href="/candle">
                <li className="footer__product--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                  Candle Token
                </li>
              </Link> */}
            </ul>
          </div>
          <div className="footer__resources ">
            <Heading textsize="sm" boldness="semibold" classstyle="inter mb-2">
              Resources
            </Heading>
            <ul className="footer__resource--items">
              <Link href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer">
                <li className="footer__resource--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                  WhitePaper
                </li>
              </Link>
              <Link href="/#">
                <li className="footer__resource--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                  Pitch Deck
                </li>
              </Link>
              <Link href="/#">
                <li className="footer__resource--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                  Media Designs
                </li>
              </Link>
              <Link href="https://medium.com/@candleweb/list/1e42f8710067" target="_blank" rel="noopener noreferrer">
                <li className="footer__resource--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                  Tutorials
                </li>
              </Link>
              <Link href="/blog" target="_blank" rel="noopener noreferrer">
                <li className="footer__resource--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                  Blog
                </li>
              </Link>
            </ul>
          </div>
          <div className="footer__company ">
            <Heading textsize="sm" boldness="semibold" classstyle="inter mb-2">
              Company
            </Heading>
            <ul className="footer__company--items">
              <Link href="/tutor">
                <li className="footer__company--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                  Academy
                </li>
              </Link>
              {/* <Link href="/about">
                <li className="footer__company--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                  About us
                </li>
              </Link> */}

              <li className="footer__company--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3" onClick={() => {

                connectWallet().then((res) => {
                  if (res?.walletAddress) {
                    loginUser({
                      wallet: res.walletAddress, signerPassword: res.signMessage, setIsLoading, onSuccess: (value, type) => {
                        if (type === "success") {
                          setUser(value)
                          router.push("/dashboard")
                        } else {
                          router.push("/register")
                        }
                      }
                    });
                  }
                })
              }}>
                Connect Wallet
              </li>

              <Link href="/register">
                <li className="footer__company--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                  Create account
                </li>
              </Link>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer__mobile sm:block hidden sm:mt-[151px] sm:mx-9 lg:mx-7">
        <div className="footer__top--details flex flex-col items-center">
          <div className="footer__logo mb-4">
            <Link href="/">
              <Image
                src={Logo}
                alt="Candleweb Logo"
                className="max-w-[150px] md:max-w-[180px]"
              />
            </Link>
          </div>
          <div className="footer__socials flex items-center gap-2">
            <Link href="https://www.linkedin.com/company/candleweb-services/" target="_blank" rel="noopener noreferrer">
              <AiFillLinkedin className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient" />
            </Link>
            <Link href="https://twitter.com/Candleweb_AI?t=3swlPh95OFEqwxeL8SX3Yg&s=09" target="_blank" rel="noopener noreferrer">
              <AiFillTwitterCircle className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient" />
            </Link>
            <Link href="https://t.me/candleweb" target="_blank" rel="noopener noreferrer">
              <FaTelegram className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient" />
            </Link>
            <Link href="https://instagram.com/candleweb_ai?igshid=OGQ5ZDc2ODk2ZA==">
              <RiInstagramFill className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient" />
            </Link>
            <Link href="https://medium.com/@candleweb">
              <SiGmail className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient" />
            </Link>
          </div>
        </div>
        <div className="footer__accordion">
          <Accordion type="multiple" classstyle="">
            {/* Product Accordion */}
            <AccordionItem value={`item-1`}>
              <AccordionTrigger>Products</AccordionTrigger>

              <AccordionContent>
                <ul className="footer__product--items">
                  <Link href="/#candle">
                    <li className="footer__product--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                      CandleAI
                    </li>
                  </Link>
                  <Link href="/candle">
                    <li className="footer__product--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                      Candle Token
                    </li>
                  </Link>
                </ul>
              </AccordionContent>
            </AccordionItem>
            {/* Resource Accordion */}
            <AccordionItem value={`item-2`}>
              <AccordionTrigger>Resources</AccordionTrigger>

              <AccordionContent>
                <ul className="footer__resource--items">
                  <Link href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer">
                    <li className="footer__resource--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                      WhitePaper
                    </li>
                  </Link>
                  <Link href="/#">
                    <li className="footer__resource--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                      Pitch Deck
                    </li>
                  </Link>
                  <Link href="/#">
                    <li className="footer__resource--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                      Media Designs
                    </li>
                  </Link>
                  <Link href="https://medium.com/@candleweb/list/1e42f8710067" target="_blank" rel="noopener noreferrer">
                    <li className="footer__resource--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                      Tutorials
                    </li>
                  </Link>
                  <Link href="/blog">
                    <li className="footer__resource--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                      Blog
                    </li>
                  </Link>
                </ul>
              </AccordionContent>
            </AccordionItem>
            {/* Company Accordion */}
            <AccordionItem value={`item-3`}>
              <AccordionTrigger>Company</AccordionTrigger>

              <AccordionContent>
                <ul className="footer__company--items">
                  <Link href="/tutor">
                    <li className="footer__company--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                      Academy
                    </li>
                  </Link>
                  <Link href="/about">
                    <li className="footer__company--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                      About us
                    </li>
                  </Link>

                  <li className="footer__company--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3" onClick={() => {
                    connectWallet().then((res) => {
                      if (res?.walletAddress) {
                        loginUser({
                          wallet: res.walletAddress, signerPassword: res.signMessage, setIsLoading, onSuccess: (value, type) => {
                            if (type === "success") {
                              setUser(value)
                              router.push("/dashboard")
                            } else {
                              router.push("/register")
                            }
                          }
                        });
                      }
                    })
                  }}>
                    Connect Wallet
                  </li>

                  <Link href="/register">
                    <li className="footer__company--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                      Create account
                    </li>
                  </Link>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value={`item-4`}>
              <AccordionTrigger>Legal</AccordionTrigger>

              <AccordionContent>
                <ul className="footer__company--items">
                  <Link href="/terms" target="_blank" rel="noopener noreferrer">
                    <li className="footer__company--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                      Terms & Condition
                    </li>
                  </Link>
                  <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                    <li className="footer__company--item text-xs inter text-gray-400 duration-[1500ms] ease-in-out hover:text-primary cursor-pointer mb-3">
                      Privacy Policy
                    </li>
                  </Link>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
      <hr className="bg-txt-yellow sm:hidden h-0 md:h-[2px] border-none max-w-[1065px] m-auto sm:mx-9 lg:mx-7" />
      <div className="footer__terms sm:hidden pb-14 pt-8 flex items-center justify-between max-w-[1065px] m-auto sm:mx-9 lg:mx-7">
        <Link href={"/terms"} target="_blank" rel="noopener noreferrer">
          <Typography textsize="xs" color="gray">
            Terms & Condition
          </Typography>
        </Link>
        <Link href={"/privacy"} target="_blank" rel="noopener noreferrer">
          <Typography textsize="xs" color="gray">
            Privacy Policy
          </Typography>
        </Link>
      </div>
    </>
  );
};

export default Footer;
