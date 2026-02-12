import Image from "next/image";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  CEOImage,
  COOImage,
  COSECImage,
  CTOImage,
  Heading,
  TestimonialImage,
  Typography,
} from "ui";
import { AppDispatch, RootState } from "../../redux/store";
import teamService from "../../services/teamService";
import { TeamProp } from "../../types/teams";
import Link from "next/link";
import { FaFacebook } from "react-icons/fa";
import { RiInstagramFill } from "react-icons/ri";
import TeamCard from "./TeamCard";
import { TestimonialBody } from "../Home/Testimonial";
import { SwiperSlide } from "swiper/react";
import { useMediaQuery } from "@react-hook/media-query";

type Props = {};

const Teams = (props: Props) => {
  const { teams } = useSelector((state: RootState) => state.team);
  const dispatch = useDispatch<AppDispatch>()

  const isMobile = useMediaQuery("(max-width: 600px)");
  const isTablet = useMediaQuery("(max-width: 769px)");

  useEffect(() => {
    dispatch(teamService.getTeams())
  }, [])


  return (
    <div className="flex flex-col items-center mt-[151px] sm:mt-[68px]">
      <Heading textsize="2xl" classstyle="sm:text-2xl text_gradient">
        Meet the team
      </Heading>
      {/* <Typography
        textsize="sm"
        align="center"
        classstyle="inter mt-2 font-[300]"
      >
        Meet the team that created the value you enjoy from CandleAI.
      </Typography> */}
      <div className="teams__lists bottom__to__top__gradient w-full mt-8 sm:px-10">
        {/* <div className="max-w-[1065px] my-14 grid grid-cols-2 ms:grid-cols-2 md:grid-cols-3 gap-10 md:gap-20 items-center justify-center m-auto"> */}
        <TestimonialBody perview={isTablet ? 3 : isMobile ? 1 : 4}>

          {["", "", "", "", "", ""].map((team: any, index: number) => (
            <SwiperSlide><TeamCard /></SwiperSlide>
          ))}
        </TestimonialBody>
        {/* </div> */}
      </div>
    </div>
  );
};

export default Teams;
