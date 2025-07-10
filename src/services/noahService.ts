import fetch from "node-fetch";
import AppError from "../utils/appError";

export class NoahService {
  static getIntro() {
    return {
      title: "تعرف على نوح!",
      body: "نوح هو روبوت ذكاء اصطناعي مدمج في ماركت إكس يساعدك على الإجابة عن أسئلتك الاستثمارية وإرشادك في المنصة.",
      steps: 3,
    };
  }

  static async chat(userId: string, message: string) {
    if (!message) throw new AppError("Message is required", 400);

    const apiUrl = process.env.NOAH_API_URL || "http://localhost:8001/chat";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, message }),
      });

      if (!response.ok) {
        console.error("⚠️  Noah API returned status:", response.status);
        throw new Error(`Noah API error: ${response.status}`);
      }

      const data: any = await response.json();
      if (!data || !data.reply) {
        console.error("⚠️  Noah API invalid payload", data);
        throw new Error("Invalid response from Noah API");
      }

      return { reply: data.reply };
    } catch (error) {
      console.error("❌ NoahService local API error:", error);
      // Graceful fallback in Arabic
      return {
        reply: "عذراً، لا يمكنني الوصول إلى خدمة نوح المحلية حالياً. يرجى المحاولة لاحقاً.",
      };
    }
  }
}

export default NoahService; 