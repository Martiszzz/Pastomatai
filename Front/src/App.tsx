import { BrowserRouter, Routes, Route} from "react-router-dom"
import Testas from "./index.tsx"
import RegistracijosLangas from "./Register.tsx";
import PrisijungimoLangas from "./Prisijungimas.tsx";
import SiuntuSekimoLangas from "./SektiSiunta.tsx";
import PastomatuLangas from "./PastomatuLangas";
import IsemimoKodoLangas from "./IsemimoKodoLangas";
import IsemimoPatvirtinimoLangas from "./IsemimoPatvirtinimoLangas";
import IdejimosKodasLangas from "./IdejimosKodasLangas.tsx";
import IdejimosPatvirtinimasLangas from "./IdejimosPatvirtinimasLangas.tsx";
import SiuntuPerziurosLangas from "./SiuntuPerziurosLangas.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path = "/main" element ={<Testas />} />
                <Route path = "" element={<PrisijungimoLangas/>} />
                <Route path = "/register" element ={<RegistracijosLangas />} />
                
                <Route path = "/login" element ={<PrisijungimoLangas />} />
                <Route path = "/sekti" element ={<SiuntuSekimoLangas />} />
                <Route path = "/siuntos" element ={<SiuntuPerziurosLangas />} />
                <Route path = "/pastomatas/idejimo-kodas" element = {<IdejimosKodasLangas/>}/>
                
                <Route path = "/pastomatas/idejimo-patvirtinimas/:siuntosNr" element = {<IdejimosPatvirtinimasLangas/>}/>
                <Route path="/pastomatas" element={<PastomatuLangas />} />
                <Route path="/pastomatas/isemimo-kodas" element={<IsemimoKodoLangas />} />
                <Route path="/pastomatas/isemimo-patvirtinimas/:siuntaId" element={<IsemimoPatvirtinimoLangas />} />
            </Routes>
        </BrowserRouter>
    );
}
export default App