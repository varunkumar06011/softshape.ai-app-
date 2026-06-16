import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TenantLoginScreen from './TenantLoginScreen';
import CashierDine from '../pages/CashierDine';

export default function TenantCashierWrapper() {
  const { slug, stationId } = useParams();
  const navigate = useNavigate();
  const sessionKey = `tenant_${slug}_cashier_${stationId}_auth`;
  const [authed, setAuthed] = useState(localStorage.getItem(sessionKey) === 'true');

  if (!authed) {
    return (
      <TenantLoginScreen
        slug={slug}
        role="cashier"
        stationId={stationId}
        onSuccess={(session) => {
          localStorage.setItem(sessionKey, 'true');
          localStorage.setItem(`tenant_${slug}_cashier_session`, JSON.stringify(session));
          localStorage.setItem('station_config', JSON.stringify({
            stationName: session.stationName,
            stationId: session.stationId,
            canReopen: session.canReopen || false,
            canExclude: session.canExclude !== false,
            canDiscount: session.canDiscount || false,
            canRefund: session.canRefund || false,
          }));
          setAuthed(true);
        }}
      />
    );
  }

  const sessionRaw = localStorage.getItem(`tenant_${slug}_cashier_session`);
  const session = sessionRaw ? JSON.parse(sessionRaw) : {};

  const allowedSections = (() => {
    try { return JSON.parse(session.allowedSections || '[]') } catch { return [] }
  })()
  const handleOnlineOrders = session.handleOnlineOrders || false

  if (session.menuUploaded === false) {
    return (
      <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-[48px] border border-[#FFCDD2] p-10 max-w-md w-full text-center">
          <h2 className="text-2xl font-black text-[#1A1A1A] mb-2">Menu not set up yet</h2>
          <p className="text-sm text-[#5C5C5C] mb-6">Your admin needs to upload the menu before this cashier station can go live.</p>
          <button
            onClick={() => navigate(`/tenant/${slug}`)}
            className="px-8 py-3 bg-[#E53935] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#B71C1C] active:scale-[0.98] transition-all"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <CashierDine
      slug={slug}
      restaurantId={session.restaurantId}
      stationId={stationId}
      menuFilter={session.menuFilter || 'FOOD'}
      allowedSections={allowedSections}
      handleOnlineOrders={handleOnlineOrders}
      onLogout={() => {
        localStorage.removeItem(sessionKey);
        localStorage.removeItem(`tenant_${slug}_cashier_session`);
        window.location.href = `/tenant/${slug}`;
      }}
    />
  );
}
