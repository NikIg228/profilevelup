import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles/globals.css';
import PreviewGate from './components/PreviewGate';
import AppLayout from './ui/AppLayout';
import HomePage from './pages/Home';
import TestingPage from './pages/Testing';
import PrivacyPage from './pages/Privacy';
import TermsPage from './pages/Terms';
import ReviewsPage from './pages/Reviews';
import AboutPage from './pages/About';
import HelpPage from './pages/Help';
import DetailsPage from './pages/Details';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'test', element: <TestingPage /> },
      { path: 'reviews', element: <ReviewsPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'help', element: <HelpPage /> },
      { path: 'details', element: <DetailsPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PreviewGate>
      <RouterProvider router={router} />
    </PreviewGate>
  </React.StrictMode>
);


