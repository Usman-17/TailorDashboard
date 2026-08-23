const MobileDashboardSkeleton = () => (
  <div className="py-2 space-y-5 animate-pulse">
    {/* 3 Summary Stat Cards Skeleton */}
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 items-stretch">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="w-full h-[110px] p-3 rounded-2xl bg-gray-100 dark:bg-[#141025] border border-gray-200/60 dark:border-gray-800/80 flex flex-col justify-between items-start"
        >
          <div className="size-8 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="w-full space-y-1.5">
            <div className="h-6 w-12 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      ))}
    </div>

    {/* Quick Actions Skeleton: Row 1 (3 items) & Row 2 (2 items) */}
    <div className="space-y-3">
      <div className="px-1">
        <div className="h-5 w-28 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="space-y-2.5 sm:space-y-3.5">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 items-stretch">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-full h-[110px] p-2.5 sm:p-3 rounded-2xl bg-gray-100 dark:bg-[#141025] border border-gray-200/60 dark:border-gray-800/80 flex flex-col items-center justify-between"
            >
              <div className="flex-1 flex items-center justify-center pt-1">
                <div className="size-9 rounded-xl bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-3 w-14 rounded bg-gray-200 dark:bg-gray-700 mb-1" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 items-stretch">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="w-full h-[100px] p-2.5 sm:p-3 rounded-2xl bg-gray-100 dark:bg-[#141025] border border-gray-200/60 dark:border-gray-800/80 flex flex-col items-center justify-between"
            >
              <div className="flex-1 flex items-center justify-center pt-1">
                <div className="size-9 rounded-xl bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-3 w-14 rounded bg-gray-200 dark:bg-gray-700 mb-1" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Recent Orders Skeleton */}
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between px-1">
        <div className="h-5 w-28 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3.5 w-14 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="space-y-2.5">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-gray-200/60 dark:border-gray-800/80 bg-white dark:bg-[#141025] flex items-center justify-between"
          >
            <div className="space-y-2 flex-1 pr-3">
              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center gap-2">
                <div className="h-4 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-3.5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-3.5 w-28 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="h-8 w-24 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default MobileDashboardSkeleton;
