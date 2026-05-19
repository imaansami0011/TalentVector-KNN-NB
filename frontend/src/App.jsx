import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import IdentityGateway from './pages/IdentityGateway';
import MarketDiscovery from './pages/MarketDiscovery';
import DataIngestion from './pages/DataIngestion';
import ProfileVerification from './pages/ProfileVerification';
import RecruiterPortal from './pages/RecruiterPortal';
import RecruiterOnboarding from './pages/RecruiterOnboarding';
import UserProfile from './pages/UserProfile';

import JDSourcing from './pages/JDSourcing';

export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<IdentityGateway />} />
          <Route path="/browse" element={<MarketDiscovery />} />
          <Route path="/onboarding" element={<DataIngestion />} />
          <Route path="/sourcing" element={<JDSourcing />} />
          <Route path="/profile" element={<ProfileVerification />} />
          <Route path="/recruiter" element={<RecruiterPortal />} />
          <Route path="/recruiter-onboarding" element={<RecruiterOnboarding />} />
          <Route path="/user-profile" element={<UserProfile />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
