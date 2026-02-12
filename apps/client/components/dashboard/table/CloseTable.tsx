import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";

import { RxFileText } from "react-icons/rx";
import { Button, Heading, Modal, Typography, convertDate, dollarFormat, hasExpired } from "ui";
import { SubscriptionHistoryProp, SubscriptionProp } from "../../../types/subscription";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import subscriptionService from "../../../services/subscriptionService";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import { useState } from "react";
import { closeTableColumn } from "./HeaderColumns";

interface CloseTableProps {
  subscription: SubscriptionHistoryProp[],
  subs?: SubscriptionProp[],
  payment: () => void
}

export const CloseTable = ({ subscription: subscriptionHistory, payment, subs }: CloseTableProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const axiosToken = useAxiosAuth()
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    data: number;
  }>({
    open: false,
    data: 0,
  });

  const findSub = (id: number) => {
    const subInfo = subs?.find(sub => sub.id! === id);
    return {
      price: parseFloat(subInfo?.price!),
    }
  }

  // TODO: Ask about amount
  const rowData = subscriptionHistory.map((sub, index) => ({
    id: sub.id!,
    date: convertDate(sub.created_at!),
    plan: sub.subscription![0].description!,
    amount: dollarFormat(findSub(sub.subscription_id!).price!),
    status: !sub.is_active ? "Expired" : "Active",
    misc: JSON.stringify(sub.id),
  }))

  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    border: 0,
  }));

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    border: 0,
    color: "#ffffff",
  }));

  const StyledTable = styled(Table)(({ theme }) => ({
    width: "100%",
  }));

  return (
    <>
      <div className="w-full">
        <TableContainer component={Paper}>
          <StyledTable aria-label="simple table">
            <TableHead
              style={{
                backgroundColor: "#24262B",
              }}
            >
              <TableRow>
                {closeTableColumn.map((column, index) => (
                  <StyledTableCell
                    key={column.key + index}
                    className="inter sm:!min-w-max"
                    style={{ color: "white" }}
                  >
                    {column.name}
                  </StyledTableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rowData.map((row, index) => (
                <StyledTableRow
                  key={row.id + index}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <StyledTableCell></StyledTableCell>
                  <StyledTableCell>{row.date}</StyledTableCell>
                  <StyledTableCell
                    className="inter"
                    style={{
                      maxWidth: "200px",
                      minWidth: "200px",
                    }}
                  >
                    {row.plan}
                  </StyledTableCell>
                  <StyledTableCell>{row.amount}</StyledTableCell>

                  <StyledTableCell>
                    <div
                      className={`!min-w-[20px] rounded-sm text-center py-1 px-3 text-dark ${row.status.toLocaleLowerCase() === "active"
                        ? "bg-primary"
                        : "bg-[var(--redish)]"
                        } font-semibold inter`}
                    >
                      {row.status}
                    </div>
                  </StyledTableCell>
                  <StyledTableCell
                    align="right"
                    style={{
                      color: "var(--primary)",
                    }}
                  >
                    <Button
                      classstyle={`!px-6 !py-1 !text-sm !rounded-lg inter ${row.status.toLocaleLowerCase() !== "active"
                        ? "!text-primary border-primary"
                        : "!text-[var(--redish)] border-[var(--redish)]"
                        }`}
                      variant="border"
                      onClick={() => {
                        if (row.status.toLocaleLowerCase() === "active") {
                          setCancelModal({
                            open: true,
                            data: row.id
                          })
                        } else if (row.status.toLocaleLowerCase() === "expired") {
                          payment()
                        }
                      }}
                    >
                      {row.status.toLocaleLowerCase() === "active"
                        ? "Cancel"
                        : "Pay"}
                    </Button>
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </StyledTable>
        </TableContainer>
      </div>
      <Modal
        title={""}
        width="500px"
        isOpen={cancelModal.open}
        onChnage={(e) =>
          setCancelModal({
            data: 0,
            open: e,
          })
        }
      >
        <div className="cancelSub__modal mt-10 flex flex-col items-center text-center">
          <Heading textsize="lg" classstyle="text-center">Cancel Subscription</Heading>
          <Typography classstyle="text-center !text-txtSec !my-5">Are you sure you want to cancel this subscription?</Typography>
          <div className="mt-5 flex items-center gap-5">
            <Button variant="border" onClick={() => {
              setCancelModal({
                open: false,
                data: 0
              })
            }}>Cancel</Button>
            <Button onClick={() => {
              dispatch(subscriptionService.cancelSubscription({
                api: axiosToken,
                id: cancelModal.data
              }))
            }}>Proceed</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
