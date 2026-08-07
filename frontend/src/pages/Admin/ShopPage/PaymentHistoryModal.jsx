import dayjs from "dayjs";
import { Wallet, Calendar, CalendarCheck, CreditCard, User, Hash } from "lucide-react";
import FullScreenModal from "../../../components/FullScreenModal";

const planLabel = (plan) => {
  const map = {
    monthly: "Monthly Plan",
    quarterly: "Quarterly Plan",
    "half-yearly": "Half Yearly Plan",
    yearly: "Yearly Plan",
    custom: "Custom Plan",
  };
  return map[plan] || plan;
};

const PaymentHistoryModal = ({ shop, open, onClose, data, isLoading }) => {
  if (!shop) return null;

  return (
    <FullScreenModal
      open={open}
      onClose={onClose}
      title="Payment History"
      subtitle={shop.name}
      showClose
    >
      <div className="px-0 pb-6">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--secondary-color)]" />
          </div>
        ) : data?.payments?.length === 0 ? (
          <p className="text-center text-gray-400 py-10">
            No payments recorded yet
          </p>
        ) : (
          <div className="space-y-3">
            {data?.payments?.map((p) => (
              <div
                key={p._id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Icon + Amount + Plan */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  <div className="w-9 h-9 rounded-full bg-[var(--secondary-color)]/10 flex items-center justify-center shrink-0">
                    <Wallet size={15} className="text-[var(--secondary-color)]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Rs. {p.amount.toLocaleString()}</p>
                    <p className="text-xs text-[var(--secondary-color)] font-medium">{planLabel(p.subscriptionPlan)}</p>
                  </div>
                </div>

                <div className="w-px h-8 bg-gray-200 shrink-0" />

                {/* Payment Date */}
                <div className="flex items-center gap-1.5 min-w-[110px]">
                  <Calendar size={13} className="text-[var(--secondary-color)] shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none">Payment Date</p>
                    <p className="text-xs font-medium text-gray-800">{dayjs(p.createdAt).format("DD MMM YYYY")}</p>
                  </div>
                </div>

                <div className="w-px h-8 bg-gray-200 shrink-0" />

                {/* Expiry */}
                <div className="flex items-center gap-1.5 min-w-[110px]">
                  <CalendarCheck size={13} className="text-[var(--secondary-color)] shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none">Expiry</p>
                    <p className="text-xs font-medium text-gray-800">{p.newExpiry ? dayjs(p.newExpiry).format("DD MMM YYYY") : "—"}</p>
                  </div>
                </div>

                <div className="w-px h-8 bg-gray-200 shrink-0" />

                {/* Method */}
                <div className="flex items-center gap-1.5 min-w-[80px]">
                  <CreditCard size={13} className="text-[var(--secondary-color)] shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none">Method</p>
                    <p className="text-xs font-medium text-gray-800 capitalize">{p.paymentMethod || "—"}</p>
                  </div>
                </div>

                <div className="w-px h-8 bg-gray-200 shrink-0" />

                {/* Received By */}
                <div className="flex items-center gap-1.5 min-w-[120px]">
                  <User size={13} className="text-[var(--secondary-color)] shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none">Received By</p>
                    <p className="text-xs font-medium text-gray-800">{p.recordedBy?.fullName || "Admin"}</p>
                  </div>
                </div>

                <div className="w-px h-8 bg-gray-200 shrink-0" />

                {/* Reference */}
                <div className="flex items-center gap-1.5 flex-1">
                  <Hash size={13} className="text-[var(--secondary-color)] shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none">Reference</p>
                    <p className="text-xs font-medium text-gray-800">{p.referenceNo || "—"}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-100 px-3 py-1 rounded-full shrink-0">
                  Paid
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </FullScreenModal>
  );
};

export default PaymentHistoryModal;
