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
import Sponsors from './sponsors/Sponsors'
import Policy from './sponsors/Policy'
import { SponsorStatsPage, SponsorEditPage } from './sponsors/Private'
import SiteBar from './sponsors/SiteBar'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HustleVault />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/sponsors" element={<Sponsors />} />
        <Route path="/advertise" element={<Sponsors />} />
        <Route path="/sponsors/policy" element={<Policy />} />
        <Route path="/sponsors/stats/:token" element={<SponsorStatsPage />} />
        <Route path="/sponsors/edit/:token" element={<SponsorEditPage />} />
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
      <SiteBar />
    </BrowserRouter>
  )
}

export default App
