import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import LiveStreams from './pages/LiveStreams';
import LiveStreamView from './pages/LiveStreamView';
import Store from './pages/Store';
import Blog from './pages/Blog';
import AdminSiteSettings from './pages/AdminSiteSettings';
import BroadcastStream from './pages/BroadcastStream';
import AdminLiveStreams from './pages/AdminLiveStreams';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "AdminDashboard": AdminDashboard,
    "LiveStreams": LiveStreams,
    "LiveStreamView": LiveStreamView,
    "Store": Store,
    "Blog": Blog,
    "AdminSiteSettings": AdminSiteSettings,
    "BroadcastStream": BroadcastStream,
    "AdminLiveStreams": AdminLiveStreams,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};