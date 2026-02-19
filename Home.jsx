import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div className="hero-content">
                <h2 className="welcome-text">WELCOME TO</h2>
                <h1 className="hero-title" style={{ fontSize: '3.5rem' }}>Smart Housekeeping System</h1>
                <p className="hero-subtitle">Special Edition for Kobe Port Tower Hotel</p>

                <div className="main-actions">
                    <button className="portal-btn primary" onClick={() => navigate('/entry')}>
                        <span className="icon">📝</span>
                        <span className="label">日報入力</span>
                    </button>
                    <button className="portal-btn" onClick={() => navigate('/daily')}>
                        <span className="icon">📊</span>
                        <span className="label">日次集計</span>
                    </button>
                    <button className="portal-btn" onClick={() => navigate('/monthly')}>
                        <span className="icon">📅</span>
                        <span className="label">月報集計</span>
                    </button>
                </div>
            </div>
            <div className="home-signature">
                operated by ベストクリエイト
            </div>
        </div>
    );
}

export default Home;
