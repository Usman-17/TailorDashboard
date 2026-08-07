import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useTheme } from "../../context/ThemeContext";

const DashboardSkeleton = () => {
  const { isDarkMode } = useTheme();

  return (
    <SkeletonTheme
      baseColor={isDarkMode ? "#1e1935" : "#e5e7eb"}
      highlightColor={isDarkMode ? "#2e2650" : "#f3f4f6"}
    >
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div>
          <Skeleton width={200} height={24} />
          <Skeleton width={320} height={14} className="mt-1" />
        </div>

        {/* 7 Cards Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 dark:border-purple-500/20 bg-white dark:bg-[#18142a] p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <Skeleton circle width={36} height={36} />
              </div>
              <div className="mt-3">
                <Skeleton width="60%" height={12} />
                <Skeleton width="80%" height={22} className="mt-1" />
                <Skeleton width="50%" height={10} className="mt-1" />
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Chart Skeleton */}
        <div className="rounded-2xl border border-gray-200 dark:border-purple-500/20 bg-white dark:bg-[#18142a] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Skeleton width={160} height={18} />
              <Skeleton width={240} height={12} className="mt-1" />
            </div>
          </div>
          <Skeleton height={320} className="rounded-xl" />
        </div>

        {/* 2 Bottom Widgets Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments Widget Skeleton */}
          <div className="rounded-2xl border border-gray-200 dark:border-purple-500/20 bg-white dark:bg-[#18142a] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-purple-500/10">
              <div className="flex items-center gap-2">
                <Skeleton circle width={34} height={34} />
                <div>
                  <Skeleton width={130} height={16} />
                  <Skeleton width={180} height={12} className="mt-0.5" />
                </div>
              </div>
              <Skeleton width={70} height={14} />
            </div>
            <div className="divide-y divide-gray-100 dark:divide-purple-500/10 mt-3 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <div>
                    <Skeleton width={120} height={14} />
                    <Skeleton width={90} height={10} className="mt-1" />
                  </div>
                  <div className="text-right">
                    <Skeleton width={70} height={14} />
                    <Skeleton width={50} height={12} className="mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Renewals Widget Skeleton */}
          <div className="rounded-2xl border border-gray-200 dark:border-purple-500/20 bg-white dark:bg-[#18142a] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-purple-500/10">
              <div className="flex items-center gap-2">
                <Skeleton circle width={34} height={34} />
                <div>
                  <Skeleton width={150} height={16} />
                  <Skeleton width={190} height={12} className="mt-0.5" />
                </div>
              </div>
              <Skeleton width={80} height={14} />
            </div>
            <div className="divide-y divide-gray-100 dark:divide-purple-500/10 mt-3 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <div>
                    <Skeleton width={110} height={14} />
                    <Skeleton width={140} height={10} className="mt-1" />
                  </div>
                  <div className="text-right">
                    <Skeleton width={80} height={14} />
                    <Skeleton width={60} height={12} className="mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
};

export default DashboardSkeleton;
