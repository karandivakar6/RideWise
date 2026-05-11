import React, { useState, useEffect } from 'react';
import { Users, FileText, Activity, LogOut } from 'lucide-react';

export default function AdminDashboard({ user, onLogout, darkMode }) {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'reports'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching users with token:', token);
      
      // Fetch users
      const usersRes = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Users response status:', usersRes.status);
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        console.log('Users data:', usersData);
        setUsers(usersData);
      } else {
        const errorData = await usersRes.json();
        console.error('Failed to fetch users:', errorData);
        throw new Error(errorData.msg || 'Failed to fetch users');
      }
      
      // Fetch reports
      const reportsRes = await fetch('http://localhost:5000/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        console.log('Reports data:', reportsData);
        setReports(reportsData);
      }
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Failed to update report:', err);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Loading Dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950' : 'bg-slate-50'} p-6`}>
      {/* Header */}
      <div className={`max-w-7xl mx-auto mb-8 ${darkMode ? 'bg-slate-900' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-black uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Admin Dashboard
            </h1>
            <p className={`text-sm font-semibold mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Welcome back, {user.name}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-red-600/10 border border-red-600/40 text-red-600 p-4 rounded-xl">
            <p className="font-bold">Error: {error}</p>
            <button 
              onClick={fetchData}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`${darkMode ? 'bg-slate-900' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/20 rounded-xl">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Users</p>
              <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className={`${darkMode ? 'bg-slate-900' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600/20 rounded-xl">
              <Activity className="text-emerald-600" size={24} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Rides</p>
              <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {users.reduce((sum, u) => sum + (u.rideCount || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className={`${darkMode ? 'bg-slate-900' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-600/20 rounded-xl">
              <FileText className="text-orange-600" size={24} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Pending Reports</p>
              <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {reports.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-bold rounded-xl transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : darkMode
                ? 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 font-bold rounded-xl transition-colors ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white'
                : darkMode
                ? 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Reports ({reports.filter(r => r.status === 'pending').length} pending)
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'users' ? (
          <div className={`${darkMode ? 'bg-slate-900' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
            <h2 className={`text-xl font-black mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              User Management
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <th className={`text-left py-3 px-4 font-bold text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Name</th>
                    <th className={`text-left py-3 px-4 font-bold text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Email</th>
                    <th className={`text-left py-3 px-4 font-bold text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Rides</th>
                    <th className={`text-left py-3 px-4 font-bold text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <td className={`py-3 px-4 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{u.name}</td>
                      <td className={`py-3 px-4 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{u.email}</td>
                      <td className={`py-3 px-4 text-sm font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{u.rideCount || 0}</td>
                      <td className={`py-3 px-4 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={`${darkMode ? 'bg-slate-900' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
            <h2 className={`text-xl font-black mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Bug Reports
            </h2>
            <div className="space-y-4">
              {reports.map((report, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {report.userId?.name || 'Unknown User'}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {report.userId?.email || 'No email'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        report.status === 'pending' ? 'bg-orange-600/20 text-orange-600' :
                        report.status === 'resolved' ? 'bg-emerald-600/20 text-emerald-600' :
                        'bg-slate-600/20 text-slate-600'
                      }`}>
                        {report.status.toUpperCase()}
                      </span>
                      {report.status === 'pending' && (
                        <button
                          onClick={() => updateReportStatus(report._id, 'resolved')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {report.description}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    Submitted: {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {reports.length === 0 && (
                <p className={`text-center py-8 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  No reports yet
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
