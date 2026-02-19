import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:8000/api`;

function DailyReport() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [report, setReport] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [date]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/reports/daily?date=${date}`);
            setReport(response.data);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to count totals for a category (bed/bath)
    const countTotal = (data) => {
        if (!data) return 0;
        return Object.values(data).reduce((a, b) => a + b, 0);
    }

    // Helper to format breakdown
    const formatBreakdown = (data) => {
        if (!data) return '-';
        return Object.entries(data).map(([type, count]) => `${type}: ${count}`).join(', ');
    }

    return (
        <div className="card">
            <h2>Daily Cleaning Report</h2>

            <div className="form-group">
                <label style={{ marginRight: '1rem' }}>Date:</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ maxWidth: '200px' }}
                />
                <button onClick={fetchReport} className="btn">Refresh</button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-color)' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', background: 'rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '1rem' }}>Staff Name</th>
                                <th style={{ padding: '1rem' }}>Bed Total</th>
                                <th style={{ padding: '1rem' }}>Bed Breakdown</th>
                                <th style={{ padding: '1rem' }}>Bath Total</th>
                                <th style={{ padding: '1rem' }}>Bath Breakdown</th>
                                <th style={{ padding: '1rem' }}>Towel</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(report).map(([staffName, data]) => (
                                <tr key={staffName} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{staffName}</td>
                                    <td style={{ padding: '1rem' }}>{countTotal(data.bed)}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>{formatBreakdown(data.bed)}</td>
                                    <td style={{ padding: '1rem' }}>{countTotal(data.bath)}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>{formatBreakdown(data.bath)}</td>
                                    <td style={{ padding: '1rem' }}>{data.towel}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default DailyReport;
