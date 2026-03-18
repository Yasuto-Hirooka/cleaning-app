import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:8000/api`;

function Settings() {
    const [restoring, setRestoring] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleExport = async () => {
        try {
            const response = await axios.get(`${API_BASE}/admin/export`);
            const data = response.data;
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cleaning_data_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            alert('Export failed.');
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            alert('Please select a JSON file first.');
            return;
        }

        const confirm1 = window.confirm('【警告】データを復元すると、現在のすべての履歴が上書きされます。よろしいですか？');
        if (!confirm1) return;
        const confirm2 = window.confirm('本当に実行してよろしいですか？取り消しはできません。');
        if (!confirm2) return;

        setRestoring(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target.result);
                await axios.post(`${API_BASE}/admin/import`, json);
                alert('Database restored successfully! The application will now reload.');
                window.location.reload();
            } catch (err) {
                alert('Restore failed: ' + err.message);
            } finally {
                setRestoring(false);
            }
        };
        reader.readAsText(selectedFile);
    };

    return (
        <div className="card">
            <h1>データ管理 (バックアップ・復元)</h1>
            <p style={{ color: '#888', marginBottom: '2rem' }}>
                システムのデータを管理し、バックアップと復元を行います。
            </p>

            <section style={{ marginBottom: '3rem' }}>
                <h3>1. バックアップ (JSON Export)</h3>
                <p>これまでの全履歴（スタッフ・部屋・清掃記録）をJSONファイルとしてダウンロードします。</p>
                <button className="btn primary" onClick={handleExport}>全データのバックアップ</button>
            </section>

            <section style={{ padding: '2rem', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '1rem' }}>
                <h3>2. データの復元 (JSON Import)</h3>
                <p style={{ color: '#ff6b6b' }}>
                    <strong>注意:</strong> 指定したファイルの内容で現在のデータベースがすべて置き換わります。
                </p>
                <input
                    type="file"
                    accept=".json"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    style={{ marginBottom: '1rem', display: 'block' }}
                />
                <button
                    className="btn danger"
                    onClick={handleImport}
                    disabled={restoring || !selectedFile}
                >
                    {restoring ? 'Restoring...' : 'データを復元'}
                </button>
            </section>
        </div>
    );
}

export default Settings;
