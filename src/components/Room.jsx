import React from 'react';
import { COLORS } from '../constants';

const Room = ({
    room,
    seatCount,
    isSelected,
    readOnly,
    activeTab,
    onClick,
    onDragStart,
    onResizeStart
}) => {
    return (
        <div
            draggable={!readOnly}
            onClick={(e) => { e.stopPropagation(); onClick(room); }}
            onDragStart={(e) => onDragStart(e, 'room', room)}
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
                <span className="text-xs font-normal opacity-50">{seatCount} Plätze</span>
            </div>

            {isSelected && !readOnly && activeTab === 'editor' && (
                <>
                    {/* Resize Handles */}
                    {['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map(handle => (
                        <div
                            key={handle}
                            onMouseDown={(e) => onResizeStart(e, room, handle)}
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
};

export default Room;
