import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import TenantLoginScreen from './TenantLoginScreen';
import CaptainPanel from '../pages/CaptainPanel';

export default function TenantCaptainWrapper() {
  const { slug } = useParams();
  const sessionKey = `tenant_${slug}_captain_auth`;
  const [authed, setAuthed] = useState(localStorage.getItem(sessionKey) === 'true');

  if (!authed) {
    return (
      <TenantLoginScreen
        slug={slug}
        role="captain"
        onSuccess={(session) => {
          localStorage.setItem(sessionKey, 'true');
          localStorage.setItem(`tenant_${slug}_captain_session`, JSON.stringify(session));
          setAuthed(true);
        }}
      />
    );
  }

  const sessionRaw = localStorage.getItem(`tenant_${slug}_captain_session`);
  const session = sessionRaw ? JSON.parse(sessionRaw) : {};

  return (
    <CaptainPanel
      slug={slug}
      restaurantId={session.restaurantId}
      onLogout={() => {
        localStorage.removeItem(sessionKey);
        localStorage.removeItem(`tenant_${slug}_captain_session`);
        window.location.href = `/tenant/${slug}`;
      }}
    />
  );
}
