import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Protected from './components/Protected';
import LandingPage from './components/LandingPage';
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import NotFound from './components/NotFound';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import Navbar from './components/Navbar';
import Profile from './components/Profile';
import AboutPage from './components/AboutPage';
import Sandbox from './components/Sandbox';
import VendorOnboard from './components/VendorOnboard';
import ServiceList from './components/ServiceList';
import ServiceDetails from './components/ServiceDetails';
import VendorList from './components/VendorList';
import ChatPage from './components/ChatPage';
import CartPage from './components/CartPage';
import UnifiedDashboard from './components/UnifiedDashboard';


function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Layout><LandingPage /></Layout>} />
            <Route path="/about" element={<Layout><AboutPage /></Layout>} />
            
            {/* Auth Routes with seamless Cloud Background */}
            <Route element={<AuthLayout />}>
              <Route path="/signup" element={<Protected authentication={false}><SignUp /></Protected>} />
              <Route path="/signin" element={<Protected authentication={false}><SignIn /></Protected>} />
            </Route>
            
            <Route path="/profile" element={<Protected><Layout><Profile /></Layout></Protected>} />
            <Route path="/vendor-onboard" element={<Protected><Layout><VendorOnboard /></Layout></Protected>} />
            <Route path="/vendors" element={<Layout><VendorList /></Layout>} />
            <Route path="/dashboard" element={<Protected><Layout><UnifiedDashboard /></Layout></Protected>} />
            <Route path="/vendor-dashboard" element={<Protected><Layout><UnifiedDashboard /></Layout></Protected>} />
            <Route path="/wallet" element={<Protected><Layout><UnifiedDashboard /></Layout></Protected>} />
            <Route path="/services" element={<Layout><ServiceList /></Layout>} />
            <Route path="/services/:id" element={<Layout><ServiceDetails /></Layout>} />
            <Route path="/event-checkout" element={<Protected><Layout><CartPage /></Layout></Protected>} />
            <Route path="/my-events" element={<Protected><Layout><UnifiedDashboard /></Layout></Protected>} />
            <Route path="/my-bookings" element={<Protected><Layout><UnifiedDashboard /></Layout></Protected>} />
            <Route path="/vendor-bookings" element={<Protected><Layout><UnifiedDashboard /></Layout></Protected>} />
            <Route path="/disputes" element={<Protected><Layout><UnifiedDashboard /></Layout></Protected>} />
            <Route path="/admin" element={<Protected><Layout><UnifiedDashboard /></Layout></Protected>} />
            <Route path="/sandbox" element={<Protected><Sandbox /></Protected>} />
            
            <Route path="/chats" element={<Protected><Layout><ChatPage /></Layout></Protected>} />
            
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
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
