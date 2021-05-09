
import './App.css';
import Navbar from './WebCode/Navbar';
import LeaderBoard from './WebCode/LeaderBoard';
import BabylonScene from './GameCode/BabylonScene';

function App() {
  return (
    <div className="App">
      <Navbar></Navbar>
      <div className="content"></div>
        <h1>App Component</h1>
        <div>
          <BabylonScene/>
        </div>
        
    </div>
  );
}

export default App;
