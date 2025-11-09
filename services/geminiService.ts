
import { GoogleGenAI } from "@google/genai";
import { UserProfile, Deposit, PostRetirementScenario, GeminiContext } from '../types';

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey });
};

const formatNumber = (num: number) => num.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const getFinancialAdvice = async (
    userProfile: UserProfile,
    depositTimeline: Deposit[],
    cashflowScenarios: PostRetirementScenario[]
): Promise<{ text: string, sources: any[] }> => {
    const ai = getAiClient();
    
    const successScenario = cashflowScenarios.find(s => s.coverageRatio >= 1.0);
    const tone = successScenario
        ? "Encouraging, optimistic, and educational. Focus on wealth preservation and growth opportunities."
        : "Supportive, constructive, and practical. Provide actionable steps to improve the financial outlook.";

    const prompt = `
        You are an expert private wealth management advisor. Analyze the following user financial profile and simulation results to provide personalized financial guidance.

        **User Profile:**
        - Age: ${userProfile.age}
        - Current Investible Cash: ${formatNumber(userProfile.current_cash)}
        - Annual Salary: ${formatNumber(userProfile.annual_salary)} (with ${userProfile.salary_growth}% expected annual growth)
        - Current Monthly Spending: ${formatNumber(userProfile.monthly_spend)}
        - Expected Retirement Age: ${userProfile.retirement_age}
        - Expected Monthly Expenditure After Retirement: ${formatNumber(userProfile.monthly_spend_retire)}

        **Projected Savings:**
        - The user is projected to save an average of ${formatNumber(depositTimeline.reduce((acc, curr) => acc + curr.monthlyDeposit, 0) / depositTimeline.length)} per month until retirement.

        **Post-Retirement Cashflow Scenarios (Based on an 8% annual yield on final wealth):**
        ${cashflowScenarios.map(s => 
            `- ${s.name}: Final Wealth of ${formatNumber(s.finalWealth)} -> Monthly Passive Income of ${formatNumber(s.monthlyPassiveIncome)} (Coverage Ratio: ${s.coverageRatio.toFixed(2)}x of expected spending)`
        ).join('\n')}

        **Task:**
        1.  **Analyze Retirement Readiness:** Concisely evaluate if the user's projected post-retirement cash flow meets their expected expenses in the average-case scenarios.
        2.  **Provide Actionable Guidance:** Based on the analysis, provide clear, actionable advice.
            -   **If there is a shortfall (average coverage ratio < 1.0):** Propose specific, practical adjustments to savings (e.g., "Increase monthly savings by X") or spending (e.g., "Consider reducing monthly discretionary spending by Y"). Suggest realistic strategies to bridge the gap.
            -   **If the goals are met (average coverage ratio >= 1.0):** Congratulate the user and suggest strategies for wealth preservation and safe growth post-retirement. Mention diversification, and perhaps exploring lower-risk assets.
        3.  **Maintain the correct tone:** ${tone}
        4.  **Formatting:** Use markdown for clarity (headings, bold text, bullet points). Structure the response in a logical, easy-to-read manner. Start with a summary, then the detailed analysis, and finally a list of key action items.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        return { text: response.text, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
    } catch (error) {
        console.error('Gemini API Error:', error);
        return { text: 'An error occurred while generating your financial advice. Please check your connection and API key.', sources: [] };
    }
};

export const getInteractivePromptResponse = async (
    prompt: string,
    context: GeminiContext
): Promise<{ text: string, sources: any[] }> => {
    const ai = getAiClient();
    
    const fullPrompt = `
        Given the user's financial context, answer the following question. Use Google Search to provide up-to-date and accurate information where relevant.

        **User's Financial Context:**
        - Profile: ${JSON.stringify(context.userProfile, null, 2)}
        - Simulation Results: ${JSON.stringify(context.simulationResults, null, 2)}
        - Post-Retirement Scenarios: ${JSON.stringify(context.postRetirementScenarios, null, 2)}

        **User's Question:**
        "${prompt}"

        Please provide a concise and helpful response. If you use external information, cite your sources.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        return { text: response.text, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
    } catch (error) {
        console.error('Gemini API Error (Interactive):', error);
        return { text: 'An error occurred while processing your request.', sources: [] };
    }
};
