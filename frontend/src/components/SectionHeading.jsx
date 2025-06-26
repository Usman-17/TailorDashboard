const SectionHeading = ({ title, subtitle }) => {
  return (
    <div className="mb-2">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>
      )}
    </div>
  );
};

export default SectionHeading;
