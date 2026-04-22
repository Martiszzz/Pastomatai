const pool = require("./src/db");

module.exports = (app) => {

    // app.post("/api/users/create", async (req, res) => {
    //     const { name, age, email } = req.body;
    //     //cia patikrinam ar unikalus email
    //     // jeigu unikalus query insert into users
    //     // grazinam atgal frontui sukurto userio id arba error tam kad suveiktu !response.ok
    //     //return res.status(400).end;
    //     res.json({ name, age, email });
    // });
  const bcrypt = require("bcrypt");

app.post("/api/user/create", async (req, res) => {
    try {
        const { vardas, pavarde, pastas, slapyvardis,slaptazodis } = req.body;

        
        if ( await patikrintiEmail(pastas)) {
            return res.status(400).json({
                error: "Email already exists"
            });
        }

        // Hash password
        const hashedPassword = await UzsifruotiSlaptazodi(slaptazodis);
        const role = "vartotojas";
        // Save user
        const [result] = await pool.query(
            "INSERT INTO vartotojas (prisijungimo_vardas, el_pastas, vardas, pavarde, slaptazodis, role ) VALUES (?, ?, ?, ?, ? ,?)",
            [slapyvardis,pastas,vardas,pavarde, hashedPassword,role]
        );

        res.status(201).json({
            id: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Server error"
        });
    }
});
async function patikrintiEmail(pastas) {
    const [existingUser] = await pool.query(
            "SELECT vartotojoId FROM vartotojas WHERE el_pastas = ?",
            [pastas]
        );
    return existingUser.length > 0;
}
async function UzsifruotiSlaptazodi(slaptazodis){
    return await bcrypt.hash(slaptazodis, 10);
}
app.post("/api/user/login", async (req, res) => {
    try {
        const { slapyvardis, slaptazodis } = req.body;

        
        const users = await Autentifikuoti(slapyvardis);
        if (users.length==0) {
            return res.status(400).json({
                error: "Wrong username or password"
            });
        }

        const user = users[0];

        // Compare password with hashed password
        const passwordMatch = await PatikrintiSlaptazodi(slaptazodis,user);

        if (!passwordMatch) {
            return res.status(400).json({
                error: "Wrong username or password"
            });
        }

        // Successful login
        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.vartotojoId,
                username: user.prisijungimo_vardas,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Server error"
        });
    }
});
async function Autentifikuoti(slapyvardis) {
    // Check if user exists
        const [users] = await pool.query(
            "SELECT vartotojoId, prisijungimo_vardas, slaptazodis, role FROM vartotojas WHERE prisijungimo_vardas = ?",
            [slapyvardis]
        );
        return users;
}
async function PatikrintiSlaptazodi(slaptazodis,user) {
    const passwordMatch = await bcrypt.compare(
            slaptazodis,
            user.slaptazodis
        );
    return passwordMatch;
}

};