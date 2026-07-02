import { useState } from "react";

interface CalendarProps {
  checkInDates: Set<string>;
}

export default function Calendar({ checkInDates }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const isCheckedIn = (day: number): boolean => {
    if (!day) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
    return checkInDates.has(dateStr);
  };

  const isToday = (day: number): boolean => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">{monthName}</h3>
        <div className="flex gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 rounded transition-colors"
            title="Previous month"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 rounded transition-colors"
            title="Next month"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week, weekIdx) =>
          week.map((day, dayIdx) => (
            <div
              key={`${weekIdx}-${dayIdx}`}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-default ${
                day === null
                  ? ""
                  : isCheckedIn(day)
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300 ring-2 ring-offset-0 ring-emerald-300"
                    : isToday(day)
                      ? "border-2 border-slate-400 text-slate-900 ring-2 ring-offset-1 ring-slate-400"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              {day}
            </div>
          ))
        )}
      </div>

      <div className="mt-6 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300"></div>
          <span className="text-slate-700">Check-in</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-slate-400"></div>
          <span className="text-slate-700">Today</span>
        </div>
      </div>
    </div>
  );
}
