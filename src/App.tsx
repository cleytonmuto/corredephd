import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import PostDetail from './pages/PostDetail';
import SiteSettings from './pages/SiteSettings';
import { getSiteSettingsOrDefault, applyTheme, applyCustomCSS, applyColorVariables } from './utils/siteSettings';
import './App.css';
import './styles/themes.css';

function App() {
  useEffect(() => {
    // Load and apply site settings on app start
    const loadSettings = async () => {
      const settings = await getSiteSettingsOrDefault();
      applyTheme(settings.theme);
      applyCustomCSS(settings.customCSS);
      applyColorVariables(settings.primaryColor, settings.secondaryColor);
    };
    loadSettings();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/edit-post/:id" element={<EditPost />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/site-settings" element={<SiteSettings />} />
      </Routes>
    </Router>
  );
}

export default App;
