import Skeleton from "react-loading-skeleton";

const MeasurementSkeleton = () => {
  return (
    <>
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="w-1/2">
          <Skeleton height={28} />
          <Skeleton width={250} height={18} className="mt-2" />
        </div>
        <div className="sm:w-auto w-full">
          <Skeleton height={40} />
        </div>
      </div>

      {/* Customer Info Skeleton */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-0 sm:gap-10">
          <Skeleton width={150} height={10} />
          <Skeleton width={150} height={10} />
        </div>
      </div>

      {/* Measurement Fields Skeleton */}
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-1 sm:gap-4">
        {Array.from({ length: 14 }).map((_, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded-md p-3 space-y-2"
          >
            <Skeleton width={80} height={12} />
            <Skeleton width={60} height={18} />
          </div>
        ))}
      </div>
    </>
  );
};

export default MeasurementSkeleton;
