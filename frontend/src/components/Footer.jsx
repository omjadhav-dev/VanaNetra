import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

function Footer() {
  return (
    <footer className="border-t border-[#202b25] bg-[#080c0a]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Leaf size={16} className="text-emerald-500" />
          <p className="text-sm text-gray-500">
            © 2026 ForestWatch. Geospatial deforestation intelligence.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <Link to="/" className="text-sm text-gray-500 transition hover:text-white">
            Home
          </Link>
          <Link to="/analyze" className="text-sm text-gray-500 transition hover:text-white">
            Analyze
          </Link>
          <Link to="/login" className="text-sm text-gray-500 transition hover:text-white">
            Officials
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
