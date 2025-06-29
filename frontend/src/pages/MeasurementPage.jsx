import { Undo } from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import CustomButton from "../components/CustomButton";
import SectionHeading from "../components/SectionHeading";
import MeasurementSkeleton from "../components/Skeletons/MeasurementSkeleton";

const MeasurementPage = () => {
  const { customerId } = useParams();

  const {
    data: measurement,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["measurement", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/measurements/${customerId}`);
      if (!res.ok) throw new Error("Failed to fetch measurement");
      return res.json();
    },
    retry: false,
  });

  if (isLoading) return <MeasurementSkeleton />;
  if (isError)
    return <div className="text-red-500 p-4">Error: {error.message}</div>;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <SectionHeading
          title="Customer Measurement Details"
          subtitle="Here are the recorded measurements for this customer"
        />

        <div className="sm:w-auto w-full">
          <CustomButton
            title="Manage All Measurements"
            to="/customer/manage"
            Icon={Undo}
          />
        </div>
      </div>

      {/* Customer Detail */}
      {isLoading ? (
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-6 animate-pulse">
          <div className="flex flex-col sm:flex-row gap-0 sm:gap-10">
            <div className="h-4 w-1/6 bg-gray-300 rounded " />
            <div className="h-4 w-1/6 bg-gray-300 rounded" />
          </div>
        </div>
      ) : (
        measurement.customer.name &&
        measurement.customer.phone && (
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 sm:p-4 mb-6 text-nowrap">
            <div className="flex flex-col sm:flex-row gap-0 sm:gap-10">
              <div className="flex items-center gap-1 sm:gap-2 text-sm text-gray-700">
                <span className="font-medium">Name:</span>
                <span>{measurement?.customer.name}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-sm text-gray-700 mt-1 sm:mt-0">
                <span className="font-medium">Phone:</span>
                <span>{measurement?.customer.phone}</span>
              </div>
            </div>
          </div>
        )
      )}

      {/* Measurement Fields */}
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-1 sm:gap-4">
        <div className="border border-gray-200 rounded-md p-3">
          <p className="text-sm text-gray-500 font-medium capitalize">Length</p>
          <p className="text-md font-semibold text-gray-800">
            {measurement.length}
          </p>
        </div>

        <div className="border border-gray-200 rounded-md p-3">
          <p className="text-sm text-gray-500 font-medium capitalize">
            Shoulder
          </p>
          <p className="text-md font-semibold text-gray-800">
            {measurement.shoulder}
          </p>
        </div>

        <div className="border border-gray-200 rounded-md p-3">
          <p className="text-sm text-gray-500 font-medium capitalize">Chest</p>
          <p className="text-md font-semibold text-gray-800">
            {measurement.chest}
          </p>
        </div>

        <div className="border border-gray-200 rounded-md p-3">
          <p className="text-sm text-gray-500 font-medium capitalize">Waist</p>
          <p className="text-md font-semibold text-gray-800">
            {measurement.waist}
          </p>
        </div>

        <div className="border border-gray-200 rounded-md p-3">
          <p className="text-sm text-gray-500 font-medium capitalize">Hip</p>
          <p className="text-md font-semibold text-gray-800">
            {measurement.hip}
          </p>
        </div>

        <div className="border border-gray-200 rounded-md p-3">
          <p className="text-sm text-gray-500 font-medium capitalize">Neck</p>
          <p className="text-md font-semibold text-gray-800">
            {measurement.neck}
          </p>
        </div>

        <div className="border border-gray-200 rounded-md p-3">
          <p className="text-sm text-gray-500 font-medium capitalize">
            Sleeve Length
          </p>
          <p className="text-md font-semibold text-gray-800">
            {measurement.sleeveLength}
          </p>
        </div>

        <div className="border border-gray-200 rounded-md p-3">
          <p className="text-sm text-gray-500 font-medium capitalize">Wrist</p>
          <p className="text-md font-semibold text-gray-800">
            {measurement.wrist}
          </p>
        </div>

        <div className="border border-gray-200 rounded-md p-3">
          <p className="text-sm text-gray-500 font-medium capitalize">Bicep</p>
          <p className="text-md font-semibold text-gray-800">
            {measurement.bicep}
          </p>
        </div>

        <div className="border border-gray-200 rounded-md p-3">
          <p className="text-sm text-gray-500 font-medium capitalize">
            Shalwar Length
          </p>
          <p className="text-md font-semibold text-gray-800">
            {measurement.shalwarLength}
          </p>
        </div>

        <div className="border border-gray-200 rounded-md p-3">
          <p className="text-sm text-gray-500 font-medium capitalize">Thigh</p>
          <p className="text-md font-semibold text-gray-800">
            {measurement.thigh}
          </p>
        </div>

        <div className="border border-gray-200 rounded-md p-3">
          <p className="text-sm text-gray-500 font-medium capitalize">Knee</p>
          <p className="text-md font-semibold text-gray-800">
            {measurement.knee}
          </p>
        </div>

        <div className="border border-gray-200 rounded-md p-3">
          <p className="text-sm text-gray-500 font-medium capitalize">Bottom</p>
          <p className="text-md font-semibold text-gray-800">
            {measurement.bottom}
          </p>
        </div>

        <div className="border border-gray-200 rounded-md p-3">
          <p className="text-sm text-gray-500 font-medium capitalize">
            Pant Waist
          </p>
          <p className="text-md font-semibold text-gray-800">
            {measurement.pantWaist}
          </p>
        </div>
      </div>
    </>
  );
};

export default MeasurementPage;
