import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Crown, Shield, User, Trash2, X } from 'lucide-react';
import api from '../services/api';

interface Member {
  _id: string;
  id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user: {
    _id: string;
    id: string;
    email: string;
    name?: string;
  };
}

interface WorkspaceMembersProps {
  workspaceId: string;
  userRole?: string;
}

const WorkspaceMembers: React.FC<WorkspaceMembersProps> = ({ workspaceId, userRole }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageMembers = userRole === 'owner' || userRole === 'admin';

  useEffect(() => {
    fetchMembers();
  }, [workspaceId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/workspaces/${workspaceId}/members`);
      setMembers(response.data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      setError(null);
      await api.post(`/workspaces/${workspaceId}/members`, {
        user_email: inviteEmail,
        role: inviteRole
      });
      await fetchMembers();
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (error: any) {
      console.error('Error inviting member:', error);
      setError(error.response?.data?.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      await api.put(`/workspaces/${workspaceId}/members/${memberId}`, {
        role: newRole
      });
      await fetchMembers();
    } catch (error) {
      console.error('Error updating member role:', error);
      alert('Failed to update member role');
    }
  };

  const removeMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
      await fetchMembers();
    } catch (error: any) {
      console.error('Error removing member:', error);
      alert(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-700';
      case 'admin': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
          <span className="text-sm text-gray-500">({members.length})</span>
        </div>
        {canManageMembers && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member._id || member.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                {(member.user?.name || member.user?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-gray-900 truncate">
                    {member.user?.name || member.user?.email}
                  </p>
                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(member.role)}`}>
                    {getRoleIcon(member.role)}
                    <span className="capitalize">{member.role}</span>
                  </span>
                </div>
                {member.user?.name && (
                  <p className="text-sm text-gray-500 truncate">{member.user?.email}</p>
                )}
              </div>
            </div>

            {canManageMembers && member.role !== 'owner' && (
              <div className="flex items-center space-x-2 ml-4">
                <select
                  value={member.role}
                  onChange={(e) => updateMemberRole(member._id || member.id, e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  {userRole === 'owner' && <option value="owner">Owner</option>}
                </select>
                <button
                  onClick={() => removeMember(member._id || member.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteRole('member');
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="colleague@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="space-y-2">
                  <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      value="member"
                      checked={inviteRole === 'member'}
                      onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Member</div>
                      <div className="text-xs text-gray-500">Can view and edit workspace content</div>
                    </div>
                  </label>
                  <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={inviteRole === 'admin'}
                      onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Admin</div>
                      <div className="text-xs text-gray-500">Can manage members and workspace settings</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteRole('member');
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={inviteMember}
                  disabled={!inviteEmail.trim() || inviting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceMembers;
