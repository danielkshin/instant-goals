import { useState } from 'react';
import useLocalStorage from 'use-local-storage';
import 'App.css';
import { Header, ThemeButton, Matches, Error, Footer } from 'components';

const App = () => {
  const [error, setError] = useState(false);
  const [dark, setDark] = useLocalStorage('dark', false);

  const displayError = () => {
    setError(true);
  };

  const changeTheme = () => {
    setDark(!dark);
  };

  return (
    <div className="App" data-theme={dark ? 'dark' : 'light'}>
      <Header />
      <ThemeButton dark={dark} changeTheme={changeTheme} />
      {error ? <Error /> : <Matches dark={dark} displayError={displayError} />}
      <Footer />
    </div>
  );
};

export default App;
