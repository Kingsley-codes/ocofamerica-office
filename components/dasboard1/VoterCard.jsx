import { FaMapMarkerAlt } from "react-icons/fa";

export default function VoterCard() {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-3">Voter Data</h3>

      <div className="flex gap-2 mb-2">
        <button className="btn">Filter & Sort</button>
        <button className="btn flex items-center gap-1">
          <FaMapMarkerAlt /> Create Map
        </button>
      </div>

      <button className="btn w-full">Generate Walk List</button>
    </div>
  );
}
