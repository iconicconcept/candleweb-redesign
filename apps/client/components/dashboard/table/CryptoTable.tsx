import * as React from "react";
import Image from "next/image";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import { useMediaQuery } from "@react-hook/media-query";

import {
  BNB,
  BTC,
  ETH,
  XRP,
  Button,
  dollarFormat,
  SvgIcons,
  Typography,
} from "ui";
import { error, success } from "../../alert/Toast";
import { axiosApi } from "../../../lib/axiosApi";
import { useRouter } from "next/router";
import { AxiosError } from "axios";
import useEthereum from "../../../lib/hooks/useEthereum";
import { useEffect, useState } from "react";
import AddTrade from "../modal/AddTrade";
import { useDispatch, useSelector } from "react-redux";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import { AppDispatch, RootState } from "../../../redux/store";
import currencyService from "../../../services/currencyService";
import exchangeServices from "../../../services/exchangeService";
import Loader from "../../Loader";
import { loginUser } from "../../../utils/loginUser";
import useUserStore from "../../../lib/hooks/useUserStore";
import { isAuthorizationHeaderSet } from "../../../utils/check_auth";

type Props = {}

const rows = [
  // {
  //   asset: {
  //     icon: ETH,
  //     name: "ETHEREUM",
  //     short: "ETH"
  //   },
  //   pair: "ETHUSDT",
  //   traded_amount: dollarFormat(250000),
  //   realized: "70%",
  //   misc: {
  //     place: true
  //   },
  // },
  {
    asset: {
      icon: BTC,
      name: "BITCOIN",
      short: "BTC"
    },
    pair: "BTCUSDT",
    traded_amount: dollarFormat(0),
    realized: "0%",
    misc: {
      place: false
    },
  }, {
    asset: {
      icon: BNB,
      name: "BNB",
      short: "BNB"
    },
    pair: "BNBUSDT",
    traded_amount: dollarFormat(0),
    realized: "0%",
    misc: {
      place: false
    },
  }, {
    asset: {
      icon: XRP,
      name: "RIPPLE",
      short: "XRP"
    },
    pair: "XRPUSDT",
    traded_amount: dollarFormat(0),
    realized: "0%",
    misc: {
      place: false
    },
  },
];

const CryptoTable = (props: Props) => {
  const [rowData, setRowData] = useState<typeof rows>(rows);
  const { totalTradeAmount, totalTradeProfit } = useSelector((state: RootState) => state.trade)
  const { connectWallet } = useEthereum()
  const axiosToken = useAxiosAuth()

  const isMobile = useMediaQuery("(max-width: 600px)");
  const { exchangeRecord } = useSelector((state: RootState) => state.exchange)
  const { user, setUser } = useUserStore((state) => state);
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  const [isLoading, setIsLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [columns, setColumns] = useState([
    { key: "asset", name: "Asset" },
    { key: "pair", name: "Pair" },
    { key: "traded_amount", name: "Traded Amount" },
    { key: "realized", name: "Realized Profit" },
    { key: "misc", name: "" },
  ])




  // useEffect(() => {
  //   if (isMobile) {
  //     const newColumn = columns.filter((col) => col.key !== "traded_amount" && col.key !== 'realized' && col.key !== "pair")
  //     setColumns(newColumn)
  //   }
  // }, [])

  useEffect(() => {
    dispatch(currencyService.getCurrency())
    dispatch(exchangeServices.getExchanges())

    // if (isAuthorizationHeaderSet(axiosToken) && exchangeRecord.length < 1 && user.email) {
    //   dispatch(exchangeServices.getExchangeRecords(axiosToken))
    // }

  }, [user])

  useEffect(() => {

    if (totalTradeAmount && totalTradeProfit) {
      const data = {
        asset: {
          icon: ETH,
          name: "ETHEREUM",
          short: "ETH"
        },
        pair: "ETHUSDT",
        traded_amount: dollarFormat(totalTradeAmount),
        realized: totalTradeProfit.toLocaleString() + "%",
        misc: {
          place: true
        },
      };
      setRowData([
        data, ...rows
      ])
    }
  }, [totalTradeAmount, totalTradeProfit])




  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    border: 0,
  }));

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    border: 0,
    color: "#ffffff",
    padding: isMobile ? "1rem 0.5rem" : "16px"
  }));

  const StyledTable = styled(Table)(({ theme }) => ({
    width: "100%",
    boxShadow: "none"
  }));

  return (
    <>
      {isLoading && <Loader />}
      <div className="tb:px-5 sm:px-1">
        <div className="w-full max-w-[1120px] !min-w-[680px] most_traded_table rounded-3xl overflow-y-hidden px-8 py-5 tb:px-5 tb:py-3">
          <div className="table_top_tabs flex items-center border-b border-[#5E5E5E]">
            <div className="trending_crypto top_table_tab cursor-pointer border-b border-primary flex items-center gap-3 px-5 py-6 sm:py-3 sm:px-2 sm:gap-2">
              <span>{SvgIcons.trending} </span> <Typography>Trending</Typography>
            </div>
            <div className="new_crypto top_table_tab cursor-not-allowed flex items-center gap-3 px-5 py-6 sm:py-3 sm:px-2 sm:gap-2">
              <span className="bg-black-700 invert">{SvgIcons.new_coins} </span> <Typography classstyle="!text-gray-500">New Coins</Typography>
            </div>
            <div className="profit_crypto top_table_tab cursor-not-allowed flex items-center gap-3 px-5 py-6 sm:py-3 sm:px-2 sm:gap-2">
              <span className="invert">{SvgIcons.profit} </span> <Typography classstyle="!text-gray-500">Most Profit</Typography>
            </div>
          </div>
          <TableContainer component={Paper}>
            <StyledTable aria-label="simple table">
              <TableHead
                style={{
                  // backgroundColor: "#24262B",
                }}
              >
                <TableRow>
                  {columns.map((column, index) => (

                    <StyledTableCell
                      key={column.key + index}
                      className="inter sm:!min-w-max"
                      style={{ color: "#ABADAF", fontWeight: 400 }}
                    >
                      {column.name}
                    </StyledTableCell>

                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rowData && rowData.map((row, index) => (
                  <StyledTableRow
                    key={row.asset.name + index}
                    className="table__row--crypto"
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 }, "&:hover": {
                        backgroundColor: "#24262B",
                        transition: "all 0.5s ease-in-out",
                        cursor: "pointer",
                        borderRadius: "9999px"
                      },
                      borderRadius: "9999px"
                    }}
                  >
                    <StyledTableCell style={{
                      minWidth: isMobile ? "170px" : "220px",
                      display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.95rem", fontWeight: "200"
                    }}>
                      <Image src={row.asset.icon} alt="Trading icon" className="w-8 h-8 sm:w-[24px] sm:h-[24px] object-contain" /> <div className="sm:text-[14px] sm:hidden">{row.asset.name} <span className="text-[#ABADAF]">{row.asset.short}</span> </div><span className="md:hidden">{row.pair}</span>
                    </StyledTableCell>
                    {<StyledTableCell
                      className="inter"
                      style={{ fontSize: isMobile ? "14px" : "0.95rem", fontWeight: "200" }}
                    >
                      {row.pair}
                    </StyledTableCell>}
                    {<StyledTableCell style={{ fontSize: "0.95rem", fontWeight: "200" }}>{row.traded_amount}</StyledTableCell>}
                    {<StyledTableCell style={{
                      color: "var(--primary)", fontSize: "0.95rem", fontWeight: "200"
                    }}>{row.realized}</StyledTableCell>}


                    <StyledTableCell
                      align="right"
                      style={{
                        // color: "var(--primary)",
                      }}
                    >
                      {row.misc.place && <Button classstyle="w-[70px] sm:w-[30px] sm:!py-1 !border-txt-yellow !rounded-full" variant="border" onClick={async () => {
                        if (Object.keys(user).length === 0) {
                          connectWallet().then(async (res) => {
                            if (res !== null) {
                              await loginUser({
                                wallet: res.walletAddress, signerPassword: res.signMessage, setIsLoading, onSuccess(data, type) {
                                  if (type === "success") {
                                    setUser(data)
                                    dispatch(currencyService.getCurrency())
                                    dispatch(exchangeServices.getExchanges())
                                    dispatch(exchangeServices.getExchangeRecords(axiosToken))
                                    setOpenModal(true)
                                  }
                                },
                              });
                            }
                          }).catch((err) => { error(err.message) })
                        } else {
                          setOpenModal(true)
                        }
                      }}>Place trade</Button>}
                      {!row.misc.place && <Button disabled classstyle="w-[70px] sm:w-[30px] sm:!py-1 !border-txt-yellow !rounded-full !bg-transparent" variant="border">Coming soon</Button>}
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </StyledTable>
          </TableContainer>
        </div>
      </div>
      <AddTrade btnText="" isShowButton isOpenModal={openModal} modalFunction={(e) => setOpenModal(e)} />
    </>
  )
}

export default CryptoTable
