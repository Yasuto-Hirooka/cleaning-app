import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://cleaning-app-1slv.onrender.com/api';
const API_URL = `${API_BASE}/staff`;

function StaffManagement() {
    const [staff, setStaff] = useState([]);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const response = await axios.get(API_URL);
            setStaff(response.data);
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddString = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;

        try {
            await axios.post(API_URL, { name: newName });
            setNewName('');
            fetchStaff();
        } catch (error) {
            console.error('Error adding staff:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('この作業者を削除してもよろしいですか？')) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchStaff();
        } catch (error) {
            console.error('Error deleting staff:', error);
        }
    };

    return (
        <div className="card">
            <h2>作業者管理</h2>

            <form onSubmit={handleAddString} className="form-group">
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="名前を入力..."
                />
                <button type="submit" className="btn primary">入力内容を保存する</button>
            </form>

            {loading ? (
                <p>読み込み中...</p>
            ) : (
                <div className="list">
                    {staff.map((s) => (
                        <div key={s.id} className="list-item">
                            <span style={{ fontWeight: 500 }}>{s.name}</span>
                            <button
                                onClick={() => handleDelete(s.id)}
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

export default StaffManagement;

