import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { RxFileText } from "react-icons/rx";
import { DataGrid, GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import AddTrade from "../modal/AddTrade";
import { Button, Heading, MetaMaskIcon, Modal, NoRowsImage, SvgIcons, Typography, calculateDays, dollarFormat } from "ui";
import PieRose from "../charts/pieRose";
import { AiOutlineArrowDown, AiOutlineArrowUp } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import tradeService from "../../../services/tradeService";
import { AppDispatch, RootState } from "../../../redux/store";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import { TradeOrder } from "../../../types/trade";
import { ExchangeRecord } from "../../../types/exchange";
import useEthereum from "../../../lib/hooks/useEthereum";
import Image from "next/image";

type Props = {
  columnCheck?: boolean;
  rowCheck?: boolean;
  cols: GridColDef[];
  rows: TradeOrder[] | ExchangeRecord[] | {}[];
  isOpenModal?: boolean;
  pagination?: true;
  isInvite?: boolean;
};

const GapTable = ({ rows, cols, pagination, ...props }: Props) => {
  const { activeTrade } = useSelector((state: RootState) => state.trade);
  const axiosToken = useAxiosAuth()
  const [stopTrade, setStopTrade] = useState(false)
  const [inviteData, setInviteData] = useState<{
    id?: string;
    network?: string;
    date?: string | Date;
    via?: string;
    status?: string;
    amount?: string;
    action?: boolean;
  }>({})
  const [viewTrade, setViewTrade] = useState<{
    open: boolean;
    data: any;
  }>({
    open: false,
    data: {},
  });
  const dispatch = useDispatch<AppDispatch>()
  const { claimReferralReward } = useEthereum()

  const getParentTrade = () => {
    if (Object.keys(viewTrade.data).length > 0) {
      const filterTrade = activeTrade.filter((trade) => trade.id === viewTrade.data.misc);
      const getFirstTrade = filterTrade[0]
      const getAmount = getFirstTrade.trade_balance ?? 0;
      const getDifference = getFirstTrade.profit_loss_differrence ?? 0;
      const getStopLoss = getFirstTrade.stop_loss ?? 0
      const getIsActive = getFirstTrade.is_active ?? false
      const getTradeOrders = getFirstTrade.trade_order?.filter((order) => order.order_id === viewTrade.data.order_id) ?? []

      const amount = dollarFormat(parseFloat(getAmount!))

      return {
        getDifference, amount, getStopLoss, getTradeOrders, getIsActive
      }
    }
  }


  return (
    <>
      <div>
        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            key={Math.random()}
            rows={rows}
            columns={cols}
            checkboxSelection
            autoPageSize
            scrollbarSize={1}
            slots={{
              noRowsOverlay: () => (<div className="w-full h-full flex flex-col items-center justify-center">
                <Image src={NoRowsImage} alt={"No table rows Image"} />
                <div className="h-3"></div>
                <Typography>No records yet</Typography>
              </div>)
            }}
            pagination={rows.length < 100 ? undefined : !pagination ? true : undefined}
            onRowClick={(row) => {

              if (props.isInvite && row.row.action === false) {
                setInviteData(row.row);
                return;
              }

              if (props.isOpenModal) {

                setViewTrade({
                  open: true,
                  data: row.row,
                });
              }
            }}
            onRowSelectionModelChange={(model, details) => {
              // console.log({ model, details })
            }}
            //TODO: hideFooterSelectedRowCount
            // hideFooterPagination
            // autoHeight

            // hideFooterSelectedRowCount
            sx={{
              border: "none",

              "& .MuiDataGrid-virtualScrollerRenderZone": {
                gap: "1rem",
              },
              "& .MuiDataGrid-virtualScrollerContent": {
                marginBottom: "4rem",
              },
              "& .MuiDataGrid-main": {
                gap: "1rem",
              },
              "& .MuiDataGrid-row": {
                backgroundColor: "var(--card-bg)",
                borderRadius: "8px",
              },
              "& .MuiDataGrid-root": {
                border: "none",

              },
              "& .MuiDataGrid-columnsContainer": {
                backgroundColor: "transparent",
              },
              "& .MuiDataGrid-cell": {
                border: "none",
                color: "white",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "var(--card-bg)",
              },
              "& .MuiDataGrid-columnHeaders": {
                border: "none",
                color: "white",
                backgroundColor: "var(--card-bg)",
                borderRadius: "8px",
              },
              "& .MuiCheckbox-root": {
                color: "var(--primary)",
              },
              "& .MuiDataGrid-columnSeparator": {
                display: "none",
              },
              "& .MuiDataGrid-checkboxInput": {
                display: props.rowCheck ? "flex" : "none",
              },
              "& .MuiDataGrid-columnHeaders .MuiDataGrid-checkboxInput": {
                display: props.columnCheck ? "flex" : "none",
              },
              "& .MuiDataGrid-footerContainer": {
                border: "none",
              },
              "& .MuiDataGrid-cell:focus": {
                outline: "none",
              },
              "& .MuiDataGrid-row.Mui-selected": {
                outline: "none",
              },
              "& .MuiDataGrid-overlay": {
                background: "transparent",
                color: "var(--redish)",
              },
            }}
          />
        </Box>
      </div>
      <Modal
        title={"View Trade"}
        width="700px"
        isOpen={viewTrade.open}
        onChnage={(e) =>
          setViewTrade({
            data: {},
            open: e,
          })
        }
      >
        <div className="trades__modal mt-10 grid grid-cols-2 sm:grid-cols-1 gap-4 items-center">
          <div className="details">
            <div className="top__info grid grid-cols-2 items-center mb-4">
              <Heading textsize="sm">{viewTrade.data.pair}</Heading>
              <div className="percent flex gap-4 items-center">
                {(viewTrade.data?.difference ?? "-").toString().slice(0, 1) === "-" ? <AiOutlineArrowDown className="text-red-700 text-xl font-bold" /> : <AiOutlineArrowUp className="text-txt-primary text-xl font-bold" />}

                <Heading
                  textsize="sm"
                  boldness="normal"
                  classstyle={(viewTrade.data?.difference ?? "-").toString().slice(0, 1) === "-" ? "!text-red-700" : "!text-txt-primary"}
                >
                  {viewTrade.data.difference ?? 0}%
                </Heading>
              </div>
            </div>
            <div className="trade__modal__details grid grid-cols-2 ">
              <div className="left__dts">
                <ul className="flex flex-col gap-4 text-sm">
                  <li>Amount:</li>
                  <li>Current Equity:</li>
                  <li>Stop Loss:</li>
                  <li>Age:</li>
                </ul>
              </div>
              <div className="right__dts">
                <ul className="flex flex-col gap-4 text-sm">
                  <li>{dollarFormat(parseFloat(viewTrade.data.price))}</li>
                  <li>{getParentTrade()?.amount}</li>
                  <li>{getParentTrade()?.getStopLoss}</li>
                  <li>{calculateDays(viewTrade.data.created_at)} day(s)</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="trade__chart sm:mt-10">
            <PieRose tradeData={getParentTrade()?.getTradeOrders ?? []} />
          </div>
        </div>
        <div className="trade__btn">
          {getParentTrade()?.getIsActive && <Button classstyle="!bg-[var(--redish)] !border-[var(--redish)]" onClick={() => {
            setStopTrade(true);
          }}>
            Stop Trade
          </Button>}
          {!getParentTrade()?.getIsActive && <Button classstyle="!bg-primary !border-primary" onClick={() => {
            dispatch(tradeService.resumeTrade({
              api: axiosToken, id: viewTrade.data.misc
            })).then((res) => setViewTrade({
              open: false,
              data: {}
            }))
          }}>
            Resume Trade
          </Button>}
        </div>
      </Modal>
      <Modal
        title={""}
        width="500px"
        isOpen={stopTrade}
        onChnage={(e) =>
          setStopTrade(e)
        }
      >
        <div className="cancelSub__modal mt-10 flex flex-col items-center text-center">
          <Heading textsize="lg" classstyle="text-center">Stop Trade</Heading>
          <Typography classstyle="text-center !text-txtSec !my-5">Are you sure you want to stop this trade?</Typography>
          <div className="mt-5 flex items-center gap-5">
            <Button variant="border" onClick={() => {
              setStopTrade(false)
            }}>Cancel</Button>
            <Button onClick={() => {
              dispatch(tradeService.cancelTrade({
                api: axiosToken,
                id: viewTrade.data.misc
              })).then((res) => setStopTrade(false)).then((res) => setViewTrade({
                open: false,
                data: {}
              }))

            }}>Proceed</Button>
          </div>
        </div>
      </Modal>
      <Modal
        title={"Claim referral reward"}
        width="500px"
        // isOpen={true}
        isOpen={Object.keys(inviteData).length !== 0}
        onChnage={(e) => {
          setInviteData({})
        }
        }
      >
        <div className="cancelSub__modal mt-10 flex flex-col items-center text-center">
          <div className="flex flex-col items-center">
            <Typography textsize="xs" classstyle="!text-txtSec mb-1">Reward Total</Typography>
            <Heading textsize="2xl">{dollarFormat(Number(inviteData?.amount ?? 0))}</Heading>
          </div>
          <div className="">
            <Typography textsize="xs" classstyle="my-5" align="center">Thank you for inviting friends to our platform! 🚀, reward claims are networking specific, make sure you have the recommend network signed in to claim your rewards. </Typography>
          </div>
          <div className="py-2 px-4 bg-[#303134] rounded-full">
            <Typography textsize="xs">Recommended Network</Typography>
          </div>
          <div className="flex items-center gap-5 mb-5 mt-3">
            <div className="w-11 bg-gray-400 rounded-full p-2 h-11 flex items-center justify-center">
              {inviteData.network === "Solana" ? SvgIcons.solana : SvgIcons.metamask}
            </div>
            <div className="py-2 px-5 rounded-full border">
              <Typography textsize="sm">{inviteData.network}</Typography>
            </div>
          </div>


          <Button variant='gradient' classstyle="yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow !w-full !max-w-[300px] sm:!px-0" onClick={async () => {
            // console.log({ inviteData })
            if (inviteData.action === false) {
              await claimReferralReward(inviteData.id!);
              setInviteData({})
            }

          }}>Claim</Button>

        </div>
      </Modal>
    </>
  );
};

export default GapTable;
