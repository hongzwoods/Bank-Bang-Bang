import React, { useState, useCallback, useMemo } from 'react';
import { UserProfile, Deposit, SimulationResult, PostRetirementScenario } from './types';
import { getFinancialAdvice, getInteractivePromptResponse } from './services/geminiService';

import Step1FinancialIdentity from './components/Step1FinancialIdentity';
import FinancialReport from './components/FinancialReport';
import { BanknoteIcon, RocketIcon } from './components/Icons';

// Main App Component
const App: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [userProfile, setUserProfile] = useState<UserProfile>({
        age: 30,
        current_cash: 10000,
        annual_salary: 80000,
        salary_growth: 3,
        monthly_spend: 3000,
        stable_income_retire: 0,
        retirement_age: 60,
        monthly_spend_retire: 4000
    });
    
    // Calculated data
    const [depositTimeline, setDepositTimeline] = useState<Deposit[]>([]);
    const [simulationResults, setSimulationResults] = useState<{ aggressive: SimulationResult; conservative: SimulationResult; } | null>(null);
    const [postRetirementScenarios, setPostRetirementScenarios] = useState<PostRetirementScenario[] | null>(null);
    const [aiAdvice, setAiAdvice] = useState<{ advice: string; sources: any[] }>({ advice: '', sources: [] });
    const [interactiveResponse, setInteractiveResponse] = useState<string>('');
    const [interactiveResponseLoading, setInteractiveResponseLoading] = useState<boolean>(false);


    const handleProfileUpdate = (profile: UserProfile) => {
        setUserProfile(profile);
    };

    const runAllCalculations = useCallback(() => {
        setIsLoading(true);
        
        // Step 2: Future Savings Projection
        const timeline: Deposit[] = [];
        let currentSalary = userProfile.annual_salary;
        let currentMonthlySpend = userProfile.monthly_spend;
        const workingYears = userProfile.retirement_age - userProfile.age;

        for (let i = 0; i < workingYears; i++) {
            const year = new Date().getFullYear() + i;
            const age = userProfile.age + i;
            const monthlyDeposit = (currentSalary / 12) - currentMonthlySpend;
            timeline.push({ year, age, monthlyDeposit: Math.max(0, monthlyDeposit) });

            currentSalary *= (1 + userProfile.salary_growth / 100);
            currentMonthlySpend *= (1 + 0.02); // 2% inflation
        }
        setDepositTimeline(timeline);

        // Step 3 & 4: Market Data & Simulations
        const SP500_MEAN_RETURN = 0.10; // 10%
        const SP500_STD_DEV = 0.18; // 18%
        
        // Helper for normally distributed random number
        const gaussianRandom = (mean = 0, stdev = 1) => {
            let u = 1 - Math.random();
            let v = Math.random();
            let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
            return z * stdev + mean;
        };

        // Aggressive Monte Carlo Simulation
        const MONTE_CARLO_RUNS = 1000;
        const finalWealthOutcomes: number[] = [];
        for(let i=0; i < MONTE_CARLO_RUNS; i++) {
            let wealth = userProfile.current_cash;
            for(const deposit of timeline) {
                wealth += deposit.monthlyDeposit * 12;
                const annualReturn = gaussianRandom(SP500_MEAN_RETURN, SP500_STD_DEV);
                wealth *= (1 + annualReturn);
            }
            finalWealthOutcomes.push(wealth);
        }
        finalWealthOutcomes.sort((a, b) => a - b);
        const aggBest = finalWealthOutcomes[Math.floor(MONTE_CARLO_RUNS * 0.95)];
        const aggAvg = finalWealthOutcomes[Math.floor(MONTE_CARLO_RUNS * 0.50)];
        const aggWorst = finalWealthOutcomes[Math.floor(MONTE_CARLO_RUNS * 0.05)];

        const aggressiveTimeline = timeline.map((d, i) => ({
          year: d.year,
          avg: (userProfile.current_cash + (d.monthlyDeposit * 12 * (i+1))) * Math.pow(1 + SP500_MEAN_RETURN, i+1),
          best: (userProfile.current_cash + (d.monthlyDeposit * 12 * (i+1))) * Math.pow(1 + SP500_MEAN_RETURN + SP500_STD_DEV * 0.8, i+1),
          worst: (userProfile.current_cash + (d.monthlyDeposit * 12 * (i+1))) * Math.pow(1 + SP500_MEAN_RETURN - SP500_STD_DEV * 0.8, i+1),
        }))

        const aggressive: SimulationResult = {
            name: "Aggressive (S&P 500 ETF)",
            outcomes: { best: aggBest, avg: aggAvg, worst: aggWorst },
            timeline: aggressiveTimeline
        };

        // Conservative Simulation
        const CONSERVATIVE_YIELD = 0.08;
        const runConservativeSim = (yieldRate: number) => {
            let wealth = userProfile.current_cash;
            timeline.forEach(deposit => {
                wealth = (wealth + deposit.monthlyDeposit * 12) * (1 + yieldRate);
            });
            return wealth;
        };
        
        const conservativeTimeline = timeline.map((d, i) => ({
          year: d.year,
          avg: runConservativeSim(CONSERVATIVE_YIELD),
          best: runConservativeSim(CONSERVATIVE_YIELD + 0.01),
          worst: runConservativeSim(CONSERVATIVE_YIELD - 0.01)
        }));

        const conservative: SimulationResult = {
            name: "Conservative (8% Dividend Yield)",
            outcomes: { 
                best: runConservativeSim(CONSERVATIVE_YIELD + 0.01),
                avg: runConservativeSim(CONSERVATIVE_YIELD),
                worst: runConservativeSim(CONSERVATIVE_YIELD - 0.01)
            },
            timeline: conservativeTimeline
        };

        setSimulationResults({ aggressive, conservative });

        // Step 5: Post-Retirement
        const scenarios: PostRetirementScenario[] = [];
        const createScenario = (name: string, finalWealth: number): PostRetirementScenario => {
            const monthlyPassiveIncome = (finalWealth * CONSERVATIVE_YIELD) / 12;
            const coverageRatio = monthlyPassiveIncome / userProfile.monthly_spend_retire;
            return {
                name,
                finalWealth,
                monthlyPassiveIncome,
                coverageRatio
            };
        };
        scenarios.push(createScenario("Aggressive - Best Case", aggBest));
        scenarios.push(createScenario("Aggressive - Avg Case", aggAvg));
        scenarios.push(createScenario("Aggressive - Worst Case", aggWorst));
        scenarios.push(createScenario("Conservative - Avg Case", conservative.outcomes.avg));
        setPostRetirementScenarios(scenarios);

        // Step 6: Gemini Financial Coach
        getFinancialAdvice(userProfile, timeline, scenarios).then(response => {
            setAiAdvice({ advice: response.text, sources: response.sources || [] });
            setIsLoading(false);
            setCurrentStep(1);
        }).catch(error => {
            console.error("Error fetching AI advice:", error);
            setAiAdvice({ advice: 'Error generating financial advice. Please try again.', sources: [] });
            setIsLoading(false);
            setCurrentStep(1);
        });

    }, [userProfile]);
    
    const handleInteractivePrompt = useCallback(async (prompt: string) => {
        setInteractiveResponseLoading(true);
        setInteractiveResponse('');
        try {
            const context = {
                userProfile,
                simulationResults,
                postRetirementScenarios
            };
            const response = await getInteractivePromptResponse(prompt, context);
            setInteractiveResponse(response.text);
        } catch (error) {
            console.error("Error with interactive prompt:", error);
            setInteractiveResponse("Sorry, I couldn't process that request. Please try again.");
        } finally {
            setInteractiveResponseLoading(false);
        }
    }, [userProfile, simulationResults, postRetirementScenarios]);
    
    const resetApp = () => {
        setCurrentStep(0);
        setSimulationResults(null);
        setPostRetirementScenarios(null);
        setAiAdvice({ advice: '', sources: [] });
        setInteractiveResponse('');
    };

    const Header = () => (
        <header className="text-center py-8 px-4">
            <div className="flex justify-center items-center gap-4 mb-2">
                <BanknoteIcon className="h-10 w-10 text-brand-primary"/>
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                    Bank Bang Bang
                </h1>
            </div>
            <p className="text-lg text-slate-500">Democratize Private Banking Services</p>
        </header>
    );

    const Footer = () => (
        <footer className="text-center py-6 px-4 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} Bank Bang Bang. All simulations are for illustrative purposes only.</p>
        </footer>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                {currentStep === 0 && (
                    <Step1FinancialIdentity
                        userProfile={userProfile}
                        onProfileUpdate={handleProfileUpdate}
                        onNext={runAllCalculations}
                        isLoading={isLoading}
                    />
                )}

                {currentStep === 1 && simulationResults && postRetirementScenarios && (
                    <FinancialReport
                        userProfile={userProfile}
                        depositTimeline={depositTimeline}
                        simulationResults={simulationResults}
                        postRetirementScenarios={postRetirementScenarios}
                        aiAdvice={aiAdvice}
                        interactiveResponse={interactiveResponse}
                        onInteractivePrompt={handleInteractivePrompt}
                        interactiveLoading={interactiveResponseLoading}
                        onReset={resetApp}
                    />
                )}
            </main>
            <Footer />
        </div>
    );
};

export default App;