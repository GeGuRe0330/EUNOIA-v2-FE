import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../layout/Layout';
import { requireAuth } from '../utils/requireAuth';

const IntroPage = lazy(() => import('../pages/intro/IntroPage'));
const MainPage = lazy(() => import('../pages/main/MainPage'));
const WritePage = lazy(() => import('../pages/write/writePage'));
const AboutPage = lazy(() => import('../pages/about/AboutPage'));
const LoadingPage = lazy(() => import('../pages/loading/LoadingPage'));
const LoginPage = lazy(() => import('../pages/login/LoginPage'));
const SignupPage = lazy(() => import('../pages/signUp/SignupPage'));
const AdminPendingPage = lazy(() => import('../pages/admin/AdminPendingPage'));
const RoadmapPage = lazy(() => import('../pages/roadmap/RoadmapPage'));
const MetaAnalysisPage = lazy(() => import('../pages/meta/MetaAnalysisPage'));
const MyPage = lazy(() => import('../pages/profilepage/myPage'));

//임시) 백업페이지
const BackupDownloadPage = lazy(() => import('../pages/backup/BackupDownloadPage'));

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
        children: [
            {
                path: 'dashboard',
                loader: requireAuth,
                element: (
                    <Suspense fallback={<div>Loading...</div>}>
                        <MainPage />
                    </Suspense>
                )
            },
            {
                path: 'write',
                loader: requireAuth,
                element: (
                    <Suspense fallback={<div>Loading...</div>}>
                        <WritePage />
                    </Suspense>
                )
            },
            {
                path: 'about',
                loader: requireAuth,
                element: (
                    <Suspense fallback={<div>Loading...</div>}>
                        <AboutPage />
                    </Suspense>
                )
            },
            {
                path: 'roadmap',
                loader: requireAuth,
                element: (
                    <Suspense fallback={<div>Loading...</div>}>
                        <RoadmapPage />
                    </Suspense>
                )
            },
            {
                path: 'loading',
                loader: requireAuth,
                element: (
                    <LoadingPage />
                )
            },
            {
                path: 'MetaAnalysisPage',
                loader: requireAuth,
                element: (
                    <MetaAnalysisPage />
                )
            },
            {
                path: 'myPage',
                loader: requireAuth,
                element: (
                    <MyPage />
                )
            },

            // Admin
            {
                path: 'pendinglist',
                loader: requireAuth,
                element: (
                    <Suspense fallback={<div>Loading...</div>}>
                        <AdminPendingPage />
                    </Suspense>
                )
            },
        ],
    },

    // 임시 백업페이지 라우터
    {
        path: '/minecraft',
        loader: requireAuth,
        element: (
            <Suspense fallback={<div>Loading...</div>}>
                <BackupDownloadPage />
            </Suspense>
        )
    }
]);

export default root;