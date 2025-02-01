import { useEffect } from 'react';
import themeIcon from 'assets/themeIcon.png';
import './ThemeButton.css';

interface ThemeButtonProps {
  dark: boolean;
  changeTheme: () => void;
}

const ThemeButton = ({ dark, changeTheme }: ThemeButtonProps) => {
  useEffect(() => {
    document.documentElement.style.setProperty(
      'color-scheme',
      dark ? 'dark' : 'light'
    );
  }, [dark]);

  return (
    <div className="theme">
      <img src={themeIcon} alt="Theme icon" onClick={changeTheme} />
    </div>
  );
};

export default ThemeButton;
