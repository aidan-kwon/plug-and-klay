import React from 'react'
import './App.css'
import { useSelector } from 'react-redux'

function App() {
  return (
    <div className="App">
      <Error/>
      <Network/>
      {isConnected && <TxMetadata/>}
      <br/>
      {isConnected && <Deploy/>}
      <br/>
      {isConnected && <ContractList/>}
      <div style={{ flexGrow: 1 }}/>
      <Footer/>
    </div>
  );
}

export default App;
