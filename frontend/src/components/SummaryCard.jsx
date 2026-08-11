const SummaryCard = ({
  // eslint-disable-next-line no-unused-vars
  icon: Icon,
  title,
  count,
  color,
  active,
  isSelected,
  onClick,
}) => {
  const isActive = active || isSelected;
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#17102a] shadow-md rounded-xl p-3 sm:p-5 flex items-center gap-3 sm:gap-4 border-l-4 transition-all duration-200 min-w-0 ${
        onClick ? "cursor-pointer hover:shadow-lg" : ""
      }`}
      style={{
        borderColor: color,
        boxShadow: isActive ? `0 0 0 2px ${color}40` : undefined,
      }}
    >
      <div
        className={`p-2 sm:p-3 rounded-full shrink-0`}
        style={{ backgroundColor: `${color}1A`, color }}
      >
        <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
      </div>
      <div className="min-w-0">
        <h4 className="text-gray-600 dark:text-gray-300 text-[11px] sm:text-sm leading-tight">
          {title}
        </h4>
        <p className="text-lg sm:text-2xl font-bold truncate" style={{ color }}>
          {count}
        </p>
      </div>
    </div>
  );
};

export default SummaryCard;
