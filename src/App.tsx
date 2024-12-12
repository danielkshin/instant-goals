import { useState } from 'react';
import useLocalStorage from 'use-local-storage';
import 'App.css';
import { Header, ThemeButton, Matches, Error, Footer } from 'components';

const App = () => {
  const [error, setError] = useState(false);
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
