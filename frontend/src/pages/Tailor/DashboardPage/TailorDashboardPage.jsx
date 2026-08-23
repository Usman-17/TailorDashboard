import MobileDashboardView from "./MobileDashboardView";
import DesktopDashboardView from "./DesktopDashboardView";

const TailorDashboardPage = () => {
  return (
    <div className="dashboard-page">
      {/* Mobile View: Quick Actions, 3 Stats, Recent Orders */}
      <div className="block md:hidden">
        <MobileDashboardView />
      </div>

      {/* Desktop View: Full Analytics, Charts, Deliveries & Orders */}
      <div className="hidden md:block">
        <DesktopDashboardView />
      </div>
    </div>
  );
};

export default TailorDashboardPage;
