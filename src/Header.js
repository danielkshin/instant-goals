import logo from "./assets/logo.png";

export default function Header() {
  return (
    <header>
      <img src={logo} alt="website logo" />
      <span>
        <h1>instant goals</h1>
        <p>goals and highlights on demand</p>
      </span>
    </header>
  );
}
