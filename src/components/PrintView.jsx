import React from 'react';
import { Printer, Monitor, Sun, ArrowUp } from 'lucide-react';
import { COLORS } from '../constants';
import { formatDate, getISOString, getDayKey } from '../utils/helpers';
import FloorPlan from './FloorPlan';

const PrintView = ({
    currentDate,
    students,
    assignments,
    rooms,
    seats,
    onClose
}) => {
    const dateKey = getISOString(currentDate);
    const dayOfWeek = getDayKey(currentDate);
    const workingStudents = students.filter(s => s.days.includes(dayOfWeek));

    return (
        <div className="fixed inset-0 bg-white z-50 overflow-auto p-8" style={{ color: COLORS.text }}>
            <div className="flex justify-between items-start mb-8 border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: COLORS.primary }}>Sitzplan: {formatDate(currentDate)}</h1>
                    <p className="text-gray-500 mt-2">Dittmann+Ingenieure</p>
                </div>
                <div className="text-right">
                    <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded shadow mb-2 print:hidden flex items-center ml-auto">
                        <Printer size={18} className="mr-2" /> Drucken / PDF
                    </button>
                    <button onClick={onClose} className="text-gray-600 underline text-sm print:hidden">
                        Zurück zur App
                    </button>
                </div>
            </div>

            <div className="mb-8">
                <FloorPlan
                    rooms={rooms}
                    seats={seats}
                    assignments={assignments}
                    students={students}
                    currentDate={currentDate}
                    activeTab="plan" // Force plan mode for correct rendering
                    selectedId={null}
                    onSelect={() => { }}
                    onRoomsChange={() => { }}
                    onSeatsChange={() => { }}
                    readOnly={true}
                />
            </div>

            <div className="grid grid-cols-2 gap-8 text-sm">
                <div>
                    <h3 className="font-bold border-b mb-2">Anwesende Studenten ({workingStudents.length})</h3>
                    <ul className="list-disc pl-5">
                        {workingStudents.map(s => {
                            const assigned = Object.values(assignments[dateKey] || {}).includes(s.id);
                            return (
                                <li key={s.id} className={assigned ? 'text-green-700' : 'text-red-600 font-bold'}>
                                    {s.name} {assigned ? '' : '(Kein Platz!)'}
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold border-b mb-2">Legende</h3>
                    <div className="flex gap-4 text-xs mb-4">
                        <span className="flex items-center"><Monitor size={12} className="mr-1" /> 2 Monitore</span>
                        <span className="flex items-center"><Sun size={12} className="mr-1" /> Fenster</span>
                        <span className="flex items-center"><ArrowUp size={12} className="mr-1" /> Stehplatz</span>
                    </div>
                    <div className="h-16 border border-gray-200 rounded p-2 text-gray-400 italic">Notizen...</div>
                </div>
            </div>
        </div>
    );
};

export default PrintView;
