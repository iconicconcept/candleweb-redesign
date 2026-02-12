import { useMediaQueries, useMediaQuery } from "@react-hook/media-query";
import React, { useEffect, useState } from "react";
import { IoNotificationsOutline, IoMailUnreadOutline } from "react-icons/io5";
import { Button, Heading, MenuDropdown, Modal, Typography, getTimeAgo, DotCarousel, SvgIcons, } from "ui";

import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import notificationService from "../../../services/notificationService";
import { ShowFullMessageState, Result, NotificationProp } from "../../../types/notification";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import useSWR from "swr";
import { setNotification } from "../../../redux/slices/notificationSlice";

type Props = {};

const Notification = (props: Props) => {
  const [showFullMessage, setShowFullMessage] = useState<ShowFullMessageState>({});
  const { notification } = useSelector((state: RootState) => state.notification)
  const axiosToken = useAxiosAuth();


  const dispatch = useDispatch<AppDispatch>()

  const [currentPage, setCurrentPage] = useState<{ page: number, isLoading: boolean }>({
    page: 1,
    isLoading: false
  });
  const notificationsPerPage = 3;

  const indexOfLastNotification = currentPage.page * notificationsPerPage;



  const paginate = (pageNumber: number, isLoading: boolean) => setCurrentPage((prevState) => ({ page: pageNumber, isLoading }));

  const { data, } = useSWR('/notification/unread/', async (url) => {
    const response = await axiosToken.get(url);
    dispatch(setNotification(response.data));
    paginate(1, false);
    return response.data;
  });

  const toggleMessage = (id: number) => {
    setShowFullMessage((prevState) => {
      const updatedState = { ...prevState };
      updatedState[id] = !updatedState[id];
      return updatedState;
    });
  };

  const handleMarkAsRead = (notificationId: any) => {
    // Mark notification as read when a button is clicked
    dispatch(notificationService.getMarkNotificationRead({ api: axiosToken, id: notificationId }));
  };

  const isMobile = useMediaQuery("(max-width: 600px)");

  const fetchNewNotification = async (page: number) => {
    paginate(currentPage.page, true);
    const newNotification = await dispatch(notificationService.getNotifications({ api: axiosToken, page })).unwrap();
    dispatch(setNotification(newNotification));
    paginate(page, false);
  }

  return (
    <MenuDropdown
      padding={isMobile ? "1rem" : "25px 7rem"}
      width="500px"
      btn={
        <div className="notification sm:text-xl md:text-2xl text-primary relative cursor-pointer">
          {SvgIcons.notification}
          {notification?.count! > 0 && <span className="dot absolute top-[2px] right-[2px] w-[0.65rem] h-[0.65rem] border border-background rounded-full bg-primary"></span>}
        </div>
      }
    >
      <div className="mt-0 flex items-center justify-between w-full">
        <Heading textsize="sm" classstyle="!text-white flex items-center gap-3">
          Notification{" "}
          <span className="w-6 h-6 rounded-full bg-primary grid place-items-center text-sm text-dark">
            {notification?.count ?? 0}
          </span>
        </Heading>
        <Button
          variant="transparent"
          classstyle="text-secondary text-sm font-normal"
          onClick={(e) => {
            e.preventDefault();
            dispatch(notificationService.clearAllNotification(axiosToken));
          }}
        >
          Clear all
        </Button>
      </div>

      <div className="mt-3 w-full flex flex-col items-stretch gap-5">
        {notification.results?.length === 0 ? (
          <div className="h-40 w-full text-txtSec text-sm text-center flex items-center justify-center">
            You have no current notifications
          </div>
        ) : (
          notification.results?.map((notif, i) => (
            // notification.results?.slice(indexOfFirstNotification, indexOfLastNotification)?.map((notif, i) => (
            <div className="card__notification my-4 relative w-full cursor-pointer" key={i}>
              <div className="top__header flex items-center gap-4" >
                <IoMailUnreadOutline className="text-primary text-xl" />{" "}
                <Heading textsize="sm">{notif.notification_type}</Heading>
              </div>
              <div className="message my-2" onClick={() => {
                toggleMessage(notif.id!);

                if (!showFullMessage[notif.id!]) {
                  handleMarkAsRead(notif.id);
                }
              }}>
                <Typography className={'text-sm sm:text-xs'}>
                  {showFullMessage[notif.id!] ? notif.message : notif.message?.slice(0, 55) + '... '}

                </Typography>
              </div>
              <div className="date">
                <Typography classstyle="!text-xs text-gray-300">
                  {getTimeAgo(notif.created_at!)}
                </Typography>
              </div>
            </div>
          ))
        )}

        {(notification.count ?? 0) > 0 && (
          <div className="pagination flex justify-center gap-2">
            {currentPage.isLoading && <Typography>Loading...</Typography>}
            {!currentPage.isLoading && Array.from({ length: Math.ceil(notification.count! / notificationsPerPage) }, (_, i) => (
              <span
                key={i}
                onClick={() => fetchNewNotification(i + 1)}
                className={`pagination-button ${currentPage.page === i + 1 ? 'bg-[#37bf91]' : 'bg-[#fff] '} w-4 h-4 rounded-full grid place-items-center mr-5 cursor-pointer`}
              >
              </span>
            ))}
          </div>

        )}
      </div>
    </MenuDropdown>
  );
};

export default Notification;
