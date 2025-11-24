import React, { useState, useEffect, useRef } from 'react';
import {
    Layout,
    Users,
    Calendar,
    Save,
    Download,
    Plus,
    Trash2,
    RotateCcw,
    RotateCw,
    Move,
    Check,
    Printer,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    RefreshCw,
    Settings,
    Monitor,
    Sun,
    ArrowUp
} from 'lucide-react';
import { fetchData, saveData } from './apiService';

// --- Constants & Styles ---

const COLORS = {
    primary: '#1e3a5f',    // Dittmann Blue
    accent: '#e31e24',     // Warning Red
    light: '#a8c5dd',      // Light Blue
    room: '#e8f4f8',       // Room Fill
    seatFree: '#c8e6c9',   // Green
    seatOccupied: '#fff9c4', // Yellow
    seatConflict: '#ffcdd2', // Red
    text: '#1f2937',
    white: '#ffffff',
    selection: '#2563eb'   // Bright Blue for selection border
};

const WEEKDAYS = [
    { key: 'Mo', label: 'Montag' },
    { key: 'Di', label: 'Dienstag' },
    { key: 'Mi', label: 'Mittwoch' },
    { key: 'Do', label: 'Donnerstag' },
    { key: 'Fr', label: 'Freitag' },
];

const SEAT_FEATURES = [
    { id: 'dual_monitor', label: '2 Monitore', icon: Monitor },
    { id: 'window', label: 'Fensterplatz', icon: Sun },
    { id: 'standing', label: 'Stehschreibtisch', icon: ArrowUp },
];

const INITIAL_ROOMS = [
    { id: 'r1', x: 50, y: 50, w: 300, h: 250, name: 'Büro 101', seatCount: 2 },
];
const INITIAL_SEATS = [
    { id: 's1', x: 80, y: 90, roomId: 'r1', features: ['dual_monitor'] },
    { id: 's2', x: 150, y: 90, roomId: 'r1', features: [] },
];

// --- Helper Functions ---

const generateId = () => Math.random().toString(36).substr(2, 9);

const getDayKey = (date) => {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return days[date.getDay()];
};

const formatDate = (date) => {
    return date.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const getISOString = (date) => date.toISOString().split('T')[0];

// --- Components ---

export default function SeatPlaner() {
    // --- State ---
    const [activeTab, setActiveTab] = useState('plan'); // 'editor', 'students', 'plan'
    const [rooms, setRooms] = useState(INITIAL_ROOMS);
    const [seats, setSeats] = useState(INITIAL_SEATS);
    const [students, setStudents] = useState([]);
    const [assignments, setAssignments] = useState({});

    const [currentDate, setCurrentDate] = useState(new Date());

    // Selection State for Editor
    const [selectedId, setSelectedId] = useState(null); // ID of room or seat
    const [selectionType, setSelectionType] = useState(null); // 'room' or 'seat' or 'seat-assignment'

    const [draggedItem, setDraggedItem] = useState(null);
    const [resizing, setResizing] = useState(null); // { roomId, handle, startX, startY, startW, startH, startRoomX, startRoomY }
    const [printMode, setPrintMode] = useState(false);

    // --- Persistence ---
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetchData()
            .then(data => {
                // Handle potential error from IPC
                if (data.error) {
                    console.error(data.error);
                    return;
                }
                setRooms(data.rooms || []);
                setSeats(data.seats || []);
                setStudents(data.students || []);
                setAssignments(data.assignments || {});
                setLoaded(true);
            })
            .catch(err => console.error('Error fetching data:', err));
    }, []);

    const firstSave = useRef(true);

    useEffect(() => {
        if (!loaded) return;

        // Skip the first save after loading (which is just the initial state being "restored")
        if (firstSave.current) {
            firstSave.current = false;
            return;
        }

        const data = { rooms, seats, students, assignments };

        // Use the service wrapper
        saveData(data)
            .catch(err => console.error('Error saving data:', err));

    }, [rooms, seats, students, assignments, loaded]);

    // --- Logic: Room & Seat Management ---

    const handleRoomUpdate = (id, field, value) => {
        if (field === 'seatCount') {
            const newCount = parseInt(value, 10);
            if (isNaN(newCount) || newCount < 0) return;

            const room = rooms.find(r => r.id === id);
            const currentRoomSeats = seats.filter(s => s.roomId === id);
            const diff = newCount - currentRoomSeats.length;

            if (diff > 0) {
                // Add seats
                const newSeats = [];
                for (let i = 0; i < diff; i++) {
                    // Simple grid layout logic
                    const idx = currentRoomSeats.length + i;
                    const cols = 3;
                    const offsetX = 30 + (idx % cols) * 70;
                    const offsetY = 40 + Math.floor(idx / cols) * 70;

                    newSeats.push({
                        id: generateId(),
                        x: room.x + offsetX,
                        y: room.y + offsetY,
                        roomId: id,
                        features: []
                    });
                }
                setSeats([...seats, ...newSeats]);
            } else if (diff < 0) {
                // Remove seats (remove the last added ones first)
                const seatsToRemove = currentRoomSeats.slice(diff); // diff is negative, so this takes from end
                const idsToRemove = seatsToRemove.map(s => s.id);
                setSeats(seats.filter(s => !idsToRemove.includes(s.id)));
            }
        }

        setRooms(rooms.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSeatUpdate = (id, field, value) => {
        setSeats(seats.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const toggleSeatFeature = (seatId, featureId) => {
        const seat = seats.find(s => s.id === seatId);
        if (!seat) return;

        const currentFeatures = seat.features || [];
        const newFeatures = currentFeatures.includes(featureId)
            ? currentFeatures.filter(f => f !== featureId)
            : [...currentFeatures, featureId];

        handleSeatUpdate(seatId, 'features', newFeatures);
    };

    // --- Algorithms ---

    const autoAssignSeats = () => {
        const dateKey = getISOString(currentDate);
        const dayOfWeek = getDayKey(currentDate);

        const presentStudents = students.filter(s => s.days && s.days.includes(dayOfWeek));
        let newDayAssignments = { ...assignments[dateKey] } || {};
        const allSeatIds = seats.map(s => s.id);

        // Cleanup invalid
        Object.keys(newDayAssignments).forEach(seatId => {
            const studentId = newDayAssignments[seatId];
            const student = students.find(s => s.id === studentId);
            if (!student || !student.days.includes(dayOfWeek)) {
                delete newDayAssignments[seatId];
            }
        });

        const unassignedStudents = [];

        presentStudents.forEach(student => {
            const alreadySeated = Object.values(newDayAssignments).includes(student.id);
            if (alreadySeated) return;

            const freeSeat = allSeatIds.find(sid => !newDayAssignments[sid]);

            if (freeSeat) {
                newDayAssignments[freeSeat] = student.id;
            } else {
                unassignedStudents.push(student);
            }
        });

        setAssignments(prev => ({ ...prev, [dateKey]: newDayAssignments }));

        if (unassignedStudents.length > 0) {
            alert(`${unassignedStudents.length} Studenten ohne Platz.`);
        }
    };

    const clearDay = () => {
        const dateKey = getISOString(currentDate);
        setAssignments(prev => {
            const next = { ...prev };
            delete next[dateKey];
            return next;
        });
    };

    const changeDate = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + offset);
        setCurrentDate(newDate);
    };

    // --- Handlers ---

    const handleDragStart = (e, type, item) => {
        setDraggedItem({ type, item, startX: e.clientX, startY: e.clientY });
        if (activeTab === 'editor') {
            setSelectedId(item.id);
            setSelectionType(type);
        }
    };

    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = (e) => {
        e.preventDefault();
        if (!draggedItem) return;

        if (activeTab === 'editor') {
            const deltaX = e.clientX - draggedItem.startX;
            const deltaY = e.clientY - draggedItem.startY;

            if (draggedItem.type === 'room') {
                setRooms(rooms.map(r => r.id === draggedItem.item.id ? { ...r, x: r.x + deltaX, y: r.y + deltaY } : r));
                // Optional: Move seats with room? For now, we keep seats absolute as per previous request, 
                // but normally one would update seat coordinates here too.
                // Let's implement simple relative move for better UX:
                const roomSeats = seats.filter(s => s.roomId === draggedItem.item.id);
                if (roomSeats.length > 0) {
                    setSeats(seats.map(s => {
                        if (s.roomId === draggedItem.item.id) {
                            return { ...s, x: s.x + deltaX, y: s.y + deltaY };
                        }
                        return s;
                    }));
                }

            } else if (draggedItem.type === 'seat') {
                setSeats(seats.map(s => s.id === draggedItem.item.id ? { ...s, x: s.x + deltaX, y: s.y + deltaY } : s));
            }
        }
        setDraggedItem(null);
    };

    // --- Resizing Logic ---

    const handleResizeStart = (e, room, handle) => {
        e.stopPropagation(); // Prevent drag start
        setResizing({
            roomId: room.id,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            startW: room.w,
            startH: room.h,
            startRoomX: room.x,
            startRoomY: room.y
        });
    };

    useEffect(() => {
        const handleResizeMove = (e) => {
            if (!resizing) return;

            const deltaX = e.clientX - resizing.startX;
            const deltaY = e.clientY - resizing.startY;

            let newW = resizing.startW;
            let newH = resizing.startH;
            let newX = resizing.startRoomX;
            let newY = resizing.startRoomY;

            // Minimum size
            const minSize = 50;

            if (resizing.handle.includes('e')) {
                newW = Math.max(minSize, resizing.startW + deltaX);
            }
            if (resizing.handle.includes('w')) {
                const proposedW = resizing.startW - deltaX;
                if (proposedW >= minSize) {
                    newW = proposedW;
                    newX = resizing.startRoomX + deltaX;
                }
            }
            if (resizing.handle.includes('s')) {
                newH = Math.max(minSize, resizing.startH + deltaY);
            }
            if (resizing.handle.includes('n')) {
                const proposedH = resizing.startH - deltaY;
                if (proposedH >= minSize) {
                    newH = proposedH;
                    newY = resizing.startRoomY + deltaY;
                }
            }

            setRooms(rooms.map(r => r.id === resizing.roomId ? { ...r, x: newX, y: newY, w: newW, h: newH } : r));
        };

        const handleResizeEnd = () => {
            if (resizing) {
                setResizing(null);
            }
        };

        if (resizing) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [resizing, rooms]);

    const handleSeatClick = (seatId) => {
        if (activeTab === 'editor') {
            setSelectedId(seatId);
            setSelectionType('seat');
            return;
        }

        // Planning Logic
        setSelectedId(seatId);
        setSelectionType('seat-assignment');
    };

    const handleRoomClick = (room) => {
        if (activeTab === 'editor') {
            setSelectedId(room.id);
            setSelectionType('room');
        }
    };

    // --- Renderers ---

    const renderPropertiesPanel = () => {
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
                                onChange={(e) => handleRoomUpdate(room.id, 'name', e.target.value)}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Breite (px)</label>
                                <input
                                    type="number"
                                    value={room.w}
                                    onChange={(e) => handleRoomUpdate(room.id, 'w', parseInt(e.target.value) || 50)}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Höhe (px)</label>
                                <input
                                    type="number"
                                    value={room.h}
                                    onChange={(e) => handleRoomUpdate(room.id, 'h', parseInt(e.target.value) || 50)}
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
                                    onChange={(e) => handleRoomUpdate(room.id, 'seatCount', e.target.value)}
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
                                    setSeats(seats.filter(s => s.roomId !== room.id));
                                    setRooms(rooms.filter(r => r.id !== room.id));
                                    setSelectedId(null);
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
                                            onChange={() => toggleSeatFeature(seat.id, feat.id)}
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
                                    setSeats(seats.filter(s => s.id !== seat.id));
                                    setSelectedId(null);
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

            const assignStudent = (studentId) => {
                const newDay = { ...(assignments[dateKey] || {}) };
                if (studentId) {
                    newDay[seat.id] = studentId;
                } else {
                    delete newDay[seat.id];
                }
                setAssignments({ ...assignments, [dateKey]: newDay });
            };

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
                                    onClick={() => assignStudent(null)}
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
                                        onClick={() => assignStudent(student.id)}
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
    };

    const renderFloorPlan = (readOnly = false) => {
        const dateKey = getISOString(currentDate);
        const dayAssignments = assignments[dateKey] || {};

        return (
            <div
                className="relative bg-white border-2 border-gray-200 overflow-hidden shadow-inner"
                style={{ width: '100%', height: '500px', cursor: readOnly ? 'default' : 'default' }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => {
                    if (activeTab === 'editor' || activeTab === 'plan') {
                        setSelectedId(null);
                        setSelectionType(null);
                    }
                }}
            >
                {/* Grid Background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: `radial-gradient(${COLORS.primary} 1px, transparent 1px)`, backgroundSize: '20px 20px' }}>
                </div>

                {/* Rooms */}
                {rooms.map(room => {
                    const isSelected = (activeTab === 'editor' || activeTab === 'plan') && selectedId === room.id;
                    return (
                        <div
                            key={room.id}
                            draggable={!readOnly}
                            onClick={(e) => { e.stopPropagation(); handleRoomClick(room); }}
                            onDragStart={(e) => handleDragStart(e, 'room', room)}
                            className={`absolute border-2 flex items-start justify-center pt-2 font-bold text-gray-500 select-none transition-shadow ${isSelected ? 'ring-2 ring-blue-400 z-10' : ''}`}
                            style={{
                                left: room.x,
                                top: room.y,
                                width: room.w,
                                height: room.h,
                                borderColor: isSelected ? COLORS.selection : COLORS.light,
                                backgroundColor: COLORS.room,
                                zIndex: 1,
                                cursor: !readOnly ? 'move' : 'default'
                            }}
                        >
                            <div className="flex flex-col items-center">
                                <span>{room.name}</span>
                                <span className="text-xs font-normal opacity-50">{seats.filter(s => s.roomId === room.id).length} Plätze</span>
                            </div>

                            {isSelected && !readOnly && activeTab === 'editor' && (
                                <>
                                    {/* Resize Handles */}
                                    {['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map(handle => (
                                        <div
                                            key={handle}
                                            onMouseDown={(e) => handleResizeStart(e, room, handle)}
                                            className="absolute bg-blue-500 border border-white w-3 h-3 rounded-full z-20"
                                            style={{
                                                cursor: `${handle}-resize`,
                                                top: handle.includes('n') ? -6 : handle.includes('s') ? '100%' : '50%',
                                                left: handle.includes('w') ? -6 : handle.includes('e') ? '100%' : '50%',
                                                transform: 'translate(-50%, -50%)',
                                                marginTop: handle.includes('s') ? 0 : 0 // Adjustment if needed
                                            }}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    );
                })}

                {/* Seats */}
                {seats.map(seat => {
                    const studentId = dayAssignments[seat.id];
                    const student = students.find(s => s.id === studentId);
                    const isSelected = (activeTab === 'editor' || activeTab === 'plan') && selectedId === seat.id;

                    let bgColor = COLORS.seatFree;
                    let borderColor = '#81c784';

                    if (student) {
                        bgColor = COLORS.seatOccupied;
                        borderColor = '#fdd835';
                    }
                    if (isSelected) {
                        borderColor = COLORS.selection;
                    }

                    // Feature Icons
                    const features = seat.features || [];

                    return (
                        <div
                            key={seat.id}
                            draggable={!readOnly}
                            onClick={(e) => { e.stopPropagation(); handleSeatClick(seat.id); }}
                            onDragStart={(e) => handleDragStart(e, 'seat', seat)}
                            className={`absolute rounded-md shadow-sm flex flex-col items-center justify-center text-xs text-center select-none transition-all ${!readOnly ? 'cursor-pointer' : ''} ${isSelected ? 'shadow-lg scale-105' : ''}`}
                            style={{
                                left: seat.x,
                                top: seat.y,
                                width: 60,
                                height: 60,
                                backgroundColor: bgColor,
                                border: `2px solid ${borderColor}`,
                                zIndex: 10,
                                color: COLORS.text
                            }}
                            title={readOnly ? (student ? student.name : 'Frei') : 'Sitzplatz bearbeiten'}
                        >
                            {readOnly ? (
                                student ? (
                                    <>
                                        <div className="font-bold truncate w-full px-1">{student.name}</div>
                                    </>
                                ) : <span className="text-gray-400">Frei</span>
                            ) : (
                                <>
                                    <Move size={14} className="opacity-50 mb-1" />
                                    <span className="text-[10px] text-gray-500 leading-tight">Platz</span>
                                </>
                            )}

                            {/* Feature Indicators */}
                            <div className="absolute -bottom-2 flex space-x-1">
                                {features.includes('dual_monitor') && <div className="bg-blue-100 text-blue-600 p-0.5 rounded-full border border-blue-200"><Monitor size={10} /></div>}
                                {features.includes('window') && <div className="bg-yellow-100 text-yellow-600 p-0.5 rounded-full border border-yellow-200"><Sun size={10} /></div>}
                                {features.includes('standing') && <div className="bg-green-100 text-green-600 p-0.5 rounded-full border border-green-200"><ArrowUp size={10} /></div>}
                            </div>

                        </div>
                    );
                })}
            </div>
        );
    };

    const renderStudentManager = () => (
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
                                    setStudents([...students, { id: generateId(), name: input.value, days: ['Mo', 'Mi', 'Fr'] }]);
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
                                                onChange={(e) => {
                                                    const newDays = e.target.checked
                                                        ? [...student.days, day.key]
                                                        : student.days.filter(d => d !== day.key);
                                                    setStudents(students.map(s => s.id === student.id ? { ...s, days: newDays } : s));
                                                }}
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                        </td>
                                    ))}
                                    <td className="p-3 text-right">
                                        <button
                                            onClick={() => setStudents(students.filter(s => s.id !== student.id))}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-400">Keine Studenten eingetragen.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderPrintView = () => {
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
                        <button onClick={() => setPrintMode(false)} className="text-gray-600 underline text-sm print:hidden">
                            Zurück zur App
                        </button>
                    </div>
                </div>

                <div className="mb-8">
                    {renderFloorPlan(true)}
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

    if (printMode) return renderPrintView();

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
            {/* Header */}
            <header className="text-white shadow-lg" style={{ backgroundColor: COLORS.primary }}>
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-bold text-xl" style={{ color: COLORS.primary }}>D</div>
                        <h1 className="text-xl font-bold tracking-wide">SeatPlaner <span className="font-light opacity-80">Dittmann</span></h1>
                    </div>
                    <nav className="flex space-x-1 bg-white/10 rounded-lg p-1">
                        {[
                            { id: 'plan', icon: Calendar, label: 'Wochenplan' },
                            { id: 'students', icon: Users, label: 'Studenten' },
                            { id: 'editor', icon: Layout, label: 'Grundriss' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center px-4 py-2 rounded-md transition-all ${activeTab === tab.id ? 'bg-white shadow-sm font-bold' : 'hover:bg-white/20 text-blue-100'}`}
                                style={{ color: activeTab === tab.id ? COLORS.primary : undefined }}
                            >
                                <tab.icon size={18} className="mr-2" /> {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto p-4">

                {/* VIEW: PLANUNG */}
                {activeTab === 'plan' && (
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="lg:w-3/4 flex flex-col gap-4">
                            {/* Toolbar */}
                            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap justify-between items-center gap-4">
                                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                    <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white rounded shadow-sm"><ChevronLeft size={20} /></button>
                                    <div className="px-4 font-bold min-w-[200px] text-center">
                                        {formatDate(currentDate)}
                                    </div>
                                    <button onClick={() => changeDate(1)} className="p-2 hover:bg-white rounded shadow-sm"><ChevronRight size={20} /></button>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={autoAssignSeats}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow"
                                        style={{ backgroundColor: COLORS.primary }}
                                    >
                                        <RefreshCw size={18} className="mr-2" /> Auto-Zuteilung
                                    </button>
                                    <button
                                        onClick={clearDay}
                                        className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition shadow-sm"
                                    >
                                        <RotateCcw size={18} className="mr-2" /> Leeren
                                    </button>
                                    <button
                                        onClick={() => setPrintMode(true)}
                                        className="flex items-center px-4 py-2 text-white rounded transition shadow ml-2"
                                        style={{ backgroundColor: COLORS.accent }}
                                    >
                                        <Download size={18} className="mr-2" /> PDF
                                    </button>
                                </div>
                            </div>

                            {/* Floor Plan Area */}
                            <div className="bg-white p-1 rounded-lg shadow-lg border border-gray-200">
                                {renderFloorPlan()}
                            </div>
                        </div>

                        {/* Sidebar: Properties & Info */}
                        <div className="lg:w-1/4 flex flex-col gap-4">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="font-bold mb-2 text-gray-700 flex items-center">
                                    <AlertTriangle size={16} className="mr-2 text-orange-500" /> Konflikte
                                </h3>
                                <p className="text-sm text-gray-500">Keine Konflikte erkannt.</p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                {renderPropertiesPanel()}
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: STUDENTEN */}
                {activeTab === 'students' && renderStudentManager()}

                {/* VIEW: EDITOR */}
                {activeTab === 'editor' && (
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="lg:w-3/4">
                            <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex justify-between items-center">
                                <h2 className="font-bold text-lg flex items-center">
                                    <Layout size={20} className="mr-2" /> Layout-Editor
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            const name = prompt("Raumname:");
                                            if (name) {
                                                setRooms([...rooms, { id: generateId(), x: 50, y: 50, w: 200, h: 150, name, seatCount: 0 }]);
                                            }
                                        }}
                                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
                                    >
                                        + Raum
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white p-1 rounded-lg shadow-lg border-2 border-blue-100">
                                {renderFloorPlan()}
                            </div>
                        </div>

                        <div className="lg:w-1/4">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                {renderPropertiesPanel()}
                            </div>
                        </div>

                    </div>
                )}

            </main>
        </div>
    );
}