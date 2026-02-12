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
import { Checkbox } from "ui";

const columns = [
  {
    key: "id",
    name: "ID",
  },
  {
    key: "currency",
    name: "Currency",
  },
  { key: "pair", name: "Pair" },
  { key: "type", name: "Type" },
  { key: "amount", name: "Amount" },
  {
    key: "receipt",
    name: "Receipt",
  },
  { key: "date", name: "Date" },
  { key: "result", name: "Result" },
];

const rows = [
  {
    id: 1,
    currency: "USD",
    pair: "BNB",
    type: "BUY",
    amount: "$10,000",
    date: "2022-01-01",
    result: "+5%",
  },
  {
    id: 2,
    currency: "EUR",
    pair: "BNB",
    type: "SELL",
    amount: "$5,000",
    date: "2022-01-02",
    result: "-3%",
  },
  {
    id: 3,
    currency: "GBP",
    pair: "BNB",
    type: "BUY",
    amount: "$2,500",
    date: "2022-01-03",
    result: "+10%",
  },
  {
    id: 4,
    currency: "JPY",
    pair: "BNB",
    type: "SELL",
    amount: "$1,000",
    date: "2022-01-04",
    result: "-2%",
  },
  {
    id: 5,
    currency: "AUD",
    pair: "BNB",
    type: "BUY",
    amount: "$3,000",
    date: "2022-01-05",
    result: "+7%",
  },
];

const onCheck = () => {};

export const GapTableOld = () => {
  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    backgroundColor: "#24262B",
    border: 0,
  }));

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    border: 0,
    color: "rgba(132, 132, 132, 1)",
  }));

  const StyledTable = styled(Table)(({ theme }) => ({
    borderCollapse: "separate",
    borderSpacing: "0 1rem",
    width: "100%",
  }));

  return (
    <div>
      <TableContainer component={Paper}>
        <StyledTable aria-label="simple table">
          <TableHead
            style={{
              backgroundColor: "#24262B",
            }}
          >
            <TableRow className="table__row">
              {columns.map((column, index) => (
                <StyledTableCell
                  key={column.key + index}
                  style={{ color: "white" }}
                >
                  {column.name === "Currency" && (
                    <div className="">
                      <Checkbox
                        value="currency"
                        labeltext=""
                        labelfor=""
                        defaultChecked={true}
                      />
                    </div>
                  )}
                  {column.name}
                </StyledTableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <StyledTableRow
                key={row.id + index}
                className="styledTable"
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <StyledTableCell></StyledTableCell>
                <StyledTableCell>{row.pair}</StyledTableCell>
                <StyledTableCell
                  style={{
                    color: "var(--primary)",
                  }}
                >
                  {row.type}
                </StyledTableCell>
                <StyledTableCell>{row.amount}</StyledTableCell>
                <StyledTableCell>
                  <RxFileText
                    style={{
                      color: "var(--primary)",
                    }}
                  />
                </StyledTableCell>
                <StyledTableCell>{row.date}</StyledTableCell>
                <StyledTableCell
                  style={{
                    color: "var(--primary)",
                  }}
                >
                  {row.result}
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </StyledTable>
      </TableContainer>
    </div>
  );
};
