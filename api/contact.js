
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { name, email, message } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      name.trim().length < 2 ||
      message.trim().length < 10 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        message: "Please check your form details."
      });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Kairo Digital <onboarding@resend.dev>",
        to: ["ma0912732@gmail.com"],
        reply_to: email.trim(),
        subject: `New project inquiry from ${name.trim()}`,
        text: `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${message.trim()}`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error:", data);
      return res.status(502).json({
        message: "Could not send the message."
      });
    }

    return res.status(200).json({ message: "Message sent successfully." });
  } catch (error) {
    console.error("Contact API error:", error);
    return res.status(500).json({
      message: "Something went wrong."
    });
  }
};
