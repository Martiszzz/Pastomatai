
import { Link } from "react-router-dom"
import styles from "./index.module.css" 
import "./global.css";
function Testas(){
    return (
        <>
        <div className={styles.title}>
            <h1>KTUMATAS</h1>
            <Link to ="/login">Prisijungimas</Link>
            
            <Link to ="/register">Registracija</Link>
            <Link to ="/sekti">Siuntos sekimas</Link>
            <Link to ="/siuntos">Siuntos peržiūra</Link>
        </div>
        </>
    )
}

export default Testas