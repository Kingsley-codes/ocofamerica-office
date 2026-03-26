export default function ProgressBar() {
  const progress = 72;

  return (
    <div className="bg-blue-800 text-white p-6 rounded shadow">
      <p className="text-center mb-2">Early Voting Starts This Week</p>

      <div className="text-center mb-2">
        <p>Amount Needed: $250,000</p>
        <p className="text-yellow-300">Raised: $180,000</p>
      </div>

      <div className="w-full bg-gray-300 rounded-full h-4">
        <div
          className="h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-center mt-2 font-bold">{progress}% FUNDED</p>
    </div>
  );
}
