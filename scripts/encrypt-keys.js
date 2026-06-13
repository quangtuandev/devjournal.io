import crypto from "crypto";
import fs from "fs";
import path from "path";

const password = "skyqueen2026";
const inputPath = "/Users/duanyu-fs/space/duanyu/devjournal.io/src/content/posts/ALL-IN-ONE";

if (!fs.existsSync(inputPath)) {
  console.error(`Error: Source file ${inputPath} not found.`);
  process.exit(1);
}

const plaintext = fs.readFileSync(inputPath, "utf8");

// Generate PBKDF2 parameters
const salt = crypto.randomBytes(16);
const iterations = 100000;
const key = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");

const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
let ciphertext = cipher.update(plaintext, "utf8", "hex");
ciphertext += cipher.final("hex");
const tag = cipher.getAuthTag().toString("hex");

const payload = {
  salt: salt.toString("hex"),
  iv: iv.toString("hex"),
  ciphertext,
  tag,
  iterations
};

console.log("Encryption successful!");
console.log(JSON.stringify(payload, null, 2));

// Save to a scratch file just in case
const scratchDir = "/Users/duanyu-fs/.gemini/antigravity-ide/brain/73cf4529-f26c-456f-9609-d59b6154d014/scratch";
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}
fs.writeFileSync(path.join(scratchDir, "encrypted-keys.json"), JSON.stringify(payload, null, 2));
console.log(`Saved encrypted payload to scratch/encrypted-keys.json`);
