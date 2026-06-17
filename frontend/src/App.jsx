import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import Protected from './components/Protected';
import LandingPage from './components/LandingPage';
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import NotFound from './components/NotFound';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import Navbar from './components/Navbar';
import Profile from './components/Profile';
import Sandbox from './components/Sandbox';
import WalletPage from './components/WalletPage';
import VendorOnboard from './components/VendorOnboard';
import AdminDashboard from './components/AdminDashboard';
import VendorDashboard from './components/VendorDashboard';
import ServiceList from './components/ServiceList';
import ServiceDetails from './components/ServiceDetails';
import VendorList from './components/VendorList';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Layout><LandingPage /></Layout>} />
          
          {/* Auth Routes with seamless Cloud Background */}
          <Route element={<AuthLayout />}>
            <Route path="/signup" element={<Protected authentication={false}><SignUp /></Protected>} />
            <Route path="/signin" element={<Protected authentication={false}><SignIn /></Protected>} />
          </Route>
          
          <Route path="/profile" element={<Protected><Layout><Profile /></Layout></Protected>} />
          <Route path="/vendor-onboard" element={<Protected><Layout><VendorOnboard /></Layout></Protected>} />
          <Route path="/vendors" element={<Layout><VendorList /></Layout>} />
          <Route path="/vendor-dashboard" element={<Protected><Layout><VendorDashboard /></Layout></Protected>} />
          <Route path="/wallet" element={<Protected><Layout><WalletPage /></Layout></Protected>} />
          <Route path="/services" element={<Layout><ServiceList /></Layout>} />
          <Route path="/services/:id" element={<Layout><ServiceDetails /></Layout>} />
          <Route path="/admin" element={<Protected><Layout><AdminDashboard /></Layout></Protected>} />
          <Route path="/sandbox" element={<Protected><Sandbox /></Protected>} />
          
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
