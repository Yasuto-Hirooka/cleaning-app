import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:8000/api`;
const API_URL = `${API_BASE}/rooms`;

function RoomManagement() {
    const [rooms, setRooms] = useState([]);
    const [newRoom, setNewRoom] = useState({ number: '', type: 'DB', floor: 7 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await axios.get(API_URL);
            // Sort by floor then number
            const sorted = response.data.sort((a, b) => {
                if (a.floor !== b.floor) return a.floor - b.floor;
                return a.number.localeCompare(b.number);
            });
            setRooms(sorted);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newRoom.number) return;

        try {
            await axios.post(API_URL, newRoom);
            setNewRoom({ ...newRoom, number: '' }); // Reset number but keep floor/type
            fetchRooms();
        } catch (error) {
            console.error('Error adding room:', error);
            alert('Failed to add room. Room number might already exist.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('この部屋を削除してもよろしいですか？')) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchRooms();
        } catch (error) {
            console.error('Error deleting room:', error);
        }
    };

    return (
        <div className="card">
            <h2>部屋番号管理</h2>

            <form onSubmit={handleAdd} className="form-group">
                <input
                    type="number"
                    value={newRoom.floor}
                    onChange={(e) => setNewRoom({ ...newRoom, floor: parseInt(e.target.value) })}
                    placeholder="フロア"
                    style={{ width: '80px', flex: 'none' }}
                />
                <input
                    type="text"
                    value={newRoom.number}
                    onChange={(e) => setNewRoom({ ...newRoom, number: e.target.value })}
                    placeholder="部屋番号"
                />
                <select
                    value={newRoom.type}
                    onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                    style={{ width: '100px', flex: 'none' }}
                >
                    <option value="DB">DB</option>
                    <option value="TW">TW</option>
                    <option value="TRP">TRP</option>
                    <option value="SW">SW</option>
                </select>
                <button type="submit" className="btn primary">入力内容を保存する</button>
            </form>

            {loading ? (
                <p>読み込み中...</p>
            ) : (
                <div className="list">
                    {rooms.map((room) => (
                        <div key={room.id} className="list-item">
                            <div>
                                <span className="room-badge">{room.floor}F</span>
                                <span style={{ fontWeight: 600, marginRight: '1rem', fontSize: '1.1rem' }}>{room.number}</span>
                                <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>{room.type}</span>
                            </div>
                            <button
                                onClick={() => handleDelete(room.id)}
                                className="btn-danger"
                            >
                                削除
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default RoomManagement;
