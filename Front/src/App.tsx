import { BrowserRouter, Routes, Route} from "react-router-dom"
import Testas from "./index.tsx"
import Registracija from "./Register.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path = "/testas" element ={<Testas />} />
                
                <Route path = "/register" element ={<Registracija />} />
            </Routes>
        </BrowserRouter>
    );
}
export default App