import React, { useEffect,useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Register.module.css";
import { preconnect } from "react-dom";

function Registracija(){
    const navigate = useNavigate();
    interface user{
        slapyvardis : string,
        slaptazodis : string
        vardas : string,
        pavarde : string,
        pastas : string
    };
    const [vartotojas,setVartotojas] = useState<user>({
        slapyvardis : "",
        slaptazodis : "",
        vardas : "",
        pavarde : "",
        pastas : ""
    });
    const [zinute,setZinute] = useState<string>("");
    const handleChange = (c:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>{
        c.preventDefault();
        const {id,type,value} = c.target;
        let finalValue = value;
        if(type ==="text"){
            finalValue = String(value);
        }
        setVartotojas((prev)=>({
            ...prev,
            [id] : finalValue
        }));
        
    }
    async function PatikrintiAtsakyma(){
        const response = await fetch("api/user/create",{
            headers : {
                method:"POST",
                "content-type":"application/json",
                body: JSON.stringify(vartotojas)
            }});
        if(!response.ok){
            setZinute("Klaida");
            return;
        }
        navigate('/main');
    }
    return (
        <>
        <div>
            <p>{zinute}</p>
            <form onSubmit={PatikrintiAtsakyma}>
                <input id = "slapyvardis" type = "text" placeholder="Slapyvardis" onChange={handleChange} value={vartotojas.slapyvardis}/>
                
                <input id = "slaptazodis" type = "text" placeholder="Slaptazodis" onChange={handleChange} value={vartotojas.slaptazodis}/>
                <input id = "vardas" type = "text" placeholder="Vardas" onChange={handleChange} value={vartotojas.vardas}/>
                <input id = "pavarde" type = "text" placeholder="Pavarde" onChange={handleChange} value={vartotojas.pavarde}/>

                <input id ="pastas" type = "text" placeholder = "El.Pastas" onChange= {handleChange} value = {vartotojas.pastas}/>
                
                
            </form>
        </div>
        </>
    )
}
export default Registracija