import { Monitor, Sun, ArrowUp } from 'lucide-react';

export const COLORS = {
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

export const WEEKDAYS = [
    { key: 'Mo', label: 'Montag' },
    { key: 'Di', label: 'Dienstag' },
    { key: 'Mi', label: 'Mittwoch' },
    { key: 'Do', label: 'Donnerstag' },
    { key: 'Fr', label: 'Freitag' },
];

export const SEAT_FEATURES = [
    { id: 'dual_monitor', label: '2 Monitore', icon: Monitor },
    { id: 'window', label: 'Fensterplatz', icon: Sun },
    { id: 'standing', label: 'Stehschreibtisch', icon: ArrowUp },
];

export const INITIAL_ROOMS = [
    { id: 'r1', x: 50, y: 50, w: 300, h: 250, name: 'Büro 101', seatCount: 2 },
];

export const INITIAL_SEATS = [
    { id: 's1', x: 80, y: 90, roomId: 'r1', features: ['dual_monitor'] },
    { id: 's2', x: 150, y: 90, roomId: 'r1', features: [] },
];
