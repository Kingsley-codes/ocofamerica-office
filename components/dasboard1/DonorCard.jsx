export default function DonorCard() {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-3 text-yellow-600">Donor Data</h3>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <select className="input">
          <option>Amount</option>
        </select>
        <select className="input">
          <option>State</option>
        </select>
        <select className="input">
          <option>City</option>
        </select>
        <select className="input">
          <option>Type</option>
        </select>
      </div>

      <button className="btn w-full">View Donors</button>
    </div>
  );
}
