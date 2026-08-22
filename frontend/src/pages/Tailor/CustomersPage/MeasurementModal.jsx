import moment from "moment";
import toast from "react-hot-toast";
import { useRef, useEffect, useState } from "react";
import { Shirt, Scissors, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import CustomInput from "../../../components/CustomInput";
import LoadingSpinner from "../../../components/LoadingSpinner";
import FullScreenModal from "../../../components/FullScreenModal";

import {
  KAMEEZ_FIELDS,
  SHALWAR_FIELDS,
  TROUSER_FIELDS,
  ALL_FIELDS,
  initialMeasurementState,
  labelWithUrdu,
} from "./measurementFields";

const MeasurementModal = ({
  open,
  onClose,
  mode,
  customer,
  measureForm,
  setMeasureForm,
}) => {
  const formRef = useRef(null);
  const queryClient = useQueryClient();
  const customerId = customer?._id;
  const [activeLowerTab, setActiveLowerTab] = useState("shalwar");

  const { data: existingMeasurement, isLoading } = useQuery({
    queryKey: ["measurement", customerId],
    enabled: !!customerId && open,
    queryFn: async () => {
      const res = await fetch(`/api/measurements/${customerId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch measurement");
      return res.json();
    },
    retry: false,
  });

  useEffect(() => {
    if (existingMeasurement && open) {
      const cleaned = { ...initialMeasurementState };
      Object.keys(cleaned).forEach((key) => {
        cleaned[key] = existingMeasurement[key] || "";
      });
      setMeasureForm(cleaned);

      const hasTrouserData = TROUSER_FIELDS.some(
        (f) =>
          existingMeasurement[f] !== undefined &&
          existingMeasurement[f] !== "" &&
          existingMeasurement[f] !== null,
      );
      const hasShalwarData = SHALWAR_FIELDS.some(
        (f) =>
          existingMeasurement[f] !== undefined &&
          existingMeasurement[f] !== "" &&
          existingMeasurement[f] !== null,
      );
      if (hasTrouserData && !hasShalwarData) {
        setActiveLowerTab("trouser");
      } else {
        setActiveLowerTab("shalwar");
      }
    } else if (open) {
      setMeasureForm({ ...initialMeasurementState });
      setActiveLowerTab("shalwar");
    }
  }, [existingMeasurement, open, setMeasureForm]);

  const { mutate: saveMeasurement, isPending } = useMutation({
    mutationFn: async (data) => {
      const method = existingMeasurement ? "PUT" : "POST";
      const url = existingMeasurement
        ? `/api/measurements/update/${customerId}`
        : `/api/measurements/add/${customerId}`;

      const payload = { ...data, lower: { type: activeLowerTab } };
      ALL_FIELDS.forEach((f) => {
        if (
          payload[f] === "" ||
          payload[f] === null ||
          payload[f] === undefined
        ) {
          delete payload[f];
        }
      });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(
          result.message || result.error || "Failed to save measurements",
        );
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["measurement", customerId] });
      toast.success(
        `Measurements ${existingMeasurement ? "updated" : "added"} successfully`,
      );
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...measureForm, lower: { type: activeLowerTab } };
    ALL_FIELDS.forEach((f) => {
      if (
        payload[f] === "" ||
        payload[f] === null ||
        payload[f] === undefined
      ) {
        delete payload[f];
      }
    });
    saveMeasurement(payload);
  };

  const FieldLabel = ({ field, lowerType = "shalwar" }) => {
    const { english, urdu } = labelWithUrdu(field, lowerType);
    return (
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm text-gray-700 dark:text-gray-300 capitalize">
          {english}
        </span>
        {urdu && (
          <span className="font-medium text-sm text-gray-500 dark:text-gray-400">
            {urdu}
          </span>
        )}
      </div>
    );
  };

  const renderViewFields = (fields, lowerType = "shalwar") =>
    fields.map((field) => {
      const { english, urdu } = labelWithUrdu(field, lowerType);
      return (
        <div
          key={field}
          className="border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-white dark:bg-[#1a1129]"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium capitalize">
              {english}
            </span>
            {urdu && (
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {urdu}
              </span>
            )}
          </div>
          <p className="text-md font-semibold text-gray-800 dark:text-gray-100">
            {existingMeasurement?.[field] ?? "-"}
          </p>
        </div>
      );
    });

  const renderFormFields = (fields, lowerType = "shalwar") =>
    fields.map((field) => (
      <div key={field}>
        <FieldLabel field={field} lowerType={lowerType} />
        <input
          name={field}
          type="number"
          step="any"
          placeholder={`${labelWithUrdu(field, lowerType).english} size`}
          value={measureForm[field]}
          onChange={(e) =>
            setMeasureForm({ ...measureForm, [field]: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white dark:bg-[#1a1129] text-gray-800 dark:text-gray-100 placeholder:text-sm"
        />
      </div>
    ));

  const renderLowerSwitch = () => (
    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
      <div className="flex items-center gap-2">
        <Scissors size={16} className="text-purple-500 dark:text-purple-400" />
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {activeLowerTab === "trouser"
            ? "Trouser Measurements"
            : "Shalwar Measurements"}
        </h3>
      </div>

      <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveLowerTab("shalwar")}
          className={`px-3.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeLowerTab === "shalwar"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Shalwar
        </button>
        <button
          type="button"
          onClick={() => setActiveLowerTab("trouser")}
          className={`px-3.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeLowerTab === "trouser"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Trouser
        </button>
      </div>
    </div>
  );

  return (
    <FullScreenModal
      open={open}
      onClose={onClose}
      title={
        mode === "view"
          ? "View Measurements"
          : existingMeasurement
            ? "Edit Measurements"
            : "Add Measurements"
      }
      subtitle={`Customer: ${customer?.name || ""} (${customer?.phone || ""})`}
      actions={
        mode !== "view" && (
          <button
            onClick={() => formRef.current?.requestSubmit()}
            disabled={isPending}
            className="px-5 py-1.5 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        )
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner content="Loading measurements..." />
        </div>
      ) : mode === "view" ? (
        <div className="space-y-6">
          {existingMeasurement?.createdAt && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">Created:</span>
              <span>
                {moment(existingMeasurement.createdAt).format("DD MMM YYYY")}
              </span>
            </div>
          )}
          <Section title="Kameez" icon={Shirt}>
            {renderViewFields(KAMEEZ_FIELDS)}
          </Section>

          <div>
            {renderLowerSwitch()}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-3">
              {activeLowerTab === "shalwar"
                ? renderViewFields(SHALWAR_FIELDS, "shalwar")
                : renderViewFields(TROUSER_FIELDS, "trouser")}
            </div>
          </div>

          {existingMeasurement?.remarks && (
            <div>
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-200 dark:border-gray-700 pb-1 flex items-center gap-2">
                <FileText
                  size={16}
                  className="text-purple-500 dark:text-purple-400"
                />
                Remarks
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1129] border border-gray-200 dark:border-gray-700 rounded-md p-3">
                {existingMeasurement.remarks}
              </p>
            </div>
          )}
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <Section title="Kameez" icon={Shirt}>
            {renderFormFields(KAMEEZ_FIELDS)}
          </Section>

          <div>
            {renderLowerSwitch()}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-3">
              {activeLowerTab === "shalwar"
                ? renderFormFields(SHALWAR_FIELDS, "shalwar")
                : renderFormFields(TROUSER_FIELDS, "trouser")}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-200 dark:border-gray-700 pb-1 flex items-center gap-2">
              <FileText
                size={16}
                className="text-purple-500 dark:text-purple-400"
              />
              Remarks
            </h3>
            <CustomInput
              id="remarks"
              type="textarea"
              rows={4}
              placeholder="Additional notes..."
              value={measureForm.remarks || ""}
              onChange={(e) =>
                setMeasureForm({ ...measureForm, remarks: e.target.value })
              }
            />
          </div>
        </form>
      )}
    </FullScreenModal>
  );
};

const Section = ({ title, icon: Icon, children }) => (
  <div>
    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-200 dark:border-gray-700 pb-1 flex items-center gap-2">
      {Icon && (
        <Icon size={16} className="text-purple-500 dark:text-purple-400" />
      )}
      {title}
    </h3>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {children}
    </div>
  </div>
);

export default MeasurementModal;
