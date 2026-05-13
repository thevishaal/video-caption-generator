import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import page components here
// import LandingPage from './pages/Landing';
// import VideoEditorPage from './pages/VideoEditor';

const AppRoutes = () => {
    return (

        <>
            <Router>

                <Routes>
                    {/* <Route path="/" element={<LandingPage />} />
                    <Route path="/editor" element={<VideoEditorPage />} />
                    <Route path="/" element={<VideoEditorPage />} /> */}
                </Routes>
            </Router>


        </>

    );
};

export default AppRoutes;