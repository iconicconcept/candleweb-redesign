import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import exchangeServices from "../../../../services/exchangeService";
import useAxiosAuth from "../../../../lib/hooks/useAxiosAuth";
import { error } from "../../../alert/Toast";
import Dialog from "../Dialog";
import { SwapIcon } from "../icons";
import type { ExchangeProp } from "../../../../types/exchange";
import type { ExchangeData } from "../../modal/AddExchange";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
};

const emptyForm: ExchangeData = {
  supported_exchange_id: 0,
  API_KEY: "",
  API_SECRET: "",
  API_PASSPHRASE: "",
};

export default function AddExchangeDialog({ open, onClose, onAdded }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { exchanges, isLoading } = useSelector((state: RootState) => state.exchange);

  const [form, setForm] = useState<ExchangeData>(emptyForm);
  const [selectedName, setSelectedName] = useState("");

  useEffect(() => {
    if (open && exchanges.length < 1) dispatch(exchangeServices.getExchanges());
  }, [open, exchanges.length, dispatch]);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setSelectedName("");
    }
  }, [open]);

  const isKucoin = selectedName.toLowerCase() === "kucoin";

  const submit = () => {
    if (form.supported_exchange_id < 1) return error("Select your exchange");
    if (!form.API_KEY || !form.API_SECRET) return error("Add your API details");
    if (isKucoin && !form.API_PASSPHRASE) return error("API passphrase is required for KuCoin");

    const payload: ExchangeData = isKucoin
      ? form
      : {
          supported_exchange_id: form.supported_exchange_id,
          API_KEY: form.API_KEY,
          API_SECRET: form.API_SECRET,
        };

    dispatch(exchangeServices.addExchange({ axiosToken, data: payload })).then((res: any) => {
      if (res?.error) return;
      onAdded();
      onClose();
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      icon={<SwapIcon />}
      title="Add an exchange"
      subtitle="Paste a trade-only API key. Candleweb never asks for withdrawal permission."
      labelledBy="add-exchange-title"
      footer={
        <>
          <button className="fx-cta ghost2" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="fx-cta main2" type="button" disabled={isLoading} onClick={submit}>
            {isLoading ? "Adding…" : "Add exchange"}
          </button>
        </>
      }
    >
      <div className="fx-fld">
        <label className="fx-fl" htmlFor="ex-select">
          Exchange
        </label>
        <div className="fx-inp">
          <select
            id="ex-select"
            value={form.supported_exchange_id || ""}
            onChange={(e) => {
              const picked = exchanges.find(
                (x: ExchangeProp) => String(x.id) === e.target.value,
              );
              setSelectedName(picked?.name ?? "");
              setForm((f) => ({ ...f, supported_exchange_id: picked?.id ?? 0 }));
            }}
          >
            <option value="">Select an exchange</option>
            {exchanges.map((x: ExchangeProp) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="fx-fld">
        <label className="fx-fl" htmlFor="ex-key">
          API key
        </label>
        <div className="fx-inp">
          <input
            id="ex-key"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste your API key"
            value={form.API_KEY}
            onChange={(e) => setForm((f) => ({ ...f, API_KEY: e.target.value }))}
          />
        </div>
      </div>

      <div className="fx-fld">
        <label className="fx-fl" htmlFor="ex-secret">
          API secret
        </label>
        <div className="fx-inp">
          <input
            id="ex-secret"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste your API secret"
            value={form.API_SECRET}
            onChange={(e) => setForm((f) => ({ ...f, API_SECRET: e.target.value }))}
          />
        </div>
      </div>

      {isKucoin && (
        <div className="fx-fld">
          <label className="fx-fl" htmlFor="ex-pass">
            API passphrase
          </label>
          <div className="fx-inp">
            <input
              id="ex-pass"
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="Paste your API passphrase"
              value={form.API_PASSPHRASE ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, API_PASSPHRASE: e.target.value }))}
            />
          </div>
          <p className="fx-hint">KuCoin keys need the passphrase you set when creating them.</p>
        </div>
      )}
    </Dialog>
  );
}
