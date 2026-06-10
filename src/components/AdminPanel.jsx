import { useState, useEffect } from 'react';
import { subscribeAllUsers, approveUser, revokeUser } from '../utils/firestore';

export default function AdminPanel({ onClose }) {
  const [users, setUsers] = useState([]);

  useEffect(() => subscribeAllUsers(setUsers), []);

  const pending = users.filter(u => u.role === 'pending');
  const approved = users.filter(u => u.role === 'staff' || u.role === 'admin');

  const roleLabel = { pending: '承認待ち', staff: 'スタッフ', admin: '管理者' };
  const roleColor = { pending: '#f59e0b', staff: '#10b981', admin: '#7c3aed' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 448, borderRadius: '20px 20px 0 0', background: '#fff', boxShadow: '0 -4px 32px rgba(0,0,0,0.12)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>

        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 12px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 'bold', color: '#111827' }}>👑 ユーザー管理</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px 32px' }}>

          {/* 承認待ち */}
          {pending.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                ⏳ 承認待ち ({pending.length}名)
              </p>
              {pending.map(u => (
                <UserRow key={u.uid} user={u} roleLabel={roleLabel} roleColor={roleColor}
                  onApprove={() => approveUser(u.uid)}
                  onRevoke={null}
                />
              ))}
            </div>
          )}

          {/* 承認済み */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: '0 0 10px' }}>
              承認済み ({approved.length}名)
            </p>
            {approved.length === 0 ? (
              <p style={{ fontSize: 13, color: '#d1d5db', textAlign: 'center', padding: '16px 0' }}>なし</p>
            ) : (
              approved.map(u => (
                <UserRow key={u.uid} user={u} roleLabel={roleLabel} roleColor={roleColor}
                  onApprove={null}
                  onRevoke={u.role !== 'admin' ? () => revokeUser(u.uid) : null}
                />
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function UserRow({ user, roleLabel, roleColor, onApprove, onRevoke }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: '#f9fafb', border: '1px solid #e5e7eb', marginBottom: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.name || user.email}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.name ? user.email + ' · ' : ''}{new Date(user.createdAt).toLocaleDateString('ja-JP')} 登録
        </p>
      </div>
      <span style={{ fontSize: 11, fontWeight: 'bold', padding: '3px 8px', borderRadius: 20, background: roleColor[user.role] + '18', color: roleColor[user.role], flexShrink: 0 }}>
        {roleLabel[user.role]}
      </span>
      {onApprove && (
        <button onClick={onApprove}
          style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 'bold', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #db2777)', color: '#fff', flexShrink: 0 }}>
          承認
        </button>
      )}
      {onRevoke && (
        <button onClick={onRevoke}
          style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 'bold', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', background: 'rgba(239,68,68,0.06)', color: '#ef4444', flexShrink: 0 }}>
          取消
        </button>
      )}
    </div>
  );
}