import { FaMapMarkerAlt } from "react-icons/fa";

export default function LargeSigns() {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-3">Large Signs</h3>

      <div className="bg-gray-200 h-32 flex items-center justify-center rounded mb-3">
        <FaMapMarkerAlt size={30} />
      </div>

      <button className="btn w-full">Location Tracker</button>
    </div>
  );
}
