import { useState, useEffect } from 'react';
import { subscribeAllUsers, approveUser, revokeUser, setUserRole, deleteAllStoreData } from '../utils/firestore';
import { STORES } from '../utils/stores';
import { auth } from '../utils/firebase';

export default function AdminPanel({ onClose }) {
  const [users, setUsers] = useState([]);
  const [deleting, setDeleting] = useState('');
  const currentUid = auth.currentUser?.uid;

  function handleChangeRole(u, nextRole) {
    if (u.role === nextRole) return;
    const who = u.name || '（名前未設定）';
    const labels = {
      viewer: '閲覧者（閲覧・検索のみ）',
      editor: '編集者（ボトル追加・編集・削除、キャスト管理）',
      admin: '管理者（全機能・ユーザー管理・データインポート可）',
    };
    if (window.confirm(`${who} を ${labels[nextRole]} に変更しますか？`)) {
      setUserRole(u.uid, nextRole);
    }
  }

  useEffect(() => subscribeAllUsers(setUsers), []);

  async function handleDeleteStore(storeId, name) {
    if (deleting) return;
    if (!window.confirm(`【${name}】の全ボトルデータとキャスト一覧を削除します。\nこの操作は取り消せません。本当に削除しますか？`)) return;
    if (!window.confirm(`本当によろしいですか？\n【${name}】のデータは完全に消去されます。`)) return;
    setDeleting(storeId);
    try {
      const count = await deleteAllStoreData(storeId);
      alert(`【${name}】のデータを削除しました（ボトル ${count} 本）`);
    } catch (err) {
      alert('削除に失敗しました: ' + (err.message || err));
    } finally {
      setDeleting('');
    }
  }

  const APPROVED_ROLES = ['viewer', 'staff', 'editor', 'admin'];
  const pending = users.filter(u => u.role === 'pending');
  const approved = users.filter(u => APPROVED_ROLES.includes(u.role));

  // staff は旧ロール。閲覧者扱いだが視認のためラベルだけ「閲覧者(旧)」と表示
  const roleLabel = { pending: '承認待ち', viewer: '閲覧者', staff: '閲覧者', editor: '編集者', admin: '管理者' };
  const roleColor = { pending: '#f59e0b', viewer: '#10b981', staff: '#10b981', editor: '#2563eb', admin: '#7c3aed' };

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
              approved.map(u => {
                const isSelf = u.uid === currentUid;
                return (
                  <UserRow key={u.uid} user={u} roleLabel={roleLabel} roleColor={roleColor}
                    isSelf={isSelf}
                    onApprove={null}
                    onChangeRole={isSelf ? null : (next) => handleChangeRole(u, next)}
                    onRevoke={(!isSelf && u.role !== 'admin') ? () => revokeUser(u.uid) : null}
                  />
                );
              })
            )}
          </div>

          {/* 店舗データの削除 */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚠️ 店舗データの削除
            </p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 12px' }}>
              選択した店舗のボトル・キャストを全て削除します（取り消せません）
            </p>
            {STORES.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 8 }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>
                  🏬 {s.name}
                </span>
                <button onClick={() => handleDeleteStore(s.id, s.name)} disabled={!!deleting}
                  style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 'bold', border: 'none', cursor: deleting ? 'default' : 'pointer', background: '#ef4444', color: '#fff', flexShrink: 0, opacity: deleting ? 0.5 : 1 }}>
                  {deleting === s.id ? '削除中...' : 'データ削除'}
                </button>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

function UserRow({ user, roleLabel, roleColor, onApprove, onChangeRole, onRevoke, isSelf }) {
  // staff (旧) は viewer と同等に扱う
  const currentRole = user.role === 'staff' ? 'viewer' : user.role;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', borderRadius: 12, background: '#f9fafb', border: '1px solid #e5e7eb', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name || '（名前未設定）'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {new Date(user.createdAt).toLocaleDateString('ja-JP')} 登録
          </p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 'bold', padding: '3px 8px', borderRadius: 20, background: roleColor[user.role] + '18', color: roleColor[user.role], flexShrink: 0 }}>
          {roleLabel[user.role] || user.role}
        </span>
        {isSelf && (
          <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>あなた</span>
        )}
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
      {onChangeRole && (
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { value: 'viewer', label: '閲覧者' },
            { value: 'editor', label: '編集者' },
            { value: 'admin', label: '管理者' },
          ].map(opt => {
            const isActive = currentRole === opt.value;
            const color = roleColor[opt.value];
            return (
              <button key={opt.value} onClick={() => onChangeRole(opt.value)} disabled={isActive}
                style={{
                  flex: 1, padding: '6px 8px', borderRadius: 8, fontSize: 11, fontWeight: 'bold',
                  cursor: isActive ? 'default' : 'pointer',
                  border: isActive ? `1px solid ${color}` : '1px solid #e5e7eb',
                  background: isActive ? color + '14' : '#fff',
                  color: isActive ? color : '#6b7280',
                }}>
                {opt.label}{isActive ? '✓' : ''}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}