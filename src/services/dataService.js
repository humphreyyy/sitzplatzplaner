// Abstract data fetching to support both Electron (IPC) and Web (HTTP)

export const loadData = async () => {
    if (window.electronAPI) {
        return await window.electronAPI.loadData();
    } else {
        // Fallback for web mode
        const response = await fetch('/api/data');
        if (!response.ok) {
            throw new Error('Failed to load data from server');
        }
        return await response.json();
    }
};

export const saveData = async (data) => {
    if (window.electronAPI) {
        return await window.electronAPI.saveData(data);
    } else {
        // Fallback for web mode
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error('Failed to save data to server');
        }
        return await response.json();
    }
};
