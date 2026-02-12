import { GridColDef } from "@mui/x-data-grid";
import { RxFileText } from "react-icons/rx";
import { Button, Typography, convertDate, dollarFormat, formatDate, formatDateTime, maskWalletAddress } from "ui";

export const exchangeColumn = (onChange: (value: string, id: string) => void): GridColDef[] => {

    return [
        {
            field: "supported_exchange_id",
            headerName: "Exchange",
            flex: 1,
            editable: false,
            headerClassName: "column-header",
            minWidth: 100,
        },
        {
            field: "API_KEY",
            headerName: "API Key",
            flex: 1,
            editable: false,
            headerClassName: "column-header",
            minWidth: 120,
        },
        {
            field: "API_SECRET",
            headerName: "API Secret",
            flex: 1,
            editable: false,
            headerClassName: "column-header",
            minWidth: 120,
        },
        {
            field: "is_active",
            headerName: "Status",
            flex: 1,
            editable: false,
            headerClassName: "column-header",
            minWidth: 100,
            renderCell(params) {
                return (
                    <Typography
                        classstyle={`${params.value.toString() === "true"
                            ? "!text-[#37B39C]"
                            : "!text-red-500"
                            }`}
                    >
                        {params.value.toString() === "true" ? "Active" : "Expired"}
                    </Typography>
                );
            },
        },
        {
            field: "action",
            headerName: "Action",
            flex: 1,
            editable: false,
            headerClassName: "column-header",
            minWidth: 120,
            renderCell: (params: any) => (
                <select className="bg-transparent inter outline-none h-full" onChange={(e) => onChange(e.target.value, params.row.id.toString())}>
                    <option value="activate" className="bg-card p-2" selected>
                        Activate
                    </option>
                    <option value="deactivate" className="bg-card p-2">
                        Delete
                    </option>
                </select>
            ),
        },
    ];
}

export const tradeColumn: GridColDef[] = [
    {
        field: "currency",
        headerName: "Currency",
        width: 150,
        editable: false,
        type: "string",
        sortable: false,
        flex: 1,
        minWidth: 80,
    },
    {
        field: "pair",
        headerName: "Pair",
        editable: false,
        type: "string",
        sortable: false,
        flex: 1,
        minWidth: 100,
    },
    {
        field: "type",
        headerName: "Side",
        editable: false,
        type: "string",
        sortable: false,
        flex: 1,
        minWidth: 70,
    },
    {
        field: "price",
        headerName: "Price",
        editable: false,
        type: "string",
        sortable: false,
        flex: 1,
        minWidth: 100,
        renderCell: (param) => (
            <Typography classstyle="">{dollarFormat(parseFloat(param.value.toString()))}</Typography>
        )
    },
    {
        field: "receipt",
        headerName: "Receipt",
        editable: false,
        type: "string",
        sortable: false,
        flex: 1,
        align: "center",
        minWidth: 60,
        renderCell: (param) => (
            <div
                onClick={() => { }}
                style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    width: "100%",
                }}
            >
                <RxFileText className="text-primary text-2xl cursor-pointer" />
            </div>
        ),
    },
    {
        field: "created_at",
        headerName: "Date",
        editable: false,
        type: "string",
        sortable: false,
        flex: 1,
        minWidth: 110,
        renderCell: (param) => (
            <Typography classstyle="text-xs" color="gray">{convertDate(param.value)}</Typography>
        )
    },
    {
        field: "difference",
        headerName: "Result",
        editable: false,
        type: "string",
        sortable: false,
        flex: 1,
        minWidth: 60,
        renderCell: (param) => {
            return <Typography className={`${(param.row.type as string).toLocaleLowerCase() === "buy" ? "!text-yellow-400" : param.value.toString().slice(0, 1) === "-" ? "!text-red-700" : "text-primary"}`}>{(!param.value || parseFloat(param.value) === 0) ? "-" : (param.value + "%")}</Typography>
        }
    },
];


export const inviteColumn: GridColDef[] = [
    {
        field: "id",
        headerName: "Wallet ID",
        width: 150,
        editable: false,
        type: "string",
        sortable: false,
        flex: 2,
        minWidth: 80,
        renderCell(params) {
            return <Typography classstyle="">{maskWalletAddress(params.value as string)}</Typography>;
        },
    },
    {
        field: "network",
        headerName: "Network",
        editable: false,
        type: "string",
        sortable: false,
        flex: 1,
        minWidth: 100,
        renderCell(params) {
            return <Typography classstyle="">{params.value as string}</Typography>;
        },
    },
    {
        field: "date",
        headerName: "Date",
        editable: false,
        type: "string",
        sortable: true,
        flex: 1,
        minWidth: 70,
        renderCell: (param) => (
            <Typography classstyle="text-xs" color="gray">{formatDate(param.value)}</Typography>
        )
    },
    {
        field: "via",
        headerName: "Referred Via",
        editable: false,
        type: "string",
        sortable: false,
        flex: 1,
        minWidth: 100,
    },
    {
        field: "status",
        headerName: "Status",
        editable: false,
        type: "string",
        sortable: false,
        flex: 1,
        align: "center",
        minWidth: 60,
        renderCell: (param) => (
            <div

                className="py-1 px-2 rounded-full bg-[#1E1E1E]"
            >
                <Typography classstyle="" textsize="xs" color="gray">{param.value}</Typography>
            </div>
        ),
    },
    {
        field: "amount",
        headerName: "Amount",
        editable: false,
        type: "string",
        sortable: false,
        flex: 1,
        minWidth: 110,
        renderCell: (param) => (
            <div className="p-1 rounded-lg bg-[#848484]">

                <Typography classstyle="!text-primary">{dollarFormat(parseFloat((param.row.amount ?? "0").toString()), 4)}</Typography>
            </div>
        )
    },
    {
        field: "action",
        headerName: "",
        editable: false,
        type: "string",
        sortable: false,
        flex: 1,
        minWidth: 60,
        renderCell: (param) => {
            return <Button variant='gradient' disabled={param.value || param.row.amount === "0"} classstyle={"yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow !px-4 !py-1 !rounded-lg"} onClick={() => { }}>Claim</Button>
        }
    },
];



export const closeTableColumn = [
    { key: "id", name: "" },
    { key: "date", name: "Date" },
    { key: "plan", name: "Plan" },
    { key: "amount", name: "Amount" },
    { key: "status", name: "Status" },
    { key: "misc", name: "" },
];