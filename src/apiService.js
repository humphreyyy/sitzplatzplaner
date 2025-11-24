// Wrapper to switch between HTTP (Web) and IPC (Electron)

const isElectron = window.electron && window.electron.isElectron;

export const fetchData = async () => {
    if (isElectron) {
        console.log("Fetching via Electron IPC");
        return await window.electron.getData();
    } else {
        // Fallback to server.js for standard web dev
        console.log("Fetching via HTTP");
        const res = await fetch('/api/data');
        return await res.json();
    }
};

export const saveData = async (data) => {
    if (isElectron) {
        return await window.electron.saveData(data);
    } else {
        return await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }
};
