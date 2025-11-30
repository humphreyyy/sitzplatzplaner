import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { WEEKDAYS } from '../constants';
import { getISOString, getWeekRange } from '../utils/helpers';

const WeekView = ({
    currentDate,
    assignments,
    students,
    rooms,
    seats,
    onChangeWeek
}) => {
    const weekDates = getWeekRange(currentDate);
    const monday = weekDates[0];
    const friday = weekDates[4];

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Week Navigation */}
            <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-4">
                    <button onClick={() => onChangeWeek(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="text-xl font-bold text-gray-800 flex items-center">
                        <Calendar className="mr-2" size={24} />
                        {monday.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })} - {friday.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <button onClick={() => onChangeWeek(1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            {/* Week Table */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="p-4 border-b font-bold sticky top-0 bg-gray-100 z-10">Student</th>
                                {weekDates.map((date, index) => (
                                    <th key={index} className="p-4 border-b font-bold sticky top-0 bg-gray-100 z-10 w-1/6">
                                        <div className="flex flex-col">
                                            <span>{WEEKDAYS[index].label}</span>
                                            <span className="text-xs font-normal text-gray-500">
                                                {date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-medium border-r bg-white sticky left-0 z-10">{student.name}</td>
                                    {weekDates.map((date, index) => {
                                        const dayKey = WEEKDAYS[index].key;
                                        const dateKey = getISOString(date);
                                        const isPresent = student.days && student.days.includes(dayKey);

                                        // Find assignment
                                        let assignedRoomName = null;
                                        let assignedSeatId = null;

                                        if (assignments[dateKey]) {
                                            // assignments[dateKey] is { seatId: studentId }
                                            // We need to find the seatId for this student
                                            assignedSeatId = Object.keys(assignments[dateKey]).find(
                                                sid => assignments[dateKey][sid] === student.id
                                            );

                                            if (assignedSeatId) {
                                                const seat = seats.find(s => s.id === assignedSeatId);
                                                if (seat) {
                                                    const room = rooms.find(r => r.id === seat.roomId);
                                                    assignedRoomName = room ? room.name : 'Unbekannter Raum';
                                                }
                                            }
                                        }

                                        return (
                                            <td key={index} className={`p-4 border-r last:border-r-0 ${!isPresent ? 'bg-gray-100 text-gray-400' : ''}`}>
                                                {!isPresent ? (
                                                    <span className="text-xs italic">-</span>
                                                ) : (
                                                    assignedRoomName ? (
                                                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium border border-blue-200">
                                                            {assignedRoomName}
                                                        </div>
                                                    ) : (
                                                        <span className="text-red-400 text-sm italic">Nicht zugewiesen</span>
                                                    )
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400">Keine Studenten vorhanden.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WeekView;
