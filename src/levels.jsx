import { useState } from "react";

export default function Levels() {
  const [completed, setCompleted] = useState([]);

  const levels = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `Level ${i + 1}`,
  }));

  const toggleComplete = (id) => {
    if (completed.includes(id)) {
      setCompleted(completed.filter((lvl) => lvl !== id));
    } else {
      setCompleted([...completed, id]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-indigo-400">
        Levels Dashboard 🚀
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {levels.map((level) => {
          const isDone = completed.includes(level.id);

          return (
            <div
              key={level.id}
              onClick={() => toggleComplete(level.id)}
              className={`p-6 rounded-xl cursor-pointer transition text-center font-semibold
                ${
                  isDone
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }
              `}
            >
              {level.title}
              <div className="mt-2 text-sm">
                {isDone ? "✅ Completed" : "Click to Complete"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}