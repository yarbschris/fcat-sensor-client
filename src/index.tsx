import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Login } from './pages/auth/Login';
import { Plots } from './pages/Plots/Plots';
import { Nodes } from './pages/Nodes/Nodes';
import {
  Language,
  LanguageContext,
  LocalizationProvider,
} from './LocalizationProvider';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
//route definitions
const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Plots />,
  },
  {
    path: '/nodes',
    element: <Nodes />,
  },
  {
    path: '*',
    element: <div>404 Not Found</div>,
  },
]);

root.render(
  <React.StrictMode>
    <LocalizationProvider>
      <RouterProvider router={router} />
    </LocalizationProvider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
