# PowerShell script to update handleSeatClick
$filePath = "src\SeatPlanerDittmann.jsx"
$content = Get-Content -Path $filePath -Raw

# Replace the planning logic section (lines 356-372)
$oldCode = @"
        if (availableStudents.length === 0 && !currentAssignedStudentId) {
            alert("Keine weiteren Studenten verfügbar.");
            return;
        }

        if (currentAssignedStudentId) {
            const newDay = { ...(assignments[dateKey] || {}) };
            delete newDay[seatId];
            setAssignments({ ...assignments, [dateKey]: newDay });
        } else {
            if (availableStudents.length > 0) {
                const student = availableStudents[0];
                const newDay = { ...(assignments[dateKey] || {}) };
                newDay[seatId] = student.id;
                setAssignments({ ...assignments, [dateKey]: newDay });
            }
        }
"@

$newCode = @"
        if (currentAssignedStudentId) {
            // Clicking assigned seat removes the assignment
            const newDay = { ...(assignments[dateKey] || {}) };
            delete newDay[seatId];
            setAssignments({ ...assignments, [dateKey]: newDay });
            setSelectedId(null);
            setSelectionType(null);
        } else {
            // Clicking free seat selects it for assignment
            setSelectedId(seatId);
            setSelectionType('seat');
        }
"@

$content = $content.Replace($oldCode, $newCode)
Set-Content -Path $filePath -Value $content -NoNewline
