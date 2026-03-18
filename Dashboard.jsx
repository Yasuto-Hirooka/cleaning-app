import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:8000/api`;
const FLOORS = [7, 8, 9, 10, 11, 12];
const REFRESH_INTERVAL = 30000; // 30 seconds

// Circular progress ring component
function ProgressRing({ radius, stroke, progress, color }) {
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
            <circle
                stroke="rgba(255,255,255,0.1)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
            <circle
                stroke={color}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease' }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
        </svg>
    );
}

function Dashboard() {
    const navigate = useNavigate();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [rooms, setRooms] = useState([]);
    const [staff, setStaff] = useState([]);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const [roomsRes, staffRes, recordsRes] = await Promise.all([
                axios.get(`${API_BASE}/rooms`),
                axios.get(`${API_BASE}/staff`),
                axios.get(`${API_BASE}/records/raw?date=${date}`),
            ]);
            setRooms(roomsRes.data);
            setStaff(staffRes.data);
            setRecords(recordsRes.data?.records || []);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const interval = setInterval(fetchData, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Build lookup: room_id -> record
    const recordMap = {};
    records.forEach(r => { recordMap[r.room_id] = r; });

    // Build lookup: staff_id -> name
    const staffMap = {};
    staff.forEach(s => { staffMap[s.id] = s.name; });

    // Compute per-room status
    const getRoomStatus = (room) => {
        const rec = recordMap[room.id];
        if (!rec) return 'empty';
        const hasBed = rec.bed_staff_id != null;
        const hasBath = rec.bath_staff_id != null;
        if (hasBed && hasBath) return 'done';
        if (hasBed || hasBath) return 'partial';
        return 'empty';
    };

    // Overall stats
    const totalRooms = rooms.length;
    const doneRooms = rooms.filter(r => getRoomStatus(r) === 'done').length;
    const partialRooms = rooms.filter(r => getRoomStatus(r) === 'partial').length;
    const emptyRooms = totalRooms - doneRooms - partialRooms;
    const overallProgress = totalRooms > 0 ? Math.round((doneRooms / totalRooms) * 100) : 0;

    // Per-floor stats
    const floorStats = FLOORS.map(floor => {
        const floorRooms = rooms.filter(r => r.floor === floor);
        const done = floorRooms.filter(r => getRoomStatus(r) === 'done').length;
        const partial = floorRooms.filter(r => getRoomStatus(r) === 'partial').length;
        return { floor, total: floorRooms.length, done, partial, rooms: floorRooms };
    });

    // Staff performance
    const staffPerf = staff.map(s => {
        const bedCount = records.filter(r => r.bed_staff_id === s.id).length;
        const bathCount = records.filter(r => r.bath_staff_id === s.id).length;
        return { ...s, bedCount, bathCount, total: bedCount + bathCount };
    }).filter(s => s.total > 0).sort((a, b) => b.total - a.total);

    const statusColor = { done: '#22c55e', partial: '#f59e0b', empty: 'rgba(255,255,255,0.1)' };
    const progressColor = overallProgress >= 80 ? '#22c55e' : overallProgress >= 50 ? '#f59e0b' : '#e11d48';

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        リアルタイム ダッシュボード
                    </h2>
                    {lastUpdated && (
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                            最終更新: {lastUpdated.toLocaleTimeString('ja-JP')} &nbsp;(30秒ごと自動更新)
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        style={{
                            background: 'rgba(17,34,64,0.85)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#f8fafc',
                            borderRadius: '8px',
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.9rem',
                        }}
                    />
                    <button
                        onClick={fetchData}
                        style={{
                            background: 'rgba(99,102,241,0.25)',
                            border: '1px solid rgba(99,102,241,0.5)',
                            color: '#a5b4fc',
                            borderRadius: '8px',
                            padding: '0.4rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                        }}
                    >
                        更新
                    </button>
                </div>
            </div>

            {/* Top Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem', alignItems: 'stretch' }}>
                {/* Progress Ring Card */}
                <div style={cardStyle}>
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ProgressRing radius={70} stroke={10} progress={overallProgress} color={progressColor} />
                        <div style={{ position: 'absolute', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: progressColor }}>{overallProgress}%</div>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>完了率</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                        {doneRooms} / {totalRooms} 部屋
                    </div>
                </div>

                {/* Stat cards */}
                {[
                    { label: '清掃完了', value: doneRooms, icon: '✅', color: '#22c55e' },
                    { label: '清掃中', value: partialRooms, icon: '🔄', color: '#f59e0b' },
                    { label: '未着手', value: emptyRooms, icon: '⬜', color: 'rgba(255,255,255,0.4)' },
                ].map(({ label, value, icon, color }) => (
                    <div key={label} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ fontSize: '2rem' }}>{icon}</div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 800, color }}>{value}</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Floor Maps */}
            <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                <h3 style={sectionTitleStyle}>フロア別 清掃状況マップ</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {floorStats.map(({ floor, total, done, partial, rooms: floorRooms }) => {
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                        return (
                            <div key={floor}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', minWidth: '30px' }}>{floor}F</span>
                                    {/* Progress bar */}
                                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${pct}%`,
                                            background: pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#e11d48',
                                            borderRadius: '99px',
                                            transition: 'width 0.8s ease',
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', minWidth: '70px', textAlign: 'right' }}>
                                        {done}/{total} ({pct}%)
                                    </span>
                                </div>
                                {/* Room blocks */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', paddingLeft: '38px' }}>
                                    {floorRooms.map(room => {
                                        const status = getRoomStatus(room);
                                        const rec = recordMap[room.id];
                                        const tooltip = rec
                                            ? `${room.number} | ベッド:${staffMap[rec.bed_staff_id] || '-'} バス:${staffMap[rec.bath_staff_id] || '-'}`
                                            : room.number;
                                        return (
                                            <div
                                                key={room.id}
                                                title={tooltip}
                                                style={{
                                                    width: '32px',
                                                    height: '20px',
                                                    background: statusColor[status],
                                                    borderRadius: '3px',
                                                    fontSize: '0.55rem',
                                                    color: status === 'empty' ? 'rgba(255,255,255,0.3)' : '#0a192f',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    cursor: 'default',
                                                    transition: 'transform 0.2s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                {room.number.slice(-2)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                    {[['#22c55e', '清掃完了（ベッド＋バス）'], ['#f59e0b', '清掃中（片方のみ）'], ['rgba(255,255,255,0.15)', '未着手']].map(([color, label]) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: '12px', height: '12px', background: color, borderRadius: '2px' }} />
                            {label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Staff Performance */}
            {staffPerf.length > 0 && (
                <div style={cardStyle}>
                    <h3 style={sectionTitleStyle}>スタッフ 作業実績</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
                        {staffPerf.map((s, i) => (
                            <div key={s.id} style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '10px',
                                padding: '0.9rem',
                                position: 'relative',
                                overflow: 'hidden',
                            }}>
                                {i === 0 && (
                                    <div style={{ position: 'absolute', top: '6px', right: '8px', fontSize: '0.65rem', background: 'rgba(251,191,36,0.2)', color: '#fbbf24', padding: '1px 6px', borderRadius: '99px' }}>
                                        TOP
                                    </div>
                                )}
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem' }}>{s.name}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#60a5fa' }}>{s.total}</div>
                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.2rem' }}>担当室数</div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                                    <span>🛏 {s.bedCount}</span>
                                    <span>🛁 {s.bathCount}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {staffPerf.length === 0 && (
                <div style={{ ...cardStyle, textAlign: 'center', color: 'rgba(255,255,255,0.35)', padding: '2rem' }}>
                    この日の清掃記録はまだありません
                </div>
            )}
        </div>
    );
}

const cardStyle = {
    background: 'rgba(17,34,64,0.85)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '1.25rem',
    backdropFilter: 'blur(10px)',
};

const sectionTitleStyle = {
    margin: '0 0 1rem',
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
};

export default Dashboard;
