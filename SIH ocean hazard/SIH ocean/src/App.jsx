import { useState, useRef, useEffect } from "react";
import "./App.css";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import Map from "../components/map";
import InformForm from "../components/forms";
import Home from "../components/home";
import Instagram from "../components/instagram";
import MyPosts from "../components/myposts";
import { valueContext } from "../counter/counter";

function App() {
  const [option, setOption] = useState("home");
  const [ogList, setOgList] = useState([]); // ✅ global list state
  const [currentLang, setCurrentLang] = useState("en"); // en | hi | mr

  // load persisted language on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("app.lang");
      if (saved) setCurrentLang(saved);
    } catch (_) {
      // ignore
    }
  }, []);

  // Shared refs
  const locationRef = useRef();
  const disasterRef = useRef();
  const severityRef = useRef();
  const photoURLRef = useRef();

  const onclickhome = () => setOption("home");

  const onclickform = () => setOption("forms");
  const onclickinsta = () => setOption("instagram");
  const onclickmypost = () => setOption("myPost");

  const MyComponent = () => {
    if (option === "home") return <Home />;
    if (option === "forms") return <InformForm />;
    if (option === "instagram") return <Instagram />;
    if (option === "myPost") return <MyPosts />;
    return null;
  };

  return (
    <valueContext.Provider
      value={{
        locationRef,
        disasterRef,
        severityRef,
        photoURLRef,
        ogList,
        setOgList,
        currentLang,
        setCurrentLang,
      }}
    >
      <Navbar
        onclickform={onclickform}
        onclickhome={onclickhome}
        onclickinsta={onclickinsta}
      />
      <div style={{ padding: "20px" }}>
        <MyComponent />
      </div>
      <Footer onclickmypost={onclickmypost} />
    </valueContext.Provider>
  );
}

export default App;
