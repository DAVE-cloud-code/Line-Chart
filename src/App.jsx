import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TemperatureChart from './TemperatureChart';
import PastDataPage  from './PastTemperatureData';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TemperatureChart city="Lagos" />} />
        <Route path="/past-data" element={<PastDataPage />} />
      </Routes>
    </Router>
  );
}

export default App; 
