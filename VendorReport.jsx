import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:8000/api`;

function VendorReport() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [report, setReport] = useState({ staff_reports: {}, vendor_total: { matrix: {} }, hotel_total: { matrix: {} } });
    const [loading, setLoading] = useState(false);
    const [expandedStaff, setExpandedStaff] = useState({});

    useEffect(() => {
        fetchReport();
    }, [date]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/reports/vendor?date=${date}`);
            setReport(response.data);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDetails = (name) => {
        setExpandedStaff(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const downloadExcel = async () => {
        try {
            const response = await axios.get(`${API_BASE}/reports/vendor/export?date=${date}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `vendor_report_${date}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Excel export failed.');
        }
    };

    const staffNames = Object.keys(report.staff_reports || {}).sort((a, b) => {
        if (a === '自社') return -1;
        if (b === '自社') return 1;
        return a.localeCompare(b);
    });

    const floors = ["7", "8", "9", "10", "11", "12"];
    const types = ["DB", "TW", "TRP", "SW", "D・D"];

    const MatrixTable = ({ title, matrix, totalPoints, borderColor = 'var(--glass-border)', highlightColor = 'var(--secondary-color)' }) => {
        if (!matrix) return null;
        const colTotals = types.reduce((acc, t) => {
            acc[t] = floors.reduce((sum, f) => sum + (matrix[f]?.[t] || 0), 0);
            return acc;
        }, {});

        return (
            <div className="staff-report-card" style={{
                flex: '1 1 45%',
                minWidth: '400px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: `1px solid ${borderColor}`,
                marginBottom: '1rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, opacity: 0.8 }}>{title}</h4>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: highlightColor }}>
                            {totalPoints?.toFixed(1)} <small>pts</small>
                        </span>
                    </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'center' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '0.4rem', textAlign: 'left' }}>Floor</th>
                            {types.map(t => <th key={t} style={{ padding: '0.4rem' }}>{t}</th>)}
                            <th style={{ padding: '0.4rem', fontWeight: 'bold' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {floors.map(f => (
                            <tr key={f} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.4rem', textAlign: 'left', fontWeight: 'bold' }}>{f}F</td>
                                {types.map(t => (
                                    <td key={t} style={{ padding: '0.4rem' }}>
                                        {matrix[f]?.[t] ? matrix[f][t].toFixed(1) : '-'}
                                    </td>
                                ))}
                                <td style={{ padding: '0.4rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.02)' }}>
                                    {matrix[f]?.Total.toFixed(1)}
                                </td>
                            </tr>
                        ))}
                        <tr style={{ background: 'rgba(0,0,0,0.2)', fontWeight: 'bold' }}>
                            <td style={{ padding: '0.4rem', textAlign: 'left' }}>TOTAL</td>
                            {types.map(t => (
                                <td key={t} style={{ padding: '0.4rem' }}>{colTotals[t].toFixed(1)}</td>
                            ))}
                            <td style={{ padding: '0.4rem', color: highlightColor }}>{totalPoints?.toFixed(1)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="card full-width">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>日報集計</h2>
                <button onClick={downloadExcel} className="btn outline">エクセル出力 (.xlsx)</button>
            </div>

            <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
                <label>対象日:</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ maxWidth: '200px' }}
                />
                <button onClick={fetchReport} className="btn">表示</button>
            </div>

            {loading ? (
                <p>読み込み中...</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Section 1: Individuals */}
                    <div>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--secondary-color)' }}>作業者日報</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                            {staffNames.length === 0 ? (
                                <p>No records found for this date.</p>
                            ) : (
                                staffNames.map(sName => {
                                    const data = report.staff_reports[sName];
                                    return (
                                        <div key={sName} style={{ flex: '1 1 45%', minWidth: '400px' }}>
                                            <MatrixTable
                                                title={`作業者: ${sName}`}
                                                matrix={data.matrix}
                                                totalPoints={data.total_points}
                                                borderColor={sName === '自社' ? '#666' : 'var(--glass-border)'}
                                                highlightColor="var(--primary-color)"
                                            />
                                            <div style={{ marginTop: '-0.5rem', marginBottom: '1.5rem' }}>
                                                <button
                                                    className="btn outline small"
                                                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                                    onClick={() => toggleDetails(sName)}
                                                >
                                                    {expandedStaff[sName] ? 'リストを隠す' : '詳細表示'}
                                                </button>

                                                {expandedStaff[sName] && (
                                                    <div style={{ marginTop: '0.5rem', maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '0.5rem', padding: '0.5rem' }}>
                                                        <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                                                            <thead style={{ opacity: 0.6, borderBottom: '1px solid var(--glass-border)' }}>
                                                                <tr>
                                                                    <th style={{ textAlign: 'left' }}>部屋</th>
                                                                    <th style={{ textAlign: 'left' }}>作業内容</th>
                                                                    <th style={{ textAlign: 'right' }}>Pts</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {data.details.map((d, idx) => (
                                                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                                        <td>{d.room}</td>
                                                                        <td>{d.work}</td>
                                                                        <td style={{ textAlign: 'right' }}>{d.points.toFixed(1)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '0' }} />

                    {/* Section 2 & 3 & 4: Aggregates */}
                    <div>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>集計合計</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                            <MatrixTable
                                title="ワールドクリーン（外注）"
                                matrix={report.vendor_total?.matrix}
                                totalPoints={report.vendor_total?.total_points}
                                borderColor="var(--primary-color)"
                                highlightColor="var(--primary-color)"
                            />
                            <MatrixTable
                                title="ベストクリエイト（自社）"
                                matrix={report.in_house_total?.matrix}
                                totalPoints={report.in_house_total?.total_points}
                                borderColor="#888"
                                highlightColor="#aaa"
                            />
                            <MatrixTable
                                title="ポートタワーホテル（全体）"
                                matrix={report.hotel_total?.matrix}
                                totalPoints={report.hotel_total?.total_points}
                                borderColor="var(--secondary-color)"
                                highlightColor="var(--secondary-color)"
                            />
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}

export default VendorReport;
