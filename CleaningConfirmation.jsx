import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

function CleaningConfirmation() {
    const location = useLocation();
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [roomList, setRoomList] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMasterData();
        if (location.state?.analysisResult) {
            parseAnalysisResult(location.state.analysisResult);
        }
    }, [location.state]);

    const fetchMasterData = async () => {
        try {
            const [staffRes, roomsRes] = await Promise.all([
                axios.get(`${API_BASE}/staff`),
                axios.get(`${API_BASE}/rooms`)
            ]);
            setStaffList(staffRes.data);
            setRoomList(roomsRes.data);
        } catch (error) {
            console.error('Error fetching master data:', error);
        }
    };

    const parseAnalysisResult = (jsonString) => {
        try {
            // Clean up JSON string if it contains markdown code blocks
            const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            // Normalize data
            const normalized = parsed.map(item => ({
                room_number: item.room,
                bed_staff_name: item.bed_staff || '',
                bath_staff_name: item.bath_staff || '',
                towel_count: item.towel ? 1 : 0
            }));
            setRecords(normalized);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            alert('Failed to parse analysis result. Please enter data manually.');
            setRecords([]);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Map records to API format
            const payload = records.map(r => {
                const room = roomList.find(rm => rm.number === r.room_number);
                const bedStaff = staffList.find(s => s.name === r.bed_staff_name);
                const bathStaff = staffList.find(s => s.name === r.bath_staff_name);

                if (!room) return null; // Skip invalid rooms

                return {
                    date: date,
                    room_id: room.id,
                    bed_staff_id: bedStaff ? bedStaff.id : null,
                    bath_staff_id: bathStaff ? bathStaff.id : null,
                    towel_count: r.towel_count
                };
            }).filter(Boolean);

            if (payload.length === 0) {
                alert('No valid records to save. Check Room Numbers.');
                return;
            }

            await axios.post(`${API_BASE}/records`, payload);
            alert('Saved successfully!');
            navigate('/reports');
        } catch (error) {
            console.error('Error saving records:', error);
            alert('Failed to save.');
        } finally {
            setLoading(false);
        }
    };

    const updateRecord = (index, field, value) => {
        const newRecords = [...records];
        newRecords[index][field] = value;
        setRecords(newRecords);
    };

    const addNewRow = () => {
        setRecords([...records, { room_number: '', bed_staff_name: '', bath_staff_name: '', towel_count: 0 }]);
    };

    const deleteRow = (index) => {
        const newRecords = records.filter((_, i) => i !== index);
        setRecords(newRecords);
    }

    return (
        <div className="card">
            <h2>Confirm Cleaning Records</h2>

            <div className="form-group">
                <label style={{ marginRight: '1rem' }}>Date:</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ maxWidth: '200px' }}
                />
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-color)' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Room</th>
                            <th style={{ padding: '1rem' }}>Bed Staff</th>
                            <th style={{ padding: '1rem' }}>Bath Staff</th>
                            <th style={{ padding: '1rem' }}>Towel</th>
                            <th style={{ padding: '1rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={record.room_number}
                                        onChange={(e) => updateRecord(index, 'room_number', e.target.value)}
                                        list="rooms"
                                        style={{ width: '80px' }}
                                    />
                                    <datalist id="rooms">
                                        {roomList.map(r => <option key={r.id} value={r.number} />)}
                                    </datalist>
                                </td>
                                <td style={{ padding: '0.5rem' }}>
                                    <select
                                        value={record.bed_staff_name}
                                        onChange={(e) => updateRecord(index, 'bed_staff_name', e.target.value)}
                                        style={{ width: '120px' }}
                                    >
                                        <option value="">(Select)</option>
                                        {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </td>
                                <td style={{ padding: '0.5rem' }}>
                                    <select
                                        value={record.bath_staff_name}
                                        onChange={(e) => updateRecord(index, 'bath_staff_name', e.target.value)}
                                        style={{ width: '120px' }}
                                    >
                                        <option value="">(Select)</option>
                                        {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </td>
                                <td style={{ padding: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={record.towel_count > 0}
                                        onChange={(e) => updateRecord(index, 'towel_count', e.target.checked ? 1 : 0)}
                                        style={{ width: '20px', height: '20px', flex: 'none' }}
                                    />
                                </td>
                                <td style={{ padding: '0.5rem' }}>
                                    <button onClick={() => deleteRow(index)} className="btn-danger" style={{ padding: '0.25rem 0.5rem' }}>X</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={addNewRow} className="btn" style={{ background: 'var(--glass-bg)' }}>Add Row</button>
                <button onClick={handleSave} className="btn" disabled={loading}>
                    {loading ? 'Saving...' : 'Confirm & Save'}
                </button>
            </div>
        </div>
    );
}

export default CleaningConfirmation;
