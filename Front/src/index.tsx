
import { Link } from "react-router-dom"
import styles from "./index.module.css" 
import "./global.css";
function Testas(){
    return (
        <>
        <div className={styles.title}>
            <h1>KTUMATAS</h1>
            <Link to ="/login">loginas</Link>
            <Link to ="/sekti">sekti</Link>
        </div>
        </>
    )
}

export default Testas