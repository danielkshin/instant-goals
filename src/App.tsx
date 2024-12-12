import { useState, useEffect } from 'react';
import useLocalStorage from 'use-local-storage';
import './App.css';
import ThemeButton from './components/ThemeButton';
import Header from './components/Header';
import Matches from './components/Matches';
import Error from './components/Error';
import Footer from './components/Footer';

const App = () => {
  const [error, setError] = useState<boolean>(false);
  const [dark, setDark] = useLocalStorage('dark', false);

  if (error) return <Error />;
  return (
    <div className="App" data-theme={dark ? 'dark' : 'light'}>
      <Header />
      <ThemeButton dark={dark} setDark={setDark} />
      <Matches dark={dark} setError={setError} />
      <Footer />
    </div>
  );
};

export default App;
