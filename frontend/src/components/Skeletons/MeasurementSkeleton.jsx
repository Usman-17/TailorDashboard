import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useTheme } from "../../context/ThemeContext";

const MeasurementSkeleton = () => {
  const { isDarkMode } = useTheme();

  return (
    <SkeletonTheme
      baseColor={isDarkMode ? "#1e1935" : "#e5e7eb"}
      highlightColor={isDarkMode ? "#2e2650" : "#f3f4f6"}
    >
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
        <div className="bg-gray-50 dark:bg-[#18142a] border border-gray-200 dark:border-purple-500/20 rounded-lg p-4 mb-6">
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
              className="border border-gray-200 dark:border-purple-500/20 dark:bg-[#18142a] rounded-md p-3 space-y-2"
            >
              <Skeleton width={80} height={12} />
              <Skeleton width={60} height={18} />
            </div>
          ))}
        </div>
      </>
    </SkeletonTheme>
  );
};

export default MeasurementSkeleton;
