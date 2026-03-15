import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiDownload, FiChevronDown, FiChevronUp, FiUploadCloud, FiEdit2, FiXCircle, FiFileText } from 'react-icons/fi';
import { BiFilterAlt } from 'react-icons/bi';
import api from '../api';
import './MySubmissions.css';

/* ── PDF Receipt Generator ── */
function downloadReceipt(sub) {
    const receiptHTML = `
        <!DOCTYPE html>
        <html><head>
            <title>Activity Submission Receipt</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; color: #1a1a2e; }
                .header { text-align: center; border-bottom: 2px solid #4C9AFF; padding-bottom: 16px; margin-bottom: 24px; }
                .header h1 { font-size: 1.3rem; margin: 0 0 4px; color: #4C9AFF; }
                .header p { font-size: 0.85rem; color: #6b7280; margin: 0; }
                .field { display: flex; border-bottom: 1px solid #f0f0f0; padding: 10px 0; }
                .field-label { width: 180px; font-weight: 600; font-size: 0.85rem; color: #6b7280; }
                .field-value { flex: 1; font-size: 0.85rem; }
                .status-approved { color: #16a34a; font-weight: 600; }
                .status-modified { color: #ea580c; font-weight: 600; }
                .footer { margin-top: 40px; text-align: center; font-size: 0.75rem; color: #9ca3af; }
                @media print { body { padding: 20px; } }
            </style>
        </head><body>
            <div class="header">
                <h1>Student Activity Points — Submission Receipt</h1>
                <p>SAPT — Student Activity Points Tracker</p>
            </div>
            <div class="field"><span class="field-label">Activity Name</span><span class="field-value">${sub.activityName || ''}</span></div>
            <div class="field"><span class="field-label">Category</span><span class="field-value">${sub.activityLevel || ''} Level</span></div>
            <div class="field"><span class="field-label">Submission Date</span><span class="field-value">${sub.createdAt ? new Date(sub.createdAt).toLocaleString() : ''}</span></div>
            <div class="field"><span class="field-label">Status</span><span class="field-value status-${(sub.status || '').toLowerCase()}">${sub.status}</span></div>
            <div class="field"><span class="field-label">Points Requested</span><span class="field-value">${sub.pointsRequested}</span></div>
            <div class="field"><span class="field-label">Points Approved</span><span class="field-value">${sub.pointsApproved || '—'}</span></div>
            ${sub.reviewedAt ? `<div class="field"><span class="field-label">Reviewed On</span><span class="field-value">${new Date(sub.reviewedAt).toLocaleString()}</span></div>` : ''}
            ${sub.reviewComments ? `<div class="field"><span class="field-label">FA Comments</span><span class="field-value">${sub.reviewComments}</span></div>` : ''}
            <div class="footer">
                <p>This is a system-generated receipt. No signature is required.</p>
                <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
        </body></html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

export default function MySubmissions() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [expandedRow, setExpandedRow] = useState(null);
    const [search, setSearch] = useState('');
    const [submissions, setSubmissions] = useState([]);
    const [confirmWithdraw, setConfirmWithdraw] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previewDocUrl, setPreviewDocUrl] = useState(null);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        try {
            const res = await api.get('/submissions');
            setSubmissions(res.data);
        } catch (error) {
            console.error("Failed to fetch submissions", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const handleWithdraw = async (id) => {
        try {
            await api.delete(`/submissions/${id}`);
            setSubmissions(submissions.filter((s) => s._id !== id));
            setConfirmWithdraw(null);
            setExpandedRow(null);
        } catch (error) {
            console.error("Failed to withdraw", error);
            alert("Error withdrawing submission");
        }
    };

    const statusClass = (s) => {
        switch (s) {
            case 'Approved': return 'status-approved';
            case 'Denied': return 'status-denied';
            case 'Pending': return 'status-pending';
            case 'Modified': return 'status-modified';
            case 'Draft': return 'status-draft';
            default: return '';
        }
    };

    // Split submissions for each tab
    const allSubmissions = submissions.filter(s => s.status !== 'Draft');
    const draftSubmissions = submissions.filter(s => s.status === 'Draft');

    if (loading) {
        return <div className="submissions-page" style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading submissions...</div>;
    }

    return (
        <div className="submissions-page">
            {/* Withdraw Confirmation Modal */}
            {confirmWithdraw !== null && (
                <div className="withdraw-overlay" onClick={() => setConfirmWithdraw(null)}>
                    <div className="withdraw-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="withdraw-modal-title">Withdraw Submission?</h3>
                        <p className="withdraw-modal-text">
                            Are you sure you want to withdraw this submission? This action cannot be undone.
                        </p>
                        <div className="withdraw-modal-actions">
                            <button className="withdraw-cancel-btn" onClick={() => setConfirmWithdraw(null)}>Cancel</button>
                            <button className="withdraw-confirm-btn" onClick={() => handleWithdraw(confirmWithdraw)}>Yes, Withdraw</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Preview Modal */}
            {previewDocUrl && (
                <div className="preview-modal-overlay" onClick={() => setPreviewDocUrl(null)}>
                    <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="preview-close-btn" onClick={() => setPreviewDocUrl(null)}>
                            <FiXCircle size={24} />
                        </button>
                        <iframe
                            src={previewDocUrl}
                            title="Document Preview"
                            className="preview-iframe"
                        />
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="submissions-tabs">
                <button
                    className={`sub-tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('all'); setExpandedRow(null); }}
                >
                    All Submissions
                </button>
                <button
                    className={`sub-tab ${activeTab === 'drafts' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('drafts'); setExpandedRow(null); }}
                >
                    Drafts
                </button>
            </div>

            {/* Toolbar */}
            <div className="submissions-toolbar">
                <div className="search-group">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search with activity name"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="search-btn">
                        <FiSearch className="btn-ic" />
                        Search
                    </button>
                </div>
                <div className="toolbar-actions">
                    <button className="filter-btn">
                        <BiFilterAlt className="btn-ic" />
                        By Approved
                        <FiChevronDown className="btn-ic-sm" />
                    </button>
                    <button className="export-btn">
                        <FiDownload className="btn-ic" />
                        Export
                    </button>
                </div>
            </div>

            {/* Table */}
            {activeTab === 'all' ? (
                <div className="sub-table-wrapper">
                    <div className="sub-table-header">
                        <span className="col-name">Activity Name</span>
                        <span className="col-cat">Category</span>
                        <span className="col-pts">Points Approved/Requested</span>
                        <span className="col-time">Upload Time</span>
                        <span className="col-file">Documents</span>
                        <span className="col-status">Status</span>
                        <span className="col-expand" />
                    </div>

                    {allSubmissions.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No submissions yet. Create one!</div>
                    ) : (
                        allSubmissions.map((sub) => (
                            <div key={sub._id}>
                                <div className="sub-table-row">
                                    <span className="col-name">{sub.activityName || '—'}</span>
                                    <span className="col-cat">
                                        <span className={`category-badge ${(sub.activityLevel || '').toLowerCase()}`}>{sub.activityLevel || '—'}</span>
                                    </span>
                                    <span className="col-pts">{sub.pointsApproved || 0}/{sub.pointsRequested || 0}</span>
                                    <span className="col-time">{sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '—'}</span>
                                    <span className="col-file">
                                        {sub.documents && sub.documents.length > 0 ? (
                                            <span className="preview-link" style={{ cursor: 'pointer' }} onClick={() => toggleExpand(sub._id)}>
                                                {sub.documents.length} file{sub.documents.length > 1 ? 's' : ''}
                                            </span>
                                        ) : '—'}
                                    </span>
                                    <span className="col-status">
                                        <span className={`status-badge ${statusClass(sub.status)}`}>
                                            <span className="status-dot-inline" />
                                            {sub.status}
                                        </span>
                                    </span>
                                    <span className="col-expand">
                                        <button className="expand-btn" onClick={() => toggleExpand(sub._id)} aria-label="Toggle details">
                                            {expandedRow === sub._id ? <FiChevronUp /> : <FiChevronDown />}
                                        </button>
                                    </span>
                                </div>

                                {/* Expanded details */}
                                {expandedRow === sub._id && (
                                    <div className="sub-expanded">
                                        {/* Document previews */}
                                        {sub.documents && sub.documents.length > 0 && (
                                            <div className="docs-preview-section" style={{ marginBottom: '1rem' }}>
                                                <h4 style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Attached Documents</h4>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    {sub.documents.map((doc) => (
                                                        <button
                                                            key={doc._id}
                                                            onClick={() => setPreviewDocUrl(doc.fileUrl)}
                                                            style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                                padding: '0.4rem 0.8rem', borderRadius: '6px',
                                                                background: '#f0f4ff', color: '#4C9AFF',
                                                                fontSize: '0.8rem', border: '1px solid #dbeafe',
                                                                transition: 'background 0.2s', cursor: 'pointer'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = '#f0f4ff'}
                                                        >
                                                            <FiFileText size={14} />
                                                            {doc.fileName}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {sub.status === 'Pending' && (
                                            <div className="pending-actions">
                                                <button className="action-edit-btn" onClick={() => navigate(`/new-submission/${sub._id}`)}>
                                                    <FiEdit2 className="action-btn-icon" />
                                                    Edit Submission
                                                </button>
                                                <button className="action-withdraw-btn" onClick={() => setConfirmWithdraw(sub._id)}>
                                                    <FiXCircle className="action-btn-icon" />
                                                    Withdraw
                                                </button>
                                            </div>
                                        )}

                                        {sub.reviewedBy && (
                                            <div className="fa-feedback-section">
                                                <h4 className="fa-feedback-heading">Faculty Advisor Review</h4>
                                                {sub.reviewedAt && (
                                                    <div className="fa-info-row">
                                                        <span className="fa-label">Reviewed On:</span>
                                                        <span className="fa-value">{new Date(sub.reviewedAt).toLocaleString()}</span>
                                                    </div>
                                                )}

                                                {sub.pointsApproved > 0 && sub.pointsApproved !== sub.pointsRequested && (
                                                    <div className="points-diff-block">
                                                        <div className="points-diff-item">
                                                            <span className="points-diff-label">Requested</span>
                                                            <span className="points-diff-val requested">{sub.pointsRequested}</span>
                                                        </div>
                                                        <span className="points-diff-arrow">→</span>
                                                        <div className="points-diff-item">
                                                            <span className="points-diff-label">Approved</span>
                                                            <span className="points-diff-val approved">{sub.pointsApproved}</span>
                                                        </div>
                                                        <span className={`points-diff-delta ${sub.pointsApproved < sub.pointsRequested ? 'negative' : 'positive'}`}>
                                                            {sub.pointsApproved > sub.pointsRequested ? '+' : ''}{sub.pointsApproved - sub.pointsRequested}
                                                        </span>
                                                    </div>
                                                )}

                                                {sub.reviewComments && (
                                                    <div className="fa-comments-block">
                                                        <span className="fa-label">Comments:</span>
                                                        <p className="fa-comments-text">{sub.reviewComments}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {(sub.status === 'Approved' || sub.status === 'Modified') && (
                                            <div className="receipt-section">
                                                <button className="download-receipt-btn" onClick={() => downloadReceipt(sub)}>
                                                    <FiFileText className="action-btn-icon" />
                                                    Download Receipt
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* Drafts tab */
                <div className="sub-table-wrapper">
                    <div className="sub-table-header drafts-header">
                        <span className="col-name">Activity Name</span>
                        <span className="col-cat">Category</span>
                        <span className="col-pts">Points Requested</span>
                        <span className="col-status">Status</span>
                        <span className="col-action">Action</span>
                    </div>

                    {draftSubmissions.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No drafts.</div>
                    ) : (
                        draftSubmissions.map((d) => (
                            <div className="sub-table-row drafts-row" key={d._id}>
                                <span className="col-name">{d.activityName || '—'}</span>
                                <span className="col-cat">
                                    <span className={`category-badge ${(d.activityLevel || '').toLowerCase()}`}>{d.activityLevel || '—'}</span>
                                </span>
                                <span className="col-pts">{d.pointsRequested || 0}</span>
                                <span className="col-status">
                                    <span className={`status-badge ${statusClass(d.status)}`}>
                                        <span className="status-dot-inline" />
                                        {d.status}
                                    </span>
                                </span>
                                <span className="col-action">
                                    <button className="upload-doc-btn" onClick={() => navigate(`/new-submission/${d._id}`)}>
                                        <FiUploadCloud className="btn-ic" />
                                        Edit/Upload
                                    </button>
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
