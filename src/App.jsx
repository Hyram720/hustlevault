import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HustleVault from './HustleVault'
import Success from './Success'
import Cancel from './Cancel'
import DoorScript from './DoorScript'
import Blog from './blog/Blog'
import BlogPost from './blog/BlogPost'
import AdminLogin from './admin/AdminLogin'
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/Dashboard'
import Orders from './admin/Orders'
import Products from './admin/Products'
import Settings from './admin/Settings'
import LivePreview from './admin/LivePreview'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HustleVault />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />
        <Route path="/door-script" element={<DoorScript />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="preview" element={<LivePreview />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
