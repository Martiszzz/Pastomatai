const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

require("./PaskyrosKontroleris")(app);

require("./SiuntuKontroleris")(app);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});