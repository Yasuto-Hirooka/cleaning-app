import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:8000/api`;

function MonthlyReport() {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [report, setReport] = useState({ vendor_monthly: {}, hotel_monthly: {} });
    const [loading, setLoading] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [locking, setLocking] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [month]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const [reportRes, lockRes] = await Promise.all([
                axios.get(`${API_BASE}/reports/monthly?year_month=${month}`),
                axios.get(`${API_BASE}/locks/${month}`)
            ]);

            // Validate response data
            const data = reportRes.data || {};
            if (!data.vendor_monthly || !data.hotel_monthly) {
                console.warn('[Warning] Monthly Report API returned incomplete data:', data);
            }

            setReport({
                vendor_monthly: data.vendor_monthly || {},
                hotel_monthly: data.hotel_monthly || {}
            });
            setIsLocked(!!lockRes.data?.is_locked);
        } catch (error) {
            console.error('[Error] Failed to fetch monthly report:', error);
            alert('データの取得に失敗しました。詳細はコンソールを確認してください。');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleLock = async () => {
        const msg = isLocked ? 'この月の確定を解除しますか？' : 'この月のデータを確定（編集ロック）しますか？';
        if (!window.confirm(msg)) return;

        setLocking(true);
        try {
            await axios.post(`${API_BASE}/locks`, {
                year_month: month,
                is_locked: isLocked ? 0 : 1
            });
            setIsLocked(!isLocked);
            alert(isLocked ? '確定を解除しました。' : '月締めを完了しました。');
        } catch (err) {
            alert('処理に失敗しました。');
        } finally {
            setLocking(false);
        }
    };

    const downloadExcel = async () => {
        try {
            const response = await axios.get(`${API_BASE}/reports/monthly/export?year_month=${month}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `monthly_report_${month}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Monthly export failed:', error);
            alert('Monthly Excel export failed.');
        }
    };

    const MonthlyTable = ({ title, data = {}, types = [], highlightColor = 'var(--primary-color)' }) => {
        // Defensive data handling
        const safeData = data || {};
        const safeTypes = types || [];

        const sortedDays = Object.keys(safeData).sort((a, b) => parseInt(a) - parseInt(b));

        // Calculation with error prevention
        const colTotals = safeTypes.reduce((acc, t) => {
            acc[t] = sortedDays.reduce((sum, d) => {
                const dayData = safeData[d] || {};
                const val = dayData[t];
                return sum + (typeof val === 'number' ? val : 0);
            }, 0);
            return acc;
        }, {});

        const grandTotal = sortedDays.reduce((sum, d) => {
            const dayData = safeData[d] || {};
            const total = dayData.Total;
            return sum + (typeof total === 'number' ? total : 0);
        }, 0);

        // Debug output for suspected data issues
        if (sortedDays.length > 0) {
            console.log(`[Debug] Rendering ${title}: Found ${sortedDays.length} days of data.`);
        }

        return (
            <div className="card" style={{ flex: '1 1 100%', overflowX: 'auto', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>{title}</h3>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: highlightColor }}>
                        月間合計点: {(grandTotal || 0).toFixed(1)} pts
                    </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>日付</th>
                            {safeTypes.map(t => <th key={t} style={{ padding: '0.5rem' }}>{t}</th>)}
                            <th style={{ padding: '0.5rem', fontWeight: 'bold' }}>合計</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDays.map(day => {
                            const dayData = safeData[day] || {};
                            return (
                                <tr key={day} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 'bold' }}>{day}日</td>
                                    {safeTypes.map(t => {
                                        const val = dayData[t];
                                        return (
                                            <td key={t} style={{ padding: '0.5rem' }}>
                                                {typeof val === 'number' ? val.toFixed(1) : '-'}
                                            </td>
                                        );
                                    })}
                                    <td style={{ padding: '0.5rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.02)' }}>
                                        {typeof dayData.Total === 'number' ? dayData.Total.toFixed(1) : '0.0'}
                                    </td>
                                </tr>
                            );
                        })}
                        {sortedDays.length === 0 && (
                            <tr>
                                <td colSpan={safeTypes.length + 2} style={{ padding: '2rem', opacity: 0.5 }}>データがありません。</td>
                            </tr>
                        )}
                    </tbody>
                    {sortedDays.length > 0 && (
                        <tfoot>
                            <tr style={{ background: 'rgba(0,0,0,0.3)', fontWeight: 'bold' }}>
                                <td style={{ padding: '0.7rem', textAlign: 'left' }}>月間合計</td>
                                {safeTypes.map(t => (
                                    <td key={t} style={{ padding: '0.7rem' }}>{(colTotals[t] || 0).toFixed(1)}</td>
                                ))}
                                <td style={{ padding: '0.7rem', color: highlightColor }}>{(grandTotal || 0).toFixed(1)}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        );
    };

    return (
        <div className="card full-width">
            {(!isLocked && !loading) && (
                <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(255,153,0,0.15)',
                    border: '1px solid rgba(255,153,0,0.3)',
                    borderRadius: '0.5rem',
                    color: '#ffcc00',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>⚠️ 未確定のデータがあります。月締め処理を行ってください。</span>
                    <button onClick={handleToggleLock} className="btn" style={{ background: '#faad14', color: '#000', border: 'none' }}>
                        今すぐ確定する
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>月報集計</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={handleToggleLock}
                        className={`btn ${isLocked ? 'success' : 'outline'}`}
                        disabled={locking}
                    >
                        {isLocked ? '✅ 確定済み (解除)' : '🔒 月締め確定'}
                    </button>
                    <button onClick={downloadExcel} className="btn outline">月報エクセル出力</button>
                </div>
            </div>

            <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
                <label>対象年月:</label>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    style={{ maxWidth: '200px' }}
                />
            </div>

            {loading ? (
                <p>読み込み中...</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <MonthlyTable
                        title="ワールドクリーン月報（外注）"
                        data={report?.vendor_monthly || {}}
                        types={["DB", "TW", "TRP", "SW"]}
                        highlightColor="var(--primary-color)"
                    />

                    <MonthlyTable
                        title="ホテル全体月報（実績）"
                        data={report?.hotel_monthly || {}}
                        types={["DB", "TW", "TRP", "SW", "D・D"]}
                        highlightColor="var(--secondary-color)"
                    />
                </div>
            )}
        </div>
    );
}

export default MonthlyReport;
