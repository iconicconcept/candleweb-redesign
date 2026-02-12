import React, { useState } from "react";
import { MdAlternateEmail } from "react-icons/md";
import { TextInput, Button } from "ui";
import Head from "next/head";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail((prev) => event.target.value);
  };

  // const resetPassword = () => {
  //   console.log(email);
  // };
  return (
    <>
      <Head>
        <title>Forgot Password - Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="login__container mt-16 md:mt-20">
        <div className="login__content flex justify-center h-[calc(100vh_-_160px)]">
          <div className="form__container w-full max-w-[400px] mx-5 md:mx-0 flex flex-col justify-center">
            <form className="bg-card-gradient rounded-lg p-5 w-full">
              {/* <img src={Signin} alt="" className="w-[61px] h-[61px]" /> */}
              <p className="text-xl font-medium mt-3 mb-5 text-center">
                Forgot Password
              </p>
              <div className="form__inputs">
                <TextInput
                  type="email"
                  name="email"
                  label="Email"
                  value={email}
                  Icon={<MdAlternateEmail />}
                  onChange={onInputChange}
                  className="mb-10"
                />
                <Button
                  onClick={() => {

                  }}
                  fullwidth={true}
                >
                  Reset Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
