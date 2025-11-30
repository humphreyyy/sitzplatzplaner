import React, { useState, useEffect, useRef } from 'react';
import {
    Layout,
    Users,
    Calendar,
    Save,
    Plus,
    Printer,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Settings,
    Trash2
} from 'lucide-react';
import { fetchData, saveData } from './apiService';
import { COLORS } from './constants';
import { formatDate, generateId } from './utils/helpers';

import { useSeatPlan } from './hooks/useSeatPlan';
import { useStudents } from './hooks/useStudents';
import { useSelection } from './hooks/useSelection';

import FloorPlan from './components/FloorPlan';
import PropertiesPanel from './components/PropertiesPanel';
import StudentManager from './components/StudentManager';
import WeekView from './components/WeekView';
import PrintView from './components/PrintView';

export default function SeatPlaner() {
    // --- State ---
    const [activeTab, setActiveTab] = useState('plan'); // 'editor', 'students', 'plan', 'week'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showAddRoomModal, setShowAddRoomModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [printMode, setPrintMode] = useState(false);
    const [loaded, setLoaded] = useState(false);

    // --- Hooks ---
    const {
        rooms, setRooms,
        seats, setSeats,
        assignments, setAssignments,
        handleRoomUpdate,
        handleSeatUpdate,
        autoAssignSeats,
        clearDay,
        assignStudentToSeat
    } = useSeatPlan();

    const {
        students, setStudents,
        addStudent,
        removeStudent,
        updateStudentDays
    } = useStudents();

    const {
        selectedId, setSelectedId,
        selectionType, setSelectionType,
        selectItem,
        clearSelection
    } = useSelection();

    // --- Persistence ---
    useEffect(() => {
        fetchData()
            .then(data => {
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

        if (firstSave.current) {
            firstSave.current = false;
            return;
        }

        const data = { rooms, seats, students, assignments };

        saveData(data)
            .catch(err => console.error('Error saving data:', err));

    }, [rooms, seats, students, assignments, loaded]);

    // --- Handlers ---

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

    const handleAddRoom = () => {
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
    };

    const handleDeleteRoom = (roomId) => {
        setSeats(seats.filter(s => s.roomId !== roomId));
        setRooms(rooms.filter(r => r.id !== roomId));
    };

    const handleDeleteSeat = (seatId) => {
        setSeats(seats.filter(s => s.id !== seatId));
    };

    // --- Render ---

    if (printMode) {
        return (
            <PrintView
                currentDate={currentDate}
                students={students}
                assignments={assignments}
                rooms={rooms}
                seats={seats}
                onClose={() => setPrintMode(false)}
            />
        );
    }

    return (
        <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
            {/* Sidebar Navigation */}
            <div className="w-20 bg-white shadow-lg flex flex-col items-center py-6 z-20 space-y-4">
                <div className="mb-4 p-2 bg-blue-50 rounded-lg">
                    <Layout size={32} style={{ color: COLORS.primary }} />
                </div>

                <NavButton icon={Calendar} label="Plan" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
                <NavButton icon={Layout} label="Woche" active={activeTab === 'week'} onClick={() => setActiveTab('week')} />
                <NavButton icon={Users} label="Studenten" active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
                <NavButton icon={Settings} label="Editor" active={activeTab === 'editor'} onClick={() => setActiveTab('editor')} />

                <div className="flex-grow" />

                <NavButton icon={Save} label="Speichern" onClick={() => {
                    saveData({ rooms, seats, students, assignments })
                        .then(() => alert('Gespeichert!'))
                        .catch(err => alert('Fehler beim Speichern: ' + err));
                }} />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {activeTab === 'plan' && (
                    <>
                        {/* Header */}
                        <div className="bg-white h-16 border-b flex items-center justify-between px-6 shadow-sm z-10">
                            <div className="flex items-center space-x-4">
                                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="text-xl font-bold text-gray-800 flex items-center">
                                    <Calendar className="mr-2" size={24} />
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
                                    onClick={() => autoAssignSeats(students, currentDate)}
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    <RefreshCw size={18} className="mr-2" /> Auto-Zuweisung
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Möchten Sie wirklich alle Zuweisungen für diesen Tag löschen?')) {
                                            clearDay(currentDate);
                                        }
                                    }}
                                    className="flex items-center px-4 py-2 bg-white text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 size={18} className="mr-2" /> Leeren
                                </button>
                                <button
                                    onClick={() => setPrintMode(true)}
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
                                    <div className="shadow-2xl bg-white">
                                        <FloorPlan
                                            rooms={rooms}
                                            seats={seats}
                                            assignments={assignments}
                                            students={students}
                                            currentDate={currentDate}
                                            activeTab={activeTab}
                                            selectedId={selectedId}
                                            onSelect={selectItem}
                                            onRoomsChange={setRooms}
                                            onSeatsChange={setSeats}
                                            readOnly={false}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Properties */}
                            <div className="w-80 bg-white border-l shadow-xl z-20 overflow-y-auto">
                                <PropertiesPanel
                                    selectedId={selectedId}
                                    selectionType={selectionType}
                                    rooms={rooms}
                                    seats={seats}
                                    assignments={assignments}
                                    students={students}
                                    currentDate={currentDate}
                                    onRoomUpdate={handleRoomUpdate}
                                    onSeatUpdate={handleSeatUpdate}
                                    onDeleteRoom={handleDeleteRoom}
                                    onDeleteSeat={handleDeleteSeat}
                                    onAssignStudent={assignStudentToSeat}
                                    onClearSelection={clearSelection}
                                />
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'week' && (
                    <WeekView
                        currentDate={currentDate}
                        assignments={assignments}
                        students={students}
                        rooms={rooms}
                        seats={seats}
                        onChangeWeek={changeWeek}
                    />
                )}

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
                                        onSelect={selectItem}
                                        onRoomsChange={setRooms}
                                        onSeatsChange={setSeats}
                                        readOnly={false}
                                    />
                                </div>
                            </div>
                            <div className="w-80 bg-white border-l shadow-xl z-20 overflow-y-auto">
                                <PropertiesPanel
                                    selectedId={selectedId}
                                    selectionType={selectionType}
                                    rooms={rooms}
                                    seats={seats}
                                    assignments={assignments}
                                    students={students}
                                    currentDate={currentDate}
                                    onRoomUpdate={handleRoomUpdate}
                                    onSeatUpdate={handleSeatUpdate}
                                    onDeleteRoom={handleDeleteRoom}
                                    onDeleteSeat={handleDeleteSeat}
                                    onAssignStudent={assignStudentToSeat}
                                    onClearSelection={clearSelection}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="flex-1 overflow-auto bg-gray-50">
                        <StudentManager
                            students={students}
                            onAddStudent={addStudent}
                            onRemoveStudent={removeStudent}
                            onUpdateStudentDays={updateStudentDays}
                        />
                    </div>
                )}
            </div>

            {/* Modals */}
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
                                onClick={handleAddRoom}
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