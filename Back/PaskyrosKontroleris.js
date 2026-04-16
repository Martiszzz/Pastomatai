const pool = require("./db");

module.exports = (app) => {

    app.post("/api/users/create", async (req, res) => {
        const { name, age, email } = req.body;
        //cia patikrinam ar unikalus email
        // jeigu unikalus query insert into users
        // grazinam atgal frontui sukurto userio id arba error tam kad suveiktu !response.ok
        //return res.status(400).end;
        res.json({ name, age, email });
    });

};