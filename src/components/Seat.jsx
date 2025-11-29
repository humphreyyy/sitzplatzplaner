import React from 'react';
import { Move, Monitor, Sun, ArrowUp } from 'lucide-react';
import { COLORS } from '../constants';

const Seat = ({
    seat,
    student,
    isSelected,
    readOnly,
    onClick,
    onDragStart
}) => {
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
            draggable={!readOnly}
            onClick={(e) => { e.stopPropagation(); onClick(seat.id); }}
            onDragStart={(e) => onDragStart(e, 'seat', seat)}
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
};

export default Seat;
