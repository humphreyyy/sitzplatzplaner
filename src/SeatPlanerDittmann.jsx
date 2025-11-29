import React, { useState, useEffect, useRef } from 'react';
import {
    Layout as LayoutGrid,
    Users,
    Calendar as CalendarDays,
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
    ArrowUp,
    Layout
} from 'lucide-react';
import { fetchData, saveData } from './apiService';
import FloorPlan from './components/FloorPlan';

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
    const [activeTab, setActiveTab] = useState('plan'); // 'editor', 'students', 'plan', 'week'
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
    const [showAddRoomModal, setShowAddRoomModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
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

    const changeWeek = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (offset * 7));
        setCurrentDate(newDate);
    };

    const getWeekRange = (date) => {
        const current = new Date(date);
        const day = current.getDay();
        const diff = current.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(current.setDate(diff));
        const week = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            week.push(d);
        }
        return week;
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
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Student zuweisen</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={currentAssignedStudentId || ''}
                            onChange={(e) => assignStudent(e.target.value || null)}
                        >
                            <option value="">Kein Student zugewiesen</option>
                            {availableStudents.map(student => (
                                <option key={student.id} value={student.id}>
                                    {student.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderWeekView = () => (
        <div className="p-8 text-center text-gray-500">
            <h2 className="text-xl font-bold mb-2">Wochenansicht</h2>
            <p>Diese Ansicht ist noch nicht implementiert.</p>
        </div>
    );

    const renderStudentManager = () => (
        <div className="p-8 text-center text-gray-500">
            <h2 className="text-xl font-bold mb-2">Schüler-Verwaltung</h2>
            <p>Diese Ansicht ist noch nicht implementiert.</p>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
            {/* Sidebar Navigation */}
            <div className="w-20 bg-white border-r flex flex-col items-center py-6 space-y-4 shadow-lg z-30">
                <div className="mb-6">
                    <img src="/logo.png" alt="Logo" className="h-10 w-10" />
                </div>
                <NavButton
                    icon={LayoutGrid}
                    label="Plan"
                    active={activeTab === 'plan'}
                    onClick={() => setActiveTab('plan')}
                />
                <NavButton
                    icon={CalendarDays}
                    label="Woche"
                    active={activeTab === 'week'}
                    onClick={() => setActiveTab('week')}
                />
                <NavButton
                    icon={Settings}
                    label="Editor"
                    active={activeTab === 'editor'}
                    onClick={() => setActiveTab('editor')}
                />
                <NavButton
                    icon={Users}
                    label="Schüler"
                    active={activeTab === 'students'}
                    onClick={() => setActiveTab('students')}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {activeTab === 'plan' && (
                    <>
                        {/* Header */}
                        <div className="bg-white h-16 border-b flex items-center justify-between px-6 shadow-sm z-10">
                            <div className="flex items-center space-x-4">
                                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="text-xl font-bold text-gray-800 flex items-center">
                                    <CalendarDays className="mr-2" size={24} />
                                    {formatDate(currentDate)}
                                </div>
                                <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <ChevronRight size={24} />
                                </button>
                                <button onClick={() => setCurrentDate(new Date())} className="text-sm text-blue-600 hover:underline ml-2">
                                    Heute
                                </button>
                            </div>

                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={autoAssignSeats}
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    <RefreshCw size={18} className="mr-2" /> Auto-Zuweisung
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Möchten Sie wirklich alle Zuweisungen für diesen Tag löschen?')) {
                                            clearDay();
                                        }
                                    }}
                                    className="flex items-center px-4 py-2 bg-white text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 size={18} className="mr-2" /> Leeren
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                    title="Drucken"
                                >
                                    <Printer size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Workspace */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Floor Plan Area */}
                            <div className="flex-1 relative bg-gray-100 overflow-hidden flex flex-col">
                                <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
                                    <div className="shadow-2xl bg-white min-w-[800px] min-h-[600px]">
                                        <FloorPlan
                                            rooms={rooms}
                                            seats={seats}
                                            assignments={assignments}
                                            students={students}
                                            currentDate={currentDate}
                                            activeTab={activeTab}
                                            selectedId={selectedId}
                                            onSelect={(id, type) => {
                                                setSelectedId(id);
                                                setSelectionType(type);
                                            }}
                                            onRoomsChange={setRooms}
                                            onSeatsChange={setSeats}
                                            readOnly={true}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Properties */}
                            <div className="w-80 bg-white border-l shadow-xl z-20 overflow-y-auto">
                                {renderPropertiesPanel()}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'week' && renderWeekView()}

                {activeTab === 'editor' && (
                    <div className="flex-1 flex flex-col h-full">
                        <div className="bg-white h-16 border-b flex items-center justify-between px-6 shadow-sm">
                            <h2 className="text-xl font-bold flex items-center">
                                <Settings className="mr-2" /> Editor-Modus
                            </h2>
                            <button
                                onClick={() => setShowAddRoomModal(true)}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow-sm"
                            >
                                <Plus size={18} className="mr-2" /> Raum hinzufügen
                            </button>
                        </div>
                        <div className="flex-1 flex overflow-hidden">
                            <div className="flex-1 overflow-auto p-8 relative bg-gray-100">
                                <div className="min-w-[800px] min-h-[600px] bg-white shadow-xl mx-auto relative" style={{ width: '100%', height: '100%' }}>
                                    <FloorPlan
                                        rooms={rooms}
                                        seats={seats}
                                        assignments={assignments}
                                        students={students}
                                        currentDate={currentDate}
                                        activeTab={activeTab}
                                        selectedId={selectedId}
                                        onSelect={(id, type) => {
                                            setSelectedId(id);
                                            setSelectionType(type);
                                        }}
                                        onRoomsChange={setRooms}
                                        onSeatsChange={setSeats}
                                        readOnly={false}
                                    />
                                </div>
                            </div>
                            <div className="w-80 bg-white border-l shadow-xl z-20 overflow-y-auto">
                                {renderPropertiesPanel()}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="flex-1 overflow-auto bg-gray-50">
                        {renderStudentManager()}
                    </div>
                )}
            </div>

            {showAddRoomModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="text-lg font-bold mb-4">Neuen Raum hinzufügen</h3>
                        <input
                            type="text"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            placeholder="Raum Name"
                            className="w-full p-2 border rounded mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowAddRoomModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={() => {
                                    if (newRoomName) {
                                        setRooms([...rooms, {
                                            id: generateId(),
                                            x: 100,
                                            y: 100,
                                            w: 200,
                                            h: 150,
                                            name: newRoomName,
                                            seatCount: 0
                                        }]);
                                        setNewRoomName('');
                                        setShowAddRoomModal(false);
                                    }
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Hinzufügen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const NavButton = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all ${active ? 'bg-blue-100 text-blue-800 shadow-inner' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
    >
        <Icon size={24} className="mb-1" />
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);
