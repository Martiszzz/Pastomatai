const pool = require("./src/db");

module.exports = (app) => {

    app.get("/api/siunta/:kodas", async (req, res) => {
    try {
        const { kodas } = req.params;

        const [rows] = await pool.query(
            `SELECT siuntosNr, busena, lipdukoNr, kodas
             FROM siunta
             WHERE kodas = ?`,
            [kodas]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: "Siunta nerasta"
            });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Serverio klaida"
        });
    }
});
};