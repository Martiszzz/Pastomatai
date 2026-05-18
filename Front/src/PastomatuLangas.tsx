import { useNavigate } from "react-router-dom";
import "./global.css";
export interface SiuntaInfo {
    siuntosNr: number;
    pastomato_id: number;
    dureliu_id: number;
    lipdukoNr: number;
}
function PastomatuLangas() {
    const navigate = useNavigate();

    function atidarytiIsemimoLanga() {
        navigate("/pastomatas/isemimo-kodas");
    }

    return (
        <div style={{ padding: "40px" }}>
            <h1>Paštomatas</h1>
            <button onClick={atidarytiIsemimoLanga}>
                Siuntos išėmimas
            </button>
            <button onClick={() => navigate('/pastomatas/idejimo-kodas')}>
               Siuntos idėjimas
            </button>
        </div>
    );
}

export default PastomatuLangas;