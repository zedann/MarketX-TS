    import investmentModel from "../models/investment";
import userModel from "../models/user";

export class HomeService {
  static async getHomeSummary(userId: string) {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const progress = HomeService.calculateRegistrationProgress(user);
    const assessment = await investmentModel.getUserRiskAssessment(userId);
    const riskCategory = assessment?.risk_category || null;

    const tasks: string[] = [];
    if (!progress.isComplete) tasks.push("complete_registration");
    if (!user.phone_verified) tasks.push("verify_phone");
    if (!assessment) tasks.push("complete_risk_assessment");

    const topGainers = await investmentModel.getTopMovers("day", "gainers", 3);

    return {
      onboardingProgress: progress,
      riskCategory,
      pendingTasks: tasks,
      topGainers,
    };
  }

  private static calculateRegistrationProgress(user: any) {
    const steps = [
      { name: "email", completed: !!user.email },
      { name: "personal", completed: !!(user.fullname && user.username) },
      { name: "location", completed: !!(user.country_of_birth && user.nationality) },
      { name: "contact", completed: !!(user.mobile && user.birthday) },
      { name: "security", completed: !!(user.passcode && user.password) },
      { name: "identity", completed: !!user.national_id },
      { name: "employment", completed: !!user.statement },
      { name: "terms", completed: !!user.terms_accepted },
    ];

    const completedSteps = steps.filter((s) => s.completed);
    const nextIncomplete = steps.find((s) => !s.completed);

    return {
      totalSteps: steps.length,
      completedSteps: completedSteps.length,
      completedStepNames: completedSteps.map((s) => s.name),
      nextStep: nextIncomplete?.name || null,
      isComplete: completedSteps.length === steps.length,
      percentage: Math.round((completedSteps.length / steps.length) * 100),
    };
  }
}

export default HomeService; 