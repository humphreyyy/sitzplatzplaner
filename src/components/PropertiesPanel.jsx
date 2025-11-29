import React from 'react';
import { Layout, Settings, Trash2, Users, Check, Monitor, Sun, ArrowUp } from 'lucide-react';
import { COLORS, SEAT_FEATURES } from '../constants';
import { getISOString, getDayKey } from '../utils/helpers';

const PropertiesPanel = ({
    selectedId,
    selectionType,
    rooms,
    seats,
    assignments,
    students,
    currentDate,
    onRoomUpdate,
    onSeatUpdate,
    onDeleteRoom,
    onDeleteSeat,
    onAssignStudent,
    onClearSelection
}) => {
    if (!selectedId || !selectionType) {
        return (
            <div className="p-6 text-center text-gray-400">
                <Settings size={48} className="mx-auto mb-4 opacity-20" />
                <p>Wählen Sie einen Raum oder Sitzplatz aus, um Eigenschaften zu bearbeiten.</p>
            </div>
        );
    }

    if (selectionType === 'room') {
        const room = rooms.find(r => r.id === selectedId);
        if (!room) return null;
        return (
            <div className="p-4">
                <h3 className="text-lg font-bold mb-4 border-b pb-2 flex items-center" style={{ color: COLORS.primary }}>
                    <Layout size={18} className="mr-2" /> Raum bearbeiten
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bezeichnung</label>
                        <input
                            type="text"
                            value={room.name}
                            onChange={(e) => onRoomUpdate(room.id, 'name', e.target.value)}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Breite (px)</label>
                            <input
                                type="number"
                                value={room.w}
                                onChange={(e) => onRoomUpdate(room.id, 'w', parseInt(e.target.value) || 50)}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Höhe (px)</label>
                            <input
                                type="number"
                                value={room.h}
                                onChange={(e) => onRoomUpdate(room.id, 'h', parseInt(e.target.value) || 50)}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Anzahl Plätze (Auto-Generierung)</label>
                        <div className="flex items-center">
                            <input
                                type="number"
                                min="0"
                                value={seats.filter(s => s.roomId === room.id).length}
                                onChange={(e) => onRoomUpdate(room.id, 'seatCount', e.target.value)}
                                className="w-20 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none mr-2"
                            />
                            <span className="text-xs text-gray-500">Plätze im Raum</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Ändern der Zahl fügt automatisch Sitzplätze hinzu oder entfernt sie.
                        </p>
                    </div>

                    <div className="pt-4 border-t">
                        <button
                            onClick={() => {
                                onDeleteRoom(room.id);
                                onClearSelection();
                            }}
                            className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 flex justify-center items-center"
                        >
                            <Trash2 size={16} className="mr-2" /> Raum löschen
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (selectionType === 'seat') {
        const seat = seats.find(s => s.id === selectedId);
        if (!seat) return null;
        return (
            <div className="p-4">
                <h3 className="text-lg font-bold mb-4 border-b pb-2 flex items-center" style={{ color: COLORS.primary }}>
                    <Settings size={18} className="mr-2" /> Sitzplatz-Details
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ausstattung</label>
                        <div className="space-y-2">
                            {SEAT_FEATURES.map(feat => (
                                <label key={feat.id} className="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={(seat.features || []).includes(feat.id)}
                                        onChange={() => onSeatUpdate(seat.id, feat.id)} // This needs to be handled by parent or passed correct updater
                                        className="mr-3 h-4 w-4 text-blue-600 rounded"
                                    />
                                    <feat.icon size={16} className="mr-2 text-gray-500" />
                                    <span className="text-sm">{feat.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <button
                            onClick={() => {
                                onDeleteSeat(seat.id);
                                onClearSelection();
                            }}
                            className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 flex justify-center items-center"
                        >
                            <Trash2 size={16} className="mr-2" /> Sitzplatz löschen
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (selectionType === 'seat-assignment') {
        const seat = seats.find(s => s.id === selectedId);
        if (!seat) return null;

        const dateKey = getISOString(currentDate);
        const dayOfWeek = getDayKey(currentDate);
        const currentAssignedStudentId = assignments[dateKey]?.[seat.id];
        const currentStudent = students.find(s => s.id === currentAssignedStudentId);

        // Filter students who are present today AND not assigned to another seat
        const presentStudents = students.filter(s => s.days && s.days.includes(dayOfWeek));
        const assignedStudentIds = Object.values(assignments[dateKey] || {});
        const availableStudents = presentStudents.filter(s =>
            !assignedStudentIds.includes(s.id) || s.id === currentAssignedStudentId
        );

        return (
            <div className="p-4">
                <h3 className="text-lg font-bold mb-4 border-b pb-2 flex items-center" style={{ color: COLORS.primary }}>
                    <Users size={18} className="mr-2" /> Platz-Zuweisung
                </h3>

                <div className="mb-4 p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-500 mb-1">Aktuell zugewiesen:</div>
                    {currentStudent ? (
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-green-700">{currentStudent.name}</span>
                            <button
                                onClick={() => onAssignStudent(dateKey, seat.id, null)}
                                className="text-red-500 hover:text-red-700 text-xs border border-red-200 px-2 py-1 rounded bg-white"
                            >
                                Entfernen
                            </button>
                        </div>
                    ) : (
                        <span className="text-gray-400 italic">Leer</span>
                    )}
                </div>

                <h4 className="font-bold text-sm mb-2">Verfügbare Studenten</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {availableStudents.length === 0 ? (
                        <p className="text-sm text-gray-400">Keine Studenten verfügbar.</p>
                    ) : (
                        availableStudents.map(student => {
                            const isAssignedHere = student.id === currentAssignedStudentId;
                            return (
                                <button
                                    key={student.id}
                                    onClick={() => onAssignStudent(dateKey, seat.id, student.id)}
                                    disabled={isAssignedHere}
                                    className={`w-full text-left p-2 rounded border flex justify-between items-center ${isAssignedHere
                                        ? 'bg-green-50 border-green-200 text-green-800 cursor-default'
                                        : 'hover:bg-blue-50 hover:border-blue-300'
                                        }`}
                                >
                                    <span>{student.name}</span>
                                    {isAssignedHere && <Check size={14} />}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export default PropertiesPanel;
