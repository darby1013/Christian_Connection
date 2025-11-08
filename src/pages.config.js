import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import LiveStreams from './pages/LiveStreams';
import LiveStreamView from './pages/LiveStreamView';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "AdminDashboard": AdminDashboard,
    "LiveStreams": LiveStreams,
    "LiveStreamView": LiveStreamView,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};