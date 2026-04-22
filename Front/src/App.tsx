import { BrowserRouter, Routes, Route} from "react-router-dom"
import Testas from "./index.tsx"
import RegistracijosLangas from "./Register.tsx";
import PrisijungimoLangas from "./Prisijungimas.tsx";
import SiuntuSekimoLangas from "./SektiSiunta.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path = "/main" element ={<Testas />} />
                <Route path = "" element={<PrisijungimoLangas/>} />
                <Route path = "/register" element ={<RegistracijosLangas />} />
                
                <Route path = "/login" element ={<PrisijungimoLangas />} />
                <Route path = "/sekti" element ={<SiuntuSekimoLangas />} />
            </Routes>
        </BrowserRouter>
    );
}
export default App