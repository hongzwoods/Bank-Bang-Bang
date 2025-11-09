
export interface UserProfile {
    age: number;
    current_cash: number;
    annual_salary: number;
    salary_growth: number;
    monthly_spend: number;
    stable_income_retire: number;
    retirement_age: number;
    monthly_spend_retire: number;
}

export interface Deposit {
    year: number;
    age: number;
    monthlyDeposit: number;
}

export interface SimulationTimelinePoint {
    year: number;
    best: number;
    avg: number;
    worst: number;
}

export interface SimulationResult {
    name: string;
    outcomes: {
        best: number;
        avg: number;
        worst: number;
    };
    timeline: SimulationTimelinePoint[];
}

export interface PostRetirementScenario {
    name: string;
    finalWealth: number;
    monthlyPassiveIncome: number;
    coverageRatio: number;
}

export interface GeminiContext {
    userProfile: UserProfile;
    simulationResults: {
        aggressive: SimulationResult;
        conservative: SimulationResult;
    } | null;
    postRetirementScenarios: PostRetirementScenario[] | null;
}
