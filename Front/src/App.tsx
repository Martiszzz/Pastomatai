import { BrowserRouter, Routes, Route} from "react-router-dom"
import Testas from "./index.tsx"

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path = "/testas" element ={<Testas />} />
            </Routes>
        </BrowserRouter>
    );
}
export default App