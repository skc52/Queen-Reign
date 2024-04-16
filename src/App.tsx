import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import ChessUI from './ui/ChessUI.tsx';
import ChessLobby from './ui/ChessLobby.tsx';


import './App.css'
import { ModeToggle } from './components/ui/mode-toggle.tsx';

function App() {
  return (

    <Router>
      <div className='float-right'>

      <ModeToggle/>
      </div>
      <Routes>
        <Route  path = "/" element = {<ChessLobby/>}/>
        {/* <Route  path = "/game/:gameId" element = {<ChessUI/>}/> */}
        <Route  path = "/game/:username/:gameId/:ai" element = {<ChessUI/>}/>


      </Routes>
    </Router>
  );
}

export default App;
