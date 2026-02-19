import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:8000/api`;

const FLOORS = [7, 8, 9, 10, 11, 12];

function FastEntry() {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [staff, setStaff] = useState([]);
    const [activeFloor, setActiveFloor] = useState(7);
    const [gridData, setGridData] = useState({}); // { room_id: { bed_staff_id, bath_staff_id, towel_count } }
    const [cursor, setCursor] = useState({ roomId: null, field: 'bed' }); // field: 'bed', 'bath', 'towel'
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLocked, setIsLocked] = useState(false);

    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dailyLocked, setDailyLocked] = useState(false);
    const [adminMode, setAdminMode] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [lastLoadedDate, setLastLoadedDate] = useState(null); // Guard for local data saving
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const activeDateRef = useRef(date); // To track stale async results
    const isEffectivelyLocked = isLocked || dailyLocked;

    const gridRef = useRef(null);
    const numBuffer = useRef('');       // accumulates typed digits
    const bufferTimer = useRef(null);   // auto-confirm timer

    useEffect(() => {
        fetchInitialData();
    }, [date]);

    const fetchInitialData = async () => {
        const targetDate = activeDateRef.current;
        setLoading(true);
        setGridData({}); // Attempting to clear, but async setter might be delayed
        try {
            const [roomsRes, staffRes, lockRes, dataRes, dailyLockRes] = await Promise.all([
                axios.get(`${API_BASE}/rooms`),
                axios.get(`${API_BASE}/staff`),
                axios.get(`${API_BASE}/locks/${targetDate.slice(0, 7)}`),
                axios.get(`${API_BASE}/records/raw?date=${targetDate}`),
                axios.get(`${API_BASE}/daily-locks/${targetDate}`)
            ]);

            // GUARD: Check if the date has changed while we were waiting
            if (activeDateRef.current !== targetDate) return;

            setRooms(roomsRes.data);
            setStaff(staffRes.data);
            if (staffRes.data.length > 0 && !selectedStaffId) {
                setSelectedStaffId(staffRes.data[0].id);
            }

            setIsLocked(lockRes.data.is_locked);
            setDailyLocked(dailyLockRes.data.is_locked);

            // Populate grid with existing data if any
            const existingData = {};
            const records = dataRes.data?.records || [];
            records.forEach(r => {
                existingData[r.room_id] = {
                    bed_staff_id: r.bed_staff_id,
                    bath_staff_id: r.bath_staff_id,
                    towel_count: r.towel_count
                };
            });

            // Merge with draft if it exists in localStorage for this date
            const draftKey = `draft_${date}`;
            const draft = localStorage.getItem(draftKey);
            if (draft) {
                const parsedDraft = JSON.parse(draft);
                setGridData({ ...existingData, ...parsedDraft });
            } else {
                setGridData(existingData);
            }
            setApiError(null);
            setLastLoadedDate(targetDate); // Mark this date's data as successfully loaded
            setHasUnsavedChanges(false); // Reset on load

        } catch (err) {
            if (activeDateRef.current !== targetDate) return;
            console.error(err);
            const detail = err.response?.data?.detail || err.message;
            const url = err.config?.url || 'unknown URL';
            setApiError(`通信エラー (${err.response?.status || 'Network'}): ${detail} [URL: ${url}]`);
        } finally {
            setLoading(false);
        }
    };

    const currentRooms = rooms.filter(r => r.floor === activeFloor);
    // Numeric mapping for ALL staff (1, 2, 3...)
    const staffMap = staff.reduce((acc, s, idx) => ({ ...acc, [idx + 1]: s.id }), {});

    const handleCellClick = (roomId, field) => {
        setCursor({ roomId, field });
    };

    const updateCell = useCallback((roomId, field, value) => {
        setGridData(prev => ({
            ...prev,
            [roomId]: {
                ...(prev[roomId] || { bed_staff_id: null, bath_staff_id: null, towel_count: 0 }),
                [field]: value
            }
        }));
        setHasUnsavedChanges(true); // Mark as dirty
    }, []);

    // Confirm the buffered number as a staff selection
    // (defined here, after staffMap and updateCell are available)
    const confirmBuffer = useCallback(() => {
        const num = parseInt(numBuffer.current, 10);
        numBuffer.current = '';
        if (!num) return;
        const staffId = staffMap[num];
        if (staffId) {
            setSelectedStaffId(staffId);
            if (cursor.roomId && (cursor.field === 'bed' || cursor.field === 'bath')) {
                updateCell(cursor.roomId, cursor.field + '_staff_id', staffId);
            }
        }
    }, [staffMap, cursor, updateCell]);

    const handleMouseEnter = (roomId) => {
        if (isDragging && cursor.roomId) {
            const sourceField = cursor.field + (cursor.field === 'towel' ? '_count' : '_staff_id');
            const value = gridData[cursor.roomId]?.[sourceField];
            updateCell(roomId, sourceField, value);
        }
    };

    const handleMouseDown = (roomId, field) => {
        setCursor({ roomId, field });
        setIsDragging(true);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const handleKeyDown = useCallback((e) => {
        // 1. Staff Selection via Numbers (multi-digit: 1-999)
        if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();

            // '0' alone = clear cell
            if (e.key === '0' && numBuffer.current === '') {
                if (cursor.roomId) {
                    if (cursor.field === 'towel') {
                        updateCell(cursor.roomId, 'towel_count', 0);
                    } else {
                        updateCell(cursor.roomId, cursor.field + '_staff_id', null);
                    }
                }
                return;
            }

            // Accumulate digits (max 3 digits)
            if (numBuffer.current.length < 3) {
                numBuffer.current += e.key;
            }

            // Reset the auto-confirm timer (1 second of inactivity confirms)
            if (bufferTimer.current) clearTimeout(bufferTimer.current);
            bufferTimer.current = setTimeout(() => {
                confirmBuffer();
            }, 1000);
            return;
        }

        // Enter key: immediately confirm the buffered number
        if (e.key === 'Enter') {
            if (numBuffer.current !== '') {
                if (bufferTimer.current) clearTimeout(bufferTimer.current);
                confirmBuffer();
                return;
            }
        }

        // Backspace: delete last buffered digit (if buffer is active)
        if (e.key === 'Backspace') {
            if (numBuffer.current !== '') {
                e.preventDefault();
                numBuffer.current = numBuffer.current.slice(0, -1);
                if (bufferTimer.current) clearTimeout(bufferTimer.current);
                if (numBuffer.current !== '') {
                    bufferTimer.current = setTimeout(() => confirmBuffer(), 1000);
                }
                return;
            }
            // No buffer active: clear current cell
            e.preventDefault();
            if (cursor.roomId) {
                if (cursor.field === 'towel') {
                    updateCell(cursor.roomId, 'towel_count', 0);
                } else {
                    updateCell(cursor.roomId, cursor.field + '_staff_id', null);
                }
            }
            return;
        }

        // Delete key: clear current cell
        if (e.key === 'Delete') {
            e.preventDefault();
            if (cursor.roomId) {
                if (cursor.field === 'towel') {
                    updateCell(cursor.roomId, 'towel_count', 0);
                } else {
                    updateCell(cursor.roomId, cursor.field + '_staff_id', null);
                }
            }
            return;
        }

        if (!cursor.roomId) return;
        const currentIdx = currentRooms.findIndex(r => r.id === cursor.roomId);
        if (currentIdx === -1) return;

        // Movement
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentIdx < currentRooms.length - 1) setCursor(prev => ({ ...prev, roomId: currentRooms[currentIdx + 1].id }));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentIdx > 0) setCursor(prev => ({ ...prev, roomId: currentRooms[currentIdx - 1].id }));
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (cursor.field === 'bed') setCursor(prev => ({ ...prev, field: 'bath' }));
            else if (cursor.field === 'bath') setCursor(prev => ({ ...prev, field: 'towel' }));
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (cursor.field === 'towel') setCursor(prev => ({ ...prev, field: 'bath' }));
            else if (cursor.field === 'bath') setCursor(prev => ({ ...prev, field: 'bed' }));
        }

        // Towel Toggle (Space)
        if (e.key === ' ' && cursor.field === 'towel') {
            e.preventDefault();
            const current = gridData[cursor.roomId]?.towel_count || 0;
            updateCell(cursor.roomId, 'towel_count', current ? 0 : 1);
        }

        // Ctrl+D (Copy Down)
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            if (currentIdx < currentRooms.length - 1) {
                const sourceField = cursor.field + (cursor.field === 'towel' ? '_count' : '_staff_id');
                const value = gridData[cursor.roomId]?.[sourceField];
                const nextRoomId = currentRooms[currentIdx + 1].id;
                updateCell(nextRoomId, sourceField, value);
                setCursor(prev => ({ ...prev, roomId: nextRoomId }));
            }
        }
    }, [cursor, currentRooms, gridData, staffMap, setSelectedStaffId, updateCell, confirmBuffer]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const bulkFillFloor = (field) => {
        if (!selectedStaffId) return;
        const newGrid = { ...gridData };
        currentRooms.forEach(r => {
            newGrid[r.id] = {
                ...(newGrid[r.id] || { bed_staff_id: null, bath_staff_id: null, towel_count: 0 }),
                [field]: selectedStaffId
            };
        });
        setGridData(newGrid);
        setHasUnsavedChanges(true);
    };

    // Simplified draft persistence: only save if date matches last loaded data
    useEffect(() => {
        if (!date || loading || Object.keys(gridData).length === 0 || isLocked) return;

        // CRITICAL: Prevent saving data from a previous date into a new date's draft
        if (date !== lastLoadedDate) return;

        if (isEffectivelyLocked) {
            localStorage.removeItem(`draft_${date}`);
            return;
        }

        const key = `draft_${date}`;
        localStorage.setItem(key, JSON.stringify(gridData));
    }, [gridData, date, loading, isLocked, lastLoadedDate, isEffectivelyLocked]);

    const clearFloor = () => {
        if (!window.confirm('このフロアの入力をすべて消去します。よろしいですか？')) return;
        if (!window.confirm('本当によろしいですか？（この操作は元に戻せません）')) return;

        const newGrid = { ...gridData };
        currentRooms.forEach(r => {
            if (newGrid[r.id]) {
                newGrid[r.id].bed_staff_id = null;
                newGrid[r.id].bath_staff_id = null;
                newGrid[r.id].towel_count = 0;
            }
        });
        setGridData(newGrid);
        setHasUnsavedChanges(true);
    };

    const confirmDay = async () => {
        if (!window.confirm('締めた後は編集できなくなります。よろしいですか？')) return;
        try {
            await axios.post(`${API_BASE}/daily-locks/${date}`, { is_locked: 1 });
            // FORCE REMOVE DRAFT ON LOCK
            localStorage.removeItem(`draft_${date}`);
            setDailyLocked(true);
            alert(`${date} の日報を確定しました。🔒`);
        } catch (err) {
            alert(err.response?.data?.detail || '確定に失敗しました。');
        }
    };

    const unlockDay = async () => {
        if (!window.confirm('この日のロックを解除して編集可能にしますか？')) return;
        try {
            await axios.post(`${API_BASE}/daily-locks/${date}`, { is_locked: 0 });
            setDailyLocked(false);
            alert(`${date} のロックを解除しました。`);
        } catch (err) {
            alert(err.response?.data?.detail || 'ロック解除に失敗しました。');
        }
    };

    const handleSave = async () => {
        if (missingRooms.length > 0) {
            const roomList = missingRooms.map(r => r.number).join(', ');
            const confirmed = window.confirm(`未清掃が残り${missingRooms.length}部屋あります（${roomList}）。このまま保存してよろしいですか？`);
            if (!confirmed) return;
        }

        const records = rooms.map(r => ({
            date,
            room_id: r.id,
            bed_staff_id: gridData[r.id]?.bed_staff_id || null,
            bath_staff_id: gridData[r.id]?.bath_staff_id || null,
            towel_count: gridData[r.id]?.towel_count || 0
        })).filter(rec => rec.bed_staff_id || rec.bath_staff_id || rec.towel_count > 0);

        if (records.length === 0) {
            const confirmed = window.confirm('清掃入力がすべて空です。この日のデータを完全に削除（リセット）してよろしいですか？');
            if (!confirmed) return;
        }

        setSaving(true);
        try {
            // Pass date as query param to allow resetting when records array is empty
            await axios.post(`${API_BASE}/records?date=${date}`, records);
            // Clear draft on successful save
            localStorage.removeItem(`draft_${date}`);
            alert('保存および集計を更新しました');
            setHasUnsavedChanges(false);
            fetchInitialData();
        } catch (err) {
            alert(err.response?.data?.detail || '保存に失敗しました。');
        } finally {
            setSaving(false);
        }
    };

    const missingRooms = rooms.filter(r => !gridData[r.id]?.bed_staff_id && !gridData[r.id]?.bath_staff_id);
    const filledCount = rooms.length - missingRooms.length;
    const completionRate = Math.round((filledCount / rooms.length) * 100) || 0;

    const handleDateChange = (newDate) => {
        // SYNCHRONOUS RESET to prevent any stale data from being visible or saved
        setLoading(true);
        setGridData({});
        setLastLoadedDate(null);
        activeDateRef.current = newDate;
        setDate(newDate);
    };

    if (loading) return (
        <div className="card full-width" style={{ textAlign: 'center', padding: '4rem', fontSize: '1.5rem' }}>
            ⏳ データを読み込み中...
        </div>
    );


    return (
        <div className="card full-width">
            <div className="important-label">
                【重要】日報を入力する日付を選んでください
            </div>

            {/* API Error Banner */}
            {apiError && (
                <div className="lock-banner" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ff8a8a', marginBottom: '1rem' }}>
                    🚨 {apiError}
                </div>
            )}

            {/* Lock Status Banner */}
            {isEffectivelyLocked && (
                <div className="lock-banner">
                    🔒 {isLocked ? 'この月は月締め済みです（編集不可）' : 'この日の日報は確定済みです'}
                    {dailyLocked && !isLocked && adminMode && (
                        <button className="btn danger" style={{ marginLeft: '1rem', padding: '0.3rem 1rem', fontSize: '0.85rem' }} onClick={unlockDay}>
                            🔓 ロック解除
                        </button>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>対象日:</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => handleDateChange(e.target.value)}
                        style={{ fontSize: '1.2rem', padding: '0.8rem', minWidth: '240px', border: '2px solid var(--porttower-red)' }}
                        disabled={saving}
                    />
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* Admin Mode Toggle */}
                    <label className="admin-toggle" title="管理者モード">
                        <input
                            type="checkbox"
                            checked={adminMode}
                            onChange={(e) => setAdminMode(e.target.checked)}
                        />
                        <span className="admin-toggle-slider"></span>
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', opacity: 0.8 }}>🔐 管理者</span>
                    </label>
                    <button className="btn outline" onClick={() => navigate('/')}>
                        ⬅ ホームに戻る
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                    <h2 style={{ marginBottom: '0.5rem' }}>日報入力</h2>
                    <div className="staff-palette">
                        {staff.map((s, idx) => (
                            <div
                                key={s.id}
                                className={`staff-chip ${selectedStaffId === s.id ? 'active' : ''}`}
                                onClick={() => setSelectedStaffId(s.id)}
                            >
                                <span className="staff-key">{idx + 1}</span>
                                <span className="staff-name">{s.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '200px' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <strong>進捗: {filledCount} / {rooms.length} ({completionRate}%)</strong>
                    </div>
                    <progress value={completionRate} max="100" style={{ width: '100%', height: '10px' }}></progress>
                    {isLocked && <div style={{ color: '#ff4d4f', fontWeight: 'bold', marginTop: '0.5rem' }}>※この月は確定済みのため編集できません</div>}
                </div>
            </div>

            <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label>日付:</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={saving} />
                <div className="tabs">
                    {FLOORS.map(f => (
                        <button key={f} className={`tab ${activeFloor === f ? 'active' : ''}`} onClick={() => setActiveFloor(f)}>
                            {f}F
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button className="btn outline" onClick={() => bulkFillFloor('bed_staff_id')} disabled={isEffectivelyLocked}>
                    フロア一括（ベッド）
                </button>
                <button className="btn outline" onClick={() => bulkFillFloor('bath_staff_id')} disabled={isEffectivelyLocked}>
                    フロア一括（水回り）
                </button>
                <button className="btn danger outline" onClick={clearFloor} disabled={isEffectivelyLocked}>フロア全消去</button>
            </div>

            <div className="grid-container" style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                {currentRooms.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#ffb3b3' }}>
                        ⚠️ {activeFloor}階の部屋データが見つかりません。<br />
                        (全部屋数: {rooms.length}, 選択階: {activeFloor}F)<br />
                        他の階を選択してみてください。
                    </div>
                ) : (
                    <table className="fast-grid">
                        <thead>
                            <tr>
                                <th>部屋</th>
                                <th>タイプ</th>
                                <th>ベッド {isEffectivelyLocked ? '🔒' : '(1-999)'}</th>
                                <th>水回り {isEffectivelyLocked ? '🔒' : '(1-999)'}</th>
                                <th>タオル (Space)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRooms.map((room, idx) => {
                                const data = gridData[room.id] || {};
                                const isSelected = (field) => cursor.roomId === room.id && cursor.field === field;
                                const isEmpty = (val) => val === null || val === undefined;

                                return (
                                    <tr key={room.id} className={isEffectivelyLocked ? 'row-locked' : ''}>
                                        <td>
                                            {room.number}
                                            {isEffectivelyLocked && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>🔒</span>}
                                        </td>
                                        <td>{room.type}</td>
                                        <td
                                            className={`cell ${isSelected('bed') ? 'active' : ''} ${isEmpty(data.bed_staff_id) ? 'invalid' : ''}`}
                                            onMouseDown={() => handleMouseDown(room.id, 'bed')}
                                            onMouseEnter={() => handleMouseEnter(room.id)}
                                        >
                                            {staff.find(s => s.id === data.bed_staff_id)?.name || '-'}
                                        </td>
                                        <td
                                            className={`cell ${isSelected('bath') ? 'active' : ''} ${isEmpty(data.bath_staff_id) ? 'invalid' : ''}`}
                                            onMouseDown={() => handleMouseDown(room.id, 'bath')}
                                            onMouseEnter={() => handleMouseEnter(room.id)}
                                        >
                                            {staff.find(s => s.id === data.bath_staff_id)?.name || '-'}
                                        </td>
                                        <td
                                            className={`cell ${isSelected('towel') ? 'active' : ''} ${data.towel_count ? 'checked' : ''}`}
                                            onMouseDown={() => handleMouseDown(room.id, 'towel')}
                                            onMouseEnter={() => handleMouseEnter(room.id)}
                                        >
                                            {data.towel_count ? '◯' : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                <div className="action-stack">
                    <button
                        className={`save-btn ${hasUnsavedChanges ? 'pulse' : ''}`}
                        onClick={handleSave}
                        disabled={saving || isEffectivelyLocked}
                    >
                        {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                        className="daily-status-btn"
                        onClick={dailyLocked ? unlockDay : confirmDay}
                        disabled={saving || isLocked || (hasUnsavedChanges && !dailyLocked)}
                        title={hasUnsavedChanges && !dailyLocked ? "変更を保存してから確定してください" : ""}
                    >
                        {dailyLocked ? '日次ロック解除' : '日次締め'}
                    </button>
                    {hasUnsavedChanges && !dailyLocked && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--porttower-red)', marginTop: '0.3rem', fontWeight: 'bold' }}>
                            ※ 変更を保存してから締めてください
                        </div>
                    )}
                </div>
            </div>

            {missingRooms.length > 0 && (
                <div className="remain-banner">
                    <svg className="remain-icon" viewBox="0 0 24 24">
                        <path d="M11,2H13L14,5H10L11,2M10,6H14L15,9H9L10,6M9,10H15L16,13H8L9,10M7,22V20L10,14H14L17,20V22H7Z" />
                    </svg>
                    <div>
                        <div style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                            未清掃部屋 ({missingRooms.length} 部屋)
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', letterSpacing: '0.05em' }}>
                            {missingRooms.map(r => r.number).join(', ')}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.25rem' }}>
                    🔍 システム診断: 部屋数: {rooms.length}, スタッフ数: {staff.length}, 現在の階: {activeFloor}F (この階の部屋: {currentRooms.length})
                </div>
                <strong>入力のヒント:</strong><br />
                1. クリックまたは矢印キーで移動<br />
                2. 数値キー <b>1-9</b> または上のパレットクリックで<b>作業者を選択</b>（そのままセルに入力されます）<br />
                3. 取り消し: <b>0</b> または <b>Backspace</b> でセルをクリア<br />
                4. <b>Ctrl+D</b> またはマウスのドラッグで上の値を下にコピー
            </div>
        </div>
    );
}

export default FastEntry;
