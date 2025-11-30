import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { getISOString } from '../utils/helpers';
import Room from './Room';
import Seat from './Seat';

const FloorPlan = ({
    rooms,
    seats,
    assignments,
    students,
    currentDate,
    activeTab,
    selectedId,
    onSelect,
    onRoomsChange,
    onSeatsChange,
    readOnly = false
}) => {
    const [draggedItem, setDraggedItem] = useState(null);
    const [resizing, setResizing] = useState(null);

    const dateKey = getISOString(currentDate);
    const dayAssignments = assignments[dateKey] || {};

    // Calculate content size
    const contentHeight = Math.max(
        ...rooms.map(r => r.y + r.h),
        ...seats.map(s => s.y + 60), // Seats are 60x60
        0
    );
    const minHeight = Math.max(500, contentHeight + 100);

    const contentWidth = Math.max(
        ...rooms.map(r => r.x + r.w),
        ...seats.map(s => s.x + 60),
        0
    );
    const minWidth = Math.max(800, contentWidth + 100);

    // --- Drag & Drop Handlers ---

    const handleDragStart = (e, type, item) => {
        setDraggedItem({ type, item, startX: e.clientX, startY: e.clientY });
        if (activeTab === 'editor') {
            onSelect(item.id, type);
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
                onRoomsChange(rooms.map(r => r.id === draggedItem.item.id ? { ...r, x: r.x + deltaX, y: r.y + deltaY } : r));

                // Move seats with room
                const roomSeats = seats.filter(s => s.roomId === draggedItem.item.id);
                if (roomSeats.length > 0) {
                    onSeatsChange(seats.map(s => {
                        if (s.roomId === draggedItem.item.id) {
                            return { ...s, x: s.x + deltaX, y: s.y + deltaY };
                        }
                        return s;
                    }));
                }

            } else if (draggedItem.type === 'seat') {
                onSeatsChange(seats.map(s => s.id === draggedItem.item.id ? { ...s, x: s.x + deltaX, y: s.y + deltaY } : s));
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

            onRoomsChange(rooms.map(r => r.id === resizing.roomId ? { ...r, x: newX, y: newY, w: newW, h: newH } : r));
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
    }, [resizing, rooms, onRoomsChange]);


    return (
        <div
            className="relative bg-white border-2 border-gray-200 overflow-hidden shadow-inner"
            style={{ width: '100%', height: '100%', minHeight: `${minHeight}px`, minWidth: `${minWidth}px`, cursor: readOnly ? 'default' : 'default' }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => {
                if (activeTab === 'editor' || activeTab === 'plan') {
                    onSelect(null, null);
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
                    <Room
                        key={room.id}
                        room={room}
                        seatCount={seats.filter(s => s.roomId === room.id).length}
                        isSelected={isSelected}
                        readOnly={readOnly}
                        activeTab={activeTab}
                        onClick={(r) => onSelect(r.id, 'room')}
                        onDragStart={handleDragStart}
                        onResizeStart={handleResizeStart}
                    />
                );
            })}

            {/* Seats */}
            {seats.map(seat => {
                const studentId = dayAssignments[seat.id];
                const student = students.find(s => s.id === studentId);
                const isSelected = (activeTab === 'editor' || activeTab === 'plan') && selectedId === seat.id;

                return (
                    <Seat
                        key={seat.id}
                        seat={seat}
                        student={student}
                        isSelected={isSelected}
                        readOnly={readOnly}
                        onClick={(id) => {
                            if (activeTab === 'editor') {
                                onSelect(id, 'seat');
                            } else {
                                onSelect(id, 'seat-assignment');
                            }
                        }}
                        onDragStart={handleDragStart}
                    />
                );
            })}
        </div>
    );
};

export default FloorPlan;
