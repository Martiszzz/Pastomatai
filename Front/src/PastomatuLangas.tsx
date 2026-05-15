import { useNavigate } from "react-router-dom";
import "./global.css";

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
        </div>
    );
}

export default PastomatuLangas;