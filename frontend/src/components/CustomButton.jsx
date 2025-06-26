import { Link } from "react-router-dom";

const CustomButton = ({ to, title, Icon }) => {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 px-5 py-2 rounded bg-black hover:bg-neutral-900 text-sm transition cursor-pointer text-white"
    >
      {Icon && <Icon size={18} />}
      {title}
    </Link>
  );
};

export default CustomButton;
