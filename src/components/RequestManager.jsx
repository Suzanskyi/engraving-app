import React, { useState, useEffect } from 'react';
import { RequestStorage } from '../services/index.js';
import './RequestManager.css';

const RequestManager = ({ onModifyRequest, onNavigateToMain }) => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // Load requests and stats
  useEffect(() => {
    loadRequests();
  }, []);

  // Filter requests based on search and status
  useEffect(() => {
    let filtered = requests;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(request => 
        request.customerInfo.name.toLowerCase().includes(term) ||
        request.customerInfo.email.toLowerCase().includes(term) ||
        request.id.toLowerCase().includes(term) ||
        request.customText.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [allRequests, requestStats] = await Promise.all([
        RequestStorage.getAllRequests(),
        RequestStorage.getRequestStats()
      ]);
      
      setRequests(allRequests);
      setStats(requestStats);
    } catch (err) {
      console.error('Failed to load requests:', err);
      setError(`Failed to load requests: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await RequestStorage.updateRequestStatus(requestId, newStatus);
      await loadRequests();
    } catch (error) {
      alert(`Error updating status: ${error.message}`);
    }
  };

  const handleCancelRequest = (requestId) => {
    setShowConfirmDialog({ type: 'cancel', requestId });
  };

  const confirmCancel = async () => {
    if (showConfirmDialog?.type === 'cancel') {
      try {
        const success = await RequestStorage.cancelRequest(showConfirmDialog.requestId);
        if (success) {
          await loadRequests();
          if (selectedRequest?.id === showConfirmDialog.requestId) {
            setSelectedRequest(null);
          }
        } else {
          alert('Failed to cancel request');
        }
      } catch (error) {
        alert(`Error canceling request: ${error.message}`);
      }
    }
    setShowConfirmDialog(null);
  };

  const handleModifyRequest = (request) => {
    if (onModifyRequest) {
      onModifyRequest(request);
    }
  };

  const exportRequests = () => {
    const dataStr = JSON.stringify(filteredRequests, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `engraving-requests-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'processing': return '#3498db';
      case 'completed': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="request-manager">
      <div className="request-manager-header">
        <h2>My Requests</h2>
        <div className="header-actions">
          <button className="back-btn" onClick={onNavigateToMain}>← Back to Main</button>
          <button className="refresh-btn" onClick={loadRequests} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadRequests}>Try Again</button>
        </div>
      )}

      {/* Statistics Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <h3>Total Requests</h3>
          <span className="stat-number">{stats.total || 0}</span>
        </div>
        <div className="stat-card">
          <h3>Recent (24h)</h3>
          <span className="stat-number">{stats.recent || 0}</span>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <span className="stat-number">{stats.byStatus?.pending || 0}</span>
        </div>
        <div className="stat-card">
          <h3>Processing</h3>
          <span className="stat-number">{stats.byStatus?.processing || 0}</span>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <span className="stat-number">{stats.byStatus?.completed || 0}</span>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="controls">
        <div className="search-controls">
          <input
            type="text"
            placeholder="Search by name, email, ID, or text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button onClick={exportRequests} className="export-btn">
          Export Data
        </button>
      </div>

      <div className="request-manager-content">
        {/* Request List */}
        <div className="request-list">
          <h3>Requests ({loading ? '...' : filteredRequests.length})</h3>
          {loading ? (
            <div className="loading-message">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="no-requests">
              {requests.length === 0 ? 'No requests found' : 'No requests match your filters'}
            </div>
          ) : (
            <div className="request-items">
              {filteredRequests.map(request => (
                <div
                  key={request.id}
                  className={`request-item ${selectedRequest?.id === request.id ? 'selected' : ''}`}
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="request-item-header">
                    <span className="request-id">#{request.id.slice(0, 8)}</span>
                    <span 
                      className="request-status"
                      style={{ backgroundColor: getStatusColor(request.status) }}
                    >
                      {request.status}
                    </span>
                  </div>
                  <div className="request-item-info">
                    <div className="customer-name">{request.customerInfo.name}</div>
                    <div className="request-text">"{request.customText}"</div>
                    <div className="request-date">{formatDate(request.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Request Detail View */}
        {selectedRequest ? (
          <div className="request-detail">
            <div className="request-detail-header">
              <h3>Request Details</h3>
              <div className="request-actions">
                <select
                  value={selectedRequest.status}
                  onChange={(e) => handleStatusChange(selectedRequest.id, e.target.value)}
                  className="status-select"
                  aria-label="Request status"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                </select>
                <button
                  onClick={() => handleModifyRequest(selectedRequest)}
                  className="modify-btn"
                  disabled={selectedRequest.status === 'completed'}
                >
                  Modify
                </button>
                <button
                  onClick={() => handleCancelRequest(selectedRequest.id)}
                  className="cancel-btn"
                  disabled={selectedRequest.status === 'completed'}
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="request-detail-content">
              <div className="detail-section">
                <h4>Request Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Request ID:</label>
                    <span>{selectedRequest.id}</span>
                  </div>
                  <div className="detail-item">
                    <label>Submitted:</label>
                    <span>{formatDate(selectedRequest.timestamp)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span style={{ color: getStatusColor(selectedRequest.status) }}>
                      {selectedRequest.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Customer Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{selectedRequest.customerInfo.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedRequest.customerInfo.email}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <span>{selectedRequest.customerInfo.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Engraving Details</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Text:</label>
                    <span>"{selectedRequest.customText}"</span>
                  </div>
                  <div className="detail-item">
                    <label>Font:</label>
                    <span>{selectedRequest.font}</span>
                  </div>
                  <div className="detail-item">
                    <label>Font Size:</label>
                    <span>{selectedRequest.fontSize}px</span>
                  </div>
                  <div className="detail-item">
                    <label>Position:</label>
                    <span>X: {selectedRequest.textPosition.x}%, Y: {selectedRequest.textPosition.y}%</span>
                  </div>
                </div>
              </div>

              {selectedRequest.comments && (
                <div className="detail-section">
                  <h4>Comments</h4>
                  <p>{selectedRequest.comments}</p>
                </div>
              )}

              {(selectedRequest.composedImage || selectedRequest.originalImage) && (
                <div className="detail-section">
                  <h4>{selectedRequest.composedImage ? 'Final Design Preview' : 'Original Image'}</h4>
                  <img 
                    src={selectedRequest.composedImage || selectedRequest.originalImage} 
                    alt={selectedRequest.composedImage ? 'Final composed design' : 'Original uploaded image'}
                    className="detail-image"
                  />
                  {selectedRequest.composedImage && selectedRequest.originalImage && (
                    <div style={{ marginTop: '1rem' }}>
                      <h4>Original Image</h4>
                      <img 
                        src={selectedRequest.originalImage} 
                        alt="Original uploaded image"
                        className="detail-image"
                        style={{ maxWidth: '300px' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="request-detail empty-detail">
            <div className="empty-detail-card">
              <h3>Select a request</h3>
              <p>Choose an order from the list to review customer details, engraving settings, and preview images.</p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="modal-overlay">
          <div className="confirmation-dialog">
            <h3>Confirm Action</h3>
            <p>
              {showConfirmDialog.type === 'cancel' 
                ? 'Are you sure you want to cancel this request? This action cannot be undone.'
                : 'Are you sure you want to proceed?'
              }
            </p>
            <div className="dialog-actions">
              <button onClick={() => setShowConfirmDialog(null)} className="cancel-dialog-btn">
                No, Keep Request
              </button>
              <button onClick={confirmCancel} className="confirm-dialog-btn">
                Yes, Cancel Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestManager;
