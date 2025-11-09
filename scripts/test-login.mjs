const baseUrl = process.env.API_URL || "http://localhost:3001/api";

async function main() {
  try {
    const res = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123" }),
    });
    const json = await res.json();
    if (!res.ok) {
      console.error("Erro no login:", json);
      process.exit(1);
    }
    console.log("Login OK. Usuário:", json.user);
    console.log("Token (prefixo):", json.token?.slice(0, 20) + "...");
    process.exit(0);
  } catch (e) {
    console.error("Falha ao conectar no backend:", e.message);
    process.exit(2);
  }
}

main();
