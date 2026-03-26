import { FaUserPlus, FaPhone, FaMap, FaEnvelope } from "react-icons/fa";

export default function ActionButtons() {
  return (
    <div className="flex gap-4">
      <button className="btn bg-red-600">
        <FaUserPlus /> Add Volunteer
      </button>
      <button className="btn bg-blue-600">
        <FaPhone /> Start Phone Bank
      </button>
      <button className="btn bg-blue-600">
        <FaMap /> Create Walk List
      </button>
      <button className="btn bg-blue-600">
        <FaEnvelope /> Send Email Blast
      </button>
    </div>
  );
}
