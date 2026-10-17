import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HustleVault from './HustleVault'
import Success from './Success'
import Cancel from './Cancel'
import DoorScript from './DoorScript'
import ObjectionCoach from './apps/ObjectionCoach'
import MyPurchase, { MyList } from './apps/MyPurchase'
import AppPage from './apps/AppPage'
import Admin from './apps/Admin'
import Blog from './blog/Blog'
import BlogPost from './blog/BlogPost'

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
        <Route path="/apps/objection-coach" element={<ObjectionCoach />} />
        <Route path="/my" element={<MyList />} />
        <Route path="/my/:id" element={<MyPurchase />} />

        {/* Admin (new, server-authenticated) */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/*" element={<Admin />} />

        {/* Apps */}
        <Route path="/apps/:id" element={<AppPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
