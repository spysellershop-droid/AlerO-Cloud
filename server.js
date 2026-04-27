const express = require("express");
const fs = require("fs");
const { v4: uuid } = require("uuid");

const app = express();
app.use(express.json());

const loadLicenses = () => JSON.parse(fs.readFileSync("data/licenses.json"));
const loadTokens = () => JSON.parse(fs.readFileSync("data/tokens.json"));

const saveLicenses = (data) => fs.writeFileSync("data/licenses.json", JSON.stringify(data, null, 2));
const saveTokens = (data) => fs.writeFileSync("data/tokens.json", JSON.stringify(data, null, 2));

app.post("/check-license", (req, res) => {
  const { license } = req.body;
  const licenses = loadLicenses();

  if (!licenses[license] || !licenses[license].active) {
    return res.json({ valid: false });
  }

  res.json({
    valid: true,
    credits: licenses[license].credits
  });
});

app.post("/generate", (req, res) => {
  const { license, os } = req.body;

  const licenses = loadLicenses();
  const tokens = loadTokens();

  if (!licenses[license] || licenses[license].credits <= 0) {
    return res.json({ error: "No credits" });
  }

  const token = uuid();

  tokens[token] = {
    license,
    os,
    used: false
  };

  saveTokens(tokens);

  res.json({ token });
});

app.post("/consume", (req, res) => {
  const { token } = req.body;

  const licenses = loadLicenses();
  const tokens = loadTokens();

  if (!tokens[token] || tokens[token].used) {
    return res.json({ error: "Invalid token" });
  }

  const license = tokens[token].license;

  if (licenses[license].credits <= 0) {
    return res.json({ error: "No credits" });
  }

  tokens[token].used = true;
  licenses[license].credits -= 1;

  saveTokens(tokens);
  saveLicenses(licenses);

  res.json({ success: true });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
