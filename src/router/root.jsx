import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../layout/Layout';
import { requireAuth } from '../utils/requireAuth';

const IntroPage = lazy(() => import('../pages/intro/IntroPage'));
const MainPage = lazy(() => import('../pages/main/MainPage'));
const WritePage = lazy(() => import('../pages/write/WritePage'));
const AboutPage = lazy(() => import('../pages/about/AboutPage'));
const LoadingPage = lazy(() => import('../pages/loading/LoadingPage'));
const LoginPage = lazy(() => import('../pages/login/LoginPage'));
const SignupPage = lazy(() => import('../pages/signUp/SignupPage'));
const AdminPendingPage = lazy(() => import('../pages/admin/AdminPendingPage'));
const RoadmapPage = lazy(() => import('../pages/roadmap/RoadmapPage'));
const MetaAnalysisPage = lazy(() => import('../pages/meta/MetaAnalysisPage'));
const MyPage = lazy(() => import('../pages/profilepage/MyPage'));

const root = createBrowserRouter([
    {
        path: '/',
        children: [
            {
                path: '',
                element: (
                    <Suspense fallback={<div>Loading...</div>}>
                        <IntroPage />
                    </Suspense>
                )
            },
            {
                path: 'login',
                element: (
                    <Suspense fallback={<div>Loading...</div>}>
                        <LoginPage />
                    </Suspense>
                )
            },
            {
                path: 'signup',
                element: (
                    <Suspense fallback={<div>Loading...</div>}>
                        <SignupPage />
                    </Suspense>
                )
            },
        ]
    },
    {
        path: '/',
        element: <Layout />,
        loader: requireAuth,
        children: [
            {
                path: 'dashboard',
                element: (
                    <Suspense fallback={<div>Loading...</div>}>
                        <MainPage />
                    </Suspense>
                )
            },
            {
                path: 'write',
                element: (
                    <Suspense fallback={<div>Loading...</div>}>
                        <WritePage />
                    </Suspense>
                )
            },
            {
                path: 'about',
                element: (
                    <Suspense fallback={<div>Loading...</div>}>
                        <AboutPage />
                    </Suspense>
                )
            },
            {
                path: 'roadmap',
                element: (
                    <Suspense fallback={<div>Loading...</div>}>
                        <RoadmapPage />
                    </Suspense>
                )
            },
            {
                path: 'loading',
                element: (
                    <LoadingPage />
                )
            },
            {
                path: 'MetaAnalysisPage',
                element: (
                    <MetaAnalysisPage />
                )
            },
            {
                path: 'myPage',
                element: (
                    <MyPage />
                )
            },

            // Admin
            {
                path: 'pendinglist',
                element: (
                    <Suspense fallback={<div>Loading...</div>}>
                        <AdminPendingPage />
                    </Suspense>
                )
            },
        ],
    },
]);

export default root;