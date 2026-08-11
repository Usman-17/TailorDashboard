import moment from "moment";
import toast from "react-hot-toast";
import { useRef, useEffect } from "react";
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
        cleaned[key] = existingMeasurement[key] ?? "";
      });
      setMeasureForm(cleaned);
    } else if (open) {
      setMeasureForm({ ...initialMeasurementState });
    }
  }, [existingMeasurement, open, setMeasureForm]);

  const { mutate: saveMeasurement, isPending } = useMutation({
    mutationFn: async (data) => {
      const method = existingMeasurement ? "PUT" : "POST";
      const url = existingMeasurement
        ? `/api/measurements/update/${customerId}`
        : `/api/measurements/add/${customerId}`;

      const payload = {
        ...data,
        lower: { type: "shalwar" },
      };

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
    const numericFieldsEmpty = ALL_FIELDS.some((f) => measureForm[f] === "");
    if (numericFieldsEmpty) {
      toast.error("Please fill all measurement fields");
      return;
    }
    saveMeasurement(measureForm);
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
          required
          placeholder={`${labelWithUrdu(field, lowerType).english} size`}
          value={measureForm[field]}
          onChange={(e) =>
            setMeasureForm({ ...measureForm, [field]: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white dark:bg-[#1a1129] text-gray-800 dark:text-gray-100 placeholder:text-sm"
        />
      </div>
    ));

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
            {isPending ? "Saving..." : "Save Measurements"}
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
          <Section title="Kameez">{renderViewFields(KAMEEZ_FIELDS)}</Section>
          <Section title="Shalwar Measurements">
            {renderViewFields(SHALWAR_FIELDS, "shalwar")}
          </Section>
          <Section title="Trouser Measurements">
            {renderViewFields(TROUSER_FIELDS, "trouser")}
          </Section>
          {existingMeasurement?.remarks && (
            <div>
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
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
          <Section title="Kameez">{renderFormFields(KAMEEZ_FIELDS)}</Section>

          <Section title="Shalwar Measurements">
            {renderFormFields(SHALWAR_FIELDS, "shalwar")}
          </Section>

          <Section title="Trouser Measurements">
            {renderFormFields(TROUSER_FIELDS, "trouser")}
          </Section>

          <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
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

const Section = ({ title, children }) => (
  <div>
    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
      {title}
    </h3>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {children}
    </div>
  </div>
);

export default MeasurementModal;
