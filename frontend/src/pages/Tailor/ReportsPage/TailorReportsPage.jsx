import { useState } from "react";

import SectionHeading from "../../../components/SectionHeading";

import MobileReportsPage from "./MobileReportsPage";
import DesktopReportsPage from "./DesktopReportsPage";

import { useTailorReports } from "../../../hooks/useTailorReports";
// Imports End---

const TailorReportsPage = () => {
  const [period, setPeriod] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const {
    periodLabel,
    summary,
    ordersByStatus,
    deliveryPerformance,
    expenseByCategory,
    paymentByMethod,
    monthlyRevenue,
    monthlyExpenses,
    isLoading,
  } = useTailorReports(
    period === "custom" ? "all" : period,
    customFrom,
    customTo,
  );

  const sharedProps = {
    period,
    setPeriod,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    periodLabel,
    summary,
    ordersByStatus,
    deliveryPerformance,
    expenseByCategory,
    paymentByMethod,
    monthlyRevenue,
    monthlyExpenses,
  };

  if (isLoading) {
    return (
      <>
        <SectionHeading
          title="Reports"
          subtitle="Business analytics and insights"
        />
        <div className="flex justify-end my-2 px-1">
          <div className="h-9 w-full sm:w-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 my-4 sm:my-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-gray-800 animate-pulse"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-6 sm:h-7 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 animate-pulse flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-14" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 my-4 sm:my-5">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-gray-800 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-5" />
              {[...Array(5)].map((_, j) => (
                <div key={j} className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="sm:hidden">
        <MobileReportsPage {...sharedProps} />
      </div>
      <div className="hidden sm:block">
        <DesktopReportsPage {...sharedProps} />
      </div>
    </>
  );
};

export default TailorReportsPage;
