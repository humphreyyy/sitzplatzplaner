import { useState } from 'react';
import { generateId } from '../utils/helpers';

export const useStudents = () => {
    const [students, setStudents] = useState([]);

    const addStudent = (name) => {
        if (!name) return;
        setStudents([...students, { id: generateId(), name, days: ['Mo', 'Mi', 'Fr'] }]);
    };

    const removeStudent = (id) => {
        setStudents(students.filter(s => s.id !== id));
    };

    const updateStudentDays = (id, dayKey, isChecked) => {
        setStudents(students.map(s => {
            if (s.id !== id) return s;
            const newDays = isChecked
                ? [...s.days, dayKey]
                : s.days.filter(d => d !== dayKey);
            return { ...s, days: newDays };
        }));
    };

    return {
        students,
        setStudents,
        addStudent,
        removeStudent,
        updateStudentDays
    };
};
