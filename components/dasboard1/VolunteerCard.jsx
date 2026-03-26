export default function VolunteerCard() {
  const tasks = [
    "Canvassing",
    "Phone Banking",
    "Petition Gathering",
    "Events",
    "Sign Waving",
    "Email",
  ];

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-3 text-red-600">Volunteer Assignments</h3>

      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task}>
            <input type="checkbox" className="mr-2" />
            {task}
          </li>
        ))}
      </ul>

      <button className="mt-4 bg-red-600 text-white px-4 py-2 rounded">
        Assign Task
      </button>
    </div>
  );
}
