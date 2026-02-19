import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/analyze';

function ImageUpload() {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;

        setLoading(true);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post(API_URL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            // Redirect to confirmation with result
            navigate('/confirm', { state: { analysisResult: response.data.result } });
        } catch (error) {
            console.error('Error analyzing image:', error);
            alert('Error analyzing image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h2>Image Analysis</h2>
            <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
                Upload a photo of the daily report to extract staff Name, Room Number, and Cleaning Items.
            </p>

            <div className="form-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ width: '100%' }}
                />

                {preview && (
                    <div style={{ marginTop: '1rem', width: '100%', textAlign: 'center' }}>
                        <img
                            src={preview}
                            alt="Preview"
                            style={{ maxHeight: '300px', maxWidth: '100%', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}
                        />
                    </div>
                )}

                {selectedFile && (
                    <button
                        onClick={handleAnalyze}
                        className="btn"
                        style={{ marginTop: '1rem', width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Analyzing...' : 'Analyze Image'}
                    </button>
                )}
            </div>
        </div>
    );
}

export default ImageUpload;
