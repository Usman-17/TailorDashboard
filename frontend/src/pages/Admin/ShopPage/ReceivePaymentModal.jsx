import dayjs from "dayjs";
import { useState, useEffect } from "react";

import FullScreenModal from "../../../components/FullScreenModal";
import CustomSelect from "../../../components/CustomSelect";
import CustomInput from "../../../components/CustomInput";
// Imports End----

const PLAN_PRICES = {
  monthly: 1000,
  quarterly: 2500,
  "half-yearly": 4500,
  yearly: 8000,
};

const PLAN_MONTHS = {
  monthly: 1,
  quarterly: 3,
  "half-yearly": 6,
  yearly: 12,
};

const ReceivePaymentModal = ({ shop, open, onClose, onSubmit, isPending }) => {
  const getInitialPlanPrice = (plan, shopAmt) => {
    return PLAN_PRICES[plan] || shopAmt || 1000;
  };

  const [form, setForm] = useState({
    subscriptionPlan: shop?.subscriptionPlan || "monthly",
    amount: getInitialPlanPrice(
      shop?.subscriptionPlan,
      shop?.subscriptionAmount,
    ),
    paymentMethod: "cash",
    referenceNo: "",
    notes: "",
  });

  useEffect(() => {
    if (shop) {
      const plan = shop.subscriptionPlan || "monthly";
      setForm({
        subscriptionPlan: plan,
        amount: getInitialPlanPrice(plan, shop.subscriptionAmount),
        paymentMethod: "cash",
        referenceNo: "",
        notes: "",
      });
    }
  }, [shop]);

  if (!shop) return null;

  const handlePlanChange = (val) => {
    const defaultPrice = PLAN_PRICES[val] || 0;
    setForm((prev) => ({
      ...prev,
      subscriptionPlan: val,
      amount: defaultPrice,
    }));
  };

  const currentPlanPrice =
    PLAN_PRICES[form.subscriptionPlan] || shop.subscriptionAmount || 0;

  const now = dayjs();
  const currentExpiryDate = shop.subscriptionExpiry
    ? dayjs(shop.subscriptionExpiry)
    : null;
  const startFrom =
    currentExpiryDate && currentExpiryDate.isAfter(now)
      ? currentExpiryDate
      : now;
  const monthsToAdd = PLAN_MONTHS[form.subscriptionPlan] || 1;
  const calculatedNewExpiry = startFrom
    .add(monthsToAdd, "month")
    .format("DD MMM YYYY");

  return (
    <FullScreenModal
      open={open}
      onClose={onClose}
      title="Receive Payment"
      subtitle={shop.name}
      showClose={false}
      actions={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending || !form.amount}
            onClick={() => onSubmit(form)}
            className="px-5 py-2 text-sm bg-[var(--secondary-color)] text-white rounded-full hover:opacity-90 transition cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Processing..." : "Receive Payment"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4 px-6">
        <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Shop</span>
            <p className="font-medium text-gray-900">{shop.name}</p>
          </div>
          <div>
            <span className="text-gray-500">Current Plan</span>
            <p className="font-medium text-gray-900 capitalize">
              {shop.subscriptionPlan}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Current Expiry</span>
            <p className="font-medium text-gray-900">
              {shop.subscriptionExpiry
                ? dayjs(shop.subscriptionExpiry).format("DD MMM YYYY")
                : "N/A"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">New Expiry</span>
            <p className="font-semibold text-green-600">
              {calculatedNewExpiry}
            </p>
          </div>
        </div>

        <hr className="border-gray-200" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomSelect
            id="subscriptionPlan"
            label="Renew Plan"
            required
            value={form.subscriptionPlan}
            onChange={handlePlanChange}
            options={[
              { label: "Monthly", value: "monthly" },
              { label: "Quarterly (3 Months)", value: "quarterly" },
              { label: "Half Yearly (6 Months)", value: "half-yearly" },
              { label: "Yearly (12 Months)", value: "yearly" },
            ]}
            allowClear={false}
          />
          <CustomInput
            id="subscriptionAmount"
            label="Subscription Amount (Rs.)"
            type="number"
            value={currentPlanPrice}
            disabled
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomInput
            id="amount"
            label="Payment Received (Rs.)"
            type="number"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0"
          />
          <CustomSelect
            id="paymentMethod"
            label="Payment Method"
            value={form.paymentMethod}
            onChange={(val) => setForm({ ...form, paymentMethod: val })}
            options={[
              { label: "Cash", value: "cash" },
              { label: "JazzCash", value: "jazzcash" },
              { label: "EasyPaisa", value: "easypaisa" },
              { label: "Bank Transfer", value: "bank" },
              { label: "Other", value: "other" },
            ]}
            allowClear={false}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomInput
            id="referenceNo"
            label="Reference No"
            value={form.referenceNo}
            onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
            placeholder="Optional"
          />
          <CustomInput
            id="notes"
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional"
          />
        </div>
      </div>
    </FullScreenModal>
  );
};

export default ReceivePaymentModal;
