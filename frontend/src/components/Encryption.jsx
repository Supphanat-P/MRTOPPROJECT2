import React, { useState } from "react";
import CryptoJS from "crypto-js";
import "./Encryption.css";

// --- RSA simulation ---
function generateRSAKeys() {
  const publicKey = Math.floor(Math.random() * 1000) + 1;
  const privateKey = publicKey;
  return { publicKey, privateKey };
}

export default function Encryption({ currUser }) {
  if (currUser.role !== "admin") {
    return <div style={{ padding: 20 }}>Access denied. Admins only.</div>;
  }

  const [text, setText] = useState("");

  const [aesResult, setAesResult] = useState(null);
  const [rsaResult, setRsaResult] = useState(null);

  const [decryptInput, setDecryptInput] = useState("");
  const [decryptOutput, setDecryptOutput] = useState("");

  // ================= AES =================
  const handleAesEncrypt = () => {
    const key = CryptoJS.lib.WordArray.random(16).toString();
    const cipher = CryptoJS.AES.encrypt(text, key).toString();
    const combined = `${key}:${cipher}`;

    setAesResult({ key, cipher, combined });
  };

  // ================= RSA =================
  const handleRsaEncrypt = () => {
    const keys = generateRSAKeys();

    const cipher = text
      .split("")
      .map((c) => c.charCodeAt(0) * keys.publicKey)
      .join("-");

    const combined = `${keys.publicKey}:${cipher}`;

    setRsaResult({
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      cipher,
      combined,
    });
  };

  // ================= COPY =================
  const handleCopy = (value) => {
    navigator.clipboard.writeText(value);
    alert("Copied!");
  };

  // ================= DECRYPT =================
  const handleDecrypt = () => {
    try {
      const [key, cipher] = decryptInput.split(":");

      // ลอง AES ก่อน
      try {
        const bytes = CryptoJS.AES.decrypt(cipher, key);
        const result = bytes.toString(CryptoJS.enc.Utf8);

        if (result) {
          setDecryptOutput(`AES → ${result}`);
          return;
        }
      } catch {}

      //ถ้าไม่ใช่ AES → ลอง RSA
      const decrypted = cipher
        .split("-")
        .map((num) => String.fromCharCode(num / key))
        .join("");

      setDecryptOutput(`RSA → ${decrypted}`);
    } catch (err) {
      setDecryptOutput("❌ Decrypt failed");
    }
  };
  const handleClear = () => {
  setDecryptInput("");
  setDecryptOutput("");
};

 return (
  <div className="encryption-container">
    <div className="title">Encryption Simulator</div>

    <input
      className="input-box"
      type="text"
      placeholder="Enter text..."
      value={text}
      onChange={(e) => setText(e.target.value)}
    />

    <div>
      <button className="btn btn-aes" onClick={handleAesEncrypt}>
        AES
      </button>

      <button className="btn btn-rsa" onClick={handleRsaEncrypt}>
        RSA
      </button>
    </div>

    {/* AES */}
    {aesResult && (
      <div className="card">
        <h3>AES</h3>
        <div className="text">Key: {aesResult.key}</div>
        <div className="text">Cipher: {aesResult.cipher}</div>
        <div className="text">
          Combined: {aesResult.combined}
          <button
            className="btn btn-copy"
            onClick={() => handleCopy(aesResult.combined)}
          >
            Copy
          </button>
        </div>
      </div>
    )}

    {/* RSA */}
    {rsaResult && (
      <div className="card">
        <h3>RSA</h3>
        <div className="text">Public Key: {rsaResult.publicKey}</div>
        <div className="text">Cipher: {rsaResult.cipher}</div>
        <div className="text">
          Combined: {rsaResult.combined}
          <button
            className="btn btn-copy"
            onClick={() => handleCopy(rsaResult.combined)}
          >
            Copy
          </button>
        </div>
      </div>
    )}

    {/* DECRYPT */}
<div className="decrypt-box">
  <h3>Decrypt</h3>

  <input
    className="input-box"
    type="text"
    placeholder="Paste Key:Cipher..."
    value={decryptInput}
    onChange={(e) => setDecryptInput(e.target.value)}
  />

  <button className="btn btn-decrypt" onClick={handleDecrypt}>
    Decrypt
  </button>
  <button className="btn btn-delete" onClick={handleClear}>
    Clear
  </button>

  <div className="result">{decryptOutput}</div>
</div>
  </div>
);
}