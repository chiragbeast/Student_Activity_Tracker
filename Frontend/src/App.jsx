import './index.css';
import './App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ActivityFeed from './components/ActivityFeed';

function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Header />
        <ActivityFeed />
      </div>
    </div>
  );
}

export default App;
