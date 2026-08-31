import React, { useEffect } from 'react';
import { Routes, Route, HashRouter, useLocation } from 'react-router-dom';
import Landing from './components/Landing';
import Upload from './components/Upload';
import Processing from './components/Processing';
import BioProfile from './components/BioProfile';
import Recent from './components/Recent';
import Templates from './components/Templates';
import Guide from './components/Guide';
import Sidebar from './components/Sidebar';

// Global icon re-initialization on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <div className="app-container">
        <Sidebar />
        <main className="main-content-wrapper">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/processing/:jobId" element={<Processing />} />
            <Route path="/bioprofiles/:id" element={<BioProfile />} />
            <Route path="/recent" element={<Recent />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/guide" element={<Guide />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
