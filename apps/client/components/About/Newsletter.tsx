import React from "react";
import { HiOutlineMail } from "react-icons/hi";
import { Button, Heading, Input, Typography } from "ui";

type Props = {};

const Newsletter = (props: Props) => {
  return (
    <div className="mt-[151px] sm:mt-[68px] flex flex-col items-center justify-center max-w-[1065px] m-auto sm:!mx-0 lg:mx-7">
      <div className="newsletter__content bg-[#1e2023] md:rounded-lg w-full p-10 relative sm:flex sm:flex-col sm:items-center">
        <div className="newsletter__icon flex items-center justify-center absolute rounded-full sm:-top-6 -top-10 left-1/2 -translate-x-1/2">
          <div className="outer__icon newsletter__icon sm:w-16 sm:h-16 w-20 h-20 rounded-full flex items-center justify-center">
            <div className="inner__icon sm:w-14 sm:h-14 w-16 h-16 rounded-full border-4 border-[#202226] flex items-center justify-center">
              <HiOutlineMail className="text-4xl text-black sm:text-3xl" />
            </div>
          </div>
        </div>
        <div className=" flex flex-col items-center">
          <div className="newsletter__details mt-5 md:my-10 gap-5 flex flex-col justify-center mx-auto">
            <Heading textsize="xl" classstyle="inter text_gradient" align="center">
              Subscribe to our
              Newsletter
            </Heading>
            <Typography classstyle="" align="center">
              Get weekly update about our product on your email, no spam
              guaranteed we promise
            </Typography>
          </div>

          <div className="input__side flex items-center justify-between gap-2 rounded-full w-full border border-[#eeeeee] bg-[rgba(133,133,133,0.25)] p-2 mb-2 mt-5">
            <Input
              name=""
              type="email"
              placeholder="Email address"
              value={""}
              style={{
                border: "2px solid",
              }}
              classstyle="!border-transparent md:min-w-[400px] focus:!outline-none"

              onChange={(value) => { }}
            />

            <Button variant='gradient' classstyle={"yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow  sm:max-w-[90px] sm:!px-5 tb:!px-10 !px-20"}>Subscribe</Button>



          </div>
          <Typography
            textsize="xs"
            classstyle="mt-1 italic"
            align="left"
            color="gray"
          >
            Your email is safe with us, we don&apos;t spam
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;
