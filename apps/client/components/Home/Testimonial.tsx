import Image from "next/image";
import React, { useEffect } from "react";
import { MdArrowForwardIos } from "react-icons/md";
import { FaFacebook, FaStar, FaRegStar } from "react-icons/fa";
import { RiInstagramFill } from "react-icons/ri";
import { Heading, IconButton, LogoRingIcon, SvgIcons, TestimonialImage, Typography } from "ui";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import testimonialService from "../../services/testimonialService";
import { Result } from "../../types/testimonial";

import { Swiper, SwiperClass, SwiperSlide } from 'swiper/react';

import { Pagination, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import { useMediaQuery } from "@react-hook/media-query";
import { imageUri } from "../../utils/constants";


type Props = {};

const Testimonial = (props: Props) => {
  const { testimonials } = useSelector((state: RootState) => state.testimonial)

  const isMobile = useMediaQuery("(max-width: 600px)");
  const isTablet = useMediaQuery("(max-width: 769px)");
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(testimonialService.getTestimonial())
  }, [])

  return (
    <TestimonialBody perview={isTablet ? 2 : isMobile ? 1 : (testimonials.results?.length ?? 0) < 3 ? 2 : 3}>
      {testimonials.results?.map((testimonial: Result, index: number) => (

        <SwiperSlide key={index + (testimonial.name ?? "")}><TestimonialCard testimonial={testimonial} /></SwiperSlide>
      ))}
    </TestimonialBody>
  );
};

export const TestimonialCard = ({ testimonial }: { testimonial: Result }) => {
  return (<>
    <div className="testimonial_card py-6 px-9 min-w-[340px] sm:min-w-[300px] !w-[90%] m-auto">
      <div className="testimonial_icon">
        {SvgIcons.quote}
      </div>

      <Typography classstyle="testimonial_text text-sm inter my-5">
        &quot;{testimonial.review}&quot;
      </Typography>

      <div className="testimonial_user--info flex items-center gap-5">

        <Image src={imageUri + testimonial.photo} alt="Testimonial Image" width={60} height={60} className="testimonial_user--profile w-14 h-14 rounded-full object-cover" />

        <div className="testimonial_user--details">
          <div className="testimonial_user--name">
            <Typography classstyle="inter">{testimonial.name}</Typography>
          </div>
          <div className="testimonial_user--title">
            <Typography classstyle="text-xs inter" color="gray">{testimonial.position ?? ""}</Typography>
          </div>

        </div>
      </div>
    </div>
  </>);
}

export const AuthTestimonialCard = ({ testimonial }: { testimonial: Result }) => {
  return (
    <div className="w-full flex items-center justify-center">
      <div className="">
        <div className=" sm:mt-0">
          <Heading classstyle="max-w-md inter font-medium leading-10 sm:text-xl" textsize="md">{testimonial.review}</Heading>
          <div className="flex items-center gap-5 mt-4">
            <div className="w-10 h-1 bg-white rounded-xl sm:w-6"></div>
            <Image src={imageUri + testimonial.photo} alt='Testimonial Image' width={40} height={40} className='w-10 h-10 rounded-full sm:w-8 sm:h-8' />
            <Typography classstyle="inter font-normal sm:text-sm" textsize="lg">{testimonial.name}</Typography>
          </div>
        </div>
      </div>
    </div>
  );
}

export const TestimonialBody = ({ perview, children, stopAutoplay, onSwipe, stopPagination }: { perview: number, children: React.ReactNode, onSwipe?: (index: number) => void, stopAutoplay?: boolean, stopPagination?: boolean }) => {
  const isMobile = useMediaQuery("(max-width: 600px)");
  return (
    <Swiper
      slidesPerView={isMobile ? 1 : perview}
      spaceBetween={30}
      autoplay={stopAutoplay ? false : {
        delay: 3000,
        disableOnInteraction: true,
      }}
      pagination={stopPagination ? false : {
        clickable: true,
      }}
      modules={[Pagination, Autoplay]}
      className={`mySwiper mt-16 sm:!ml-0 sm:!pl-0 ${stopAutoplay ? "!pl-0 !pb-0 !mt-0 tradePage" : ""}`}
      onSlideChange={(swipe: SwiperClass) =>
        onSwipe?.(swipe.activeIndex)
      }
    >
      {children}
    </Swiper>

  );
}

export default Testimonial;
