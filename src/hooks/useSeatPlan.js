import { useState } from 'react';
import { generateId, getISOString, getDayKey } from '../utils/helpers';
import { INITIAL_ROOMS, INITIAL_SEATS } from '../constants';

export const useSeatPlan = () => {
    const [rooms, setRooms] = useState(INITIAL_ROOMS);
    const [seats, setSeats] = useState(INITIAL_SEATS);
    const [assignments, setAssignments] = useState({});
    const [unassignedStudents, setUnassignedStudents] = useState([]);

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

    const autoAssignSeats = (students, currentDate) => {
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

        const unassigned = [];

        presentStudents.forEach(student => {
            const alreadySeated = Object.values(newDayAssignments).includes(student.id);
            if (alreadySeated) return;

            const freeSeat = allSeatIds.find(sid => !newDayAssignments[sid]);

            if (freeSeat) {
                newDayAssignments[freeSeat] = student.id;
            } else {
                unassigned.push(student);
            }
        });

        setAssignments(prev => ({ ...prev, [dateKey]: newDayAssignments }));
        setUnassignedStudents(unassigned);
    };

    const clearDay = (currentDate) => {
        const dateKey = getISOString(currentDate);
        setAssignments(prev => {
            const next = { ...prev };
            delete next[dateKey];
            return next;
        });
        setUnassignedStudents([]);
    };

    const assignStudentToSeat = (dateKey, seatId, studentId) => {
        const newDay = { ...(assignments[dateKey] || {}) };
        if (studentId) {
            newDay[seatId] = studentId;
        } else {
            delete newDay[seatId];
        }
        setAssignments(prev => ({ ...prev, [dateKey]: newDay }));
    };

    return {
        rooms,
        setRooms,
        seats,
        setSeats,
        assignments,
        setAssignments,
        unassignedStudents,
        setUnassignedStudents,
        handleRoomUpdate,
        handleSeatUpdate,
        toggleSeatFeature,
        autoAssignSeats,
        clearDay,
        assignStudentToSeat
    };
};
