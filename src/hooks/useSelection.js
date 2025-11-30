import { useState } from 'react';

export const useSelection = () => {
    const [selectedId, setSelectedId] = useState(null);
    const [selectionType, setSelectionType] = useState(null); // 'room' or 'seat' or 'seat-assignment'

    const selectItem = (id, type) => {
        setSelectedId(id);
        setSelectionType(type);
    };

    const clearSelection = () => {
        setSelectedId(null);
        setSelectionType(null);
    };

    return {
        selectedId,
        setSelectedId,
        selectionType,
        setSelectionType,
        selectItem,
        clearSelection
    };
};
