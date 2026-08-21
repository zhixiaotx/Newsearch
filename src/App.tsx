import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Home from './pages/Home';
import Collections from './pages/Collections';
import Monitor from './pages/Monitor';
import Trends from './pages/Trends';
import Typesetter from './pages/Typesetter';

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/typesetter" element={<Typesetter />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}
