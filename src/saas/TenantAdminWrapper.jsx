import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import TenantLoginScreen from './TenantLoginScreen';
import AdminDashboard from '../pages/AdminDashboard';

export default function TenantAdminWrapper() {
  const { slug } = useParams();
  const sessionKey = `tenant_${slug}_admin_auth`;
  const [authed, setAuthed] = useState(localStorage.getItem(sessionKey) === 'true');

  if (!authed) {
    return (
      <TenantLoginScreen
        slug={slug}
        role="admin"
        onSuccess={(session) => {
          localStorage.setItem(sessionKey, 'true');
          localStorage.setItem(`tenant_${slug}_restaurantId`, session.restaurantId);
          setAuthed(true);
        }}
      />
    );
  }

  const restaurantId = localStorage.getItem(`tenant_${slug}_restaurantId`);

  return (
    <AdminDashboard
      role="admin"
      restaurantId={restaurantId}
      onLogout={() => {
        localStorage.removeItem(sessionKey);
        window.location.href = `/tenant/${slug}`;
      }}
    />
  );
}
