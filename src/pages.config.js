import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import LiveStreams from './pages/LiveStreams';
import LiveStreamView from './pages/LiveStreamView';
import Store from './pages/Store';
import Blog from './pages/Blog';
import AdminSiteSettings from './pages/AdminSiteSettings';
import BroadcastStream from './pages/BroadcastStream';
import AdminLiveStreams from './pages/AdminLiveStreams';
import AdminSubscriptions from './pages/AdminSubscriptions';
import AdminProductVariants from './pages/AdminProductVariants';
import AdminDigitalProducts from './pages/AdminDigitalProducts';
import AdminPaymentGateways from './pages/AdminPaymentGateways';
import AdminAnalytics from './pages/AdminAnalytics';
import UserProfile from './pages/UserProfile';
import AdminRoles from './pages/AdminRoles';
import AdminAIScriptGenerator from './pages/AdminAIScriptGenerator';
import AdminAIPricing from './pages/AdminAIPricing';
import AdminContentModeration from './pages/AdminContentModeration';
import AdminBroadcastStudio from './pages/AdminBroadcastStudio';
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
    "AdminSubscriptions": AdminSubscriptions,
    "AdminProductVariants": AdminProductVariants,
    "AdminDigitalProducts": AdminDigitalProducts,
    "AdminPaymentGateways": AdminPaymentGateways,
    "AdminAnalytics": AdminAnalytics,
    "UserProfile": UserProfile,
    "AdminRoles": AdminRoles,
    "AdminAIScriptGenerator": AdminAIScriptGenerator,
    "AdminAIPricing": AdminAIPricing,
    "AdminContentModeration": AdminContentModeration,
    "AdminBroadcastStudio": AdminBroadcastStudio,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};