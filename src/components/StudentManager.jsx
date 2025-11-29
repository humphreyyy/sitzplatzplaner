import React from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
import { COLORS, WEEKDAYS } from '../constants';

const StudentManager = ({
    students,
    onAddStudent,
    onRemoveStudent,
    onUpdateStudentDays
}) => {
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md border-t-4" style={{ borderColor: COLORS.primary }}>
                <h2 className="text-xl font-bold mb-4 flex items-center" style={{ color: COLORS.primary }}>
                    <Users className="mr-2" /> Studenten & Anwesenheit
                </h2>

                <div className="grid gap-4 mb-8">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            id="newStudentName"
                            placeholder="Name des Studenten (z.B. Max Mustermann)"
                            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={() => {
                                const input = document.getElementById('newStudentName');
                                if (input.value) {
                                    onAddStudent(input.value);
                                    input.value = '';
                                }
                            }}
                            className="text-white px-4 py-2 rounded flex items-center"
                            style={{ backgroundColor: COLORS.primary }}
                        >
                            <Plus size={18} className="mr-1" /> Hinzufügen
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600 text-sm">
                                <th className="p-3">Name</th>
                                {WEEKDAYS.map(d => <th key={d.key} className="p-3 text-center">{d.key}</th>)}
                                <th className="p-3 text-right">Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-3 font-medium">{student.name}</td>
                                    {WEEKDAYS.map(day => (
                                        <td key={day.key} className="p-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={student.days.includes(day.key)}
                                                onChange={(e) => onUpdateStudentDays(student.id, day.key, e.target.checked)}
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                        </td>
                                    ))}
                                    <td className="p-3 text-right">
                                        <button
                                            onClick={() => onRemoveStudent(student.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-4 text-center text-gray-400">Keine Studenten angelegt.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentManager;
