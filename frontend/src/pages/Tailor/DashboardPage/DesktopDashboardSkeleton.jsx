const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
  />
);

const DesktopDashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-5"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="w-16 h-3" />
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton className="w-20 h-3" />
            <Skeleton className="w-12 h-7" />
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-4 flex items-center gap-3"
        >
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="w-14 h-3" />
            <Skeleton className="w-8 h-5" />
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-5">
        <Skeleton className="w-32 h-4 mb-4" />
        <Skeleton className="w-full h-[350px] rounded-lg" />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-5">
        <Skeleton className="w-32 h-4 mb-4" />
        <Skeleton className="w-full h-[280px] rounded-full" />
      </div>
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <Skeleton className="w-36 h-4" />
          </div>
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex items-center gap-4">
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-16 h-4" />
                <Skeleton className="w-14 h-4" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <Skeleton className="w-32 h-4" />
      </div>
      <div className="p-5 space-y-3">
        {[...Array(4)].map((_, j) => (
          <div key={j} className="flex items-center gap-4">
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-20 h-4" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default DesktopDashboardSkeleton;
