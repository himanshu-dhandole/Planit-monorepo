import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import Protected from './components/Protected';
import LandingPage from './components/LandingPage';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout><LandingPage /></Layout>} />
          <Route path="/signup" element={<Protected authentication={false}><Layout><SignUp /></Layout></Protected>} />
          <Route path="/signin" element={<Protected authentication={false}><Layout><SignIn /></Layout></Protected>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.6)',
            color: '#111',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            borderRadius: '1rem',
          }
        }}
      />
      </Router>
    </AuthProvider>
  );
}

export default App;
