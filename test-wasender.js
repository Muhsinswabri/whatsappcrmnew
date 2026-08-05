async function checkWasender() {
  try {
    const res = await fetch("https://wasenderapi.com/api/session/status", {
      headers: {
        "Session-ID": process.env.NEXT_PUBLIC_SESSION_ID || "105975",
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_WASENDER_API_KEY || "c460f962c1a9134e761f67d379de9b36824423bc5ead27dc7a6484f8f6df0f9c"}`
      }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

checkWasender();
