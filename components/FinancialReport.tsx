import React, { useState } from 'react';
import { UserProfile, Deposit, SimulationResult, PostRetirementScenario } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { LineChartIcon, ShieldIcon, MessageSquareIcon, RepeatIcon, TrendingUpIcon, ZapIcon } from './Icons';

interface ReportProps {
    userProfile: UserProfile;
    depositTimeline: Deposit[];
    simulationResults: {
        aggressive: SimulationResult;
        conservative: SimulationResult;
    };
    postRetirementScenarios: PostRetirementScenario[];
    aiAdvice: { advice: string, sources: any[] };
    interactiveResponse: string;
    onInteractivePrompt: (prompt: string) => void;
    interactiveLoading: boolean;
    onReset: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 backdrop-blur-sm p-4 border border-slate-200 rounded-lg shadow-lg text-sm">
                <p className="label font-bold text-slate-800">{`Year: ${label}`}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color }}>
                        {`${p.name}: ${formatCurrency(p.value)}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const Card: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className }) => (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 ${className}`}>
        <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
                {icon}
                <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            </div>
            {children}
        </div>
    </div>
);

const FinancialReport: React.FC<ReportProps> = ({ userProfile, depositTimeline, simulationResults, postRetirementScenarios, aiAdvice, interactiveResponse, onInteractivePrompt, interactiveLoading, onReset }) => {

    const { aggressive, conservative } = simulationResults;
    const combinedChartData = aggressive.timeline.map((aggPoint, index) => ({
        year: aggPoint.year,
        'Aggressive Avg': simulationResults.aggressive.outcomes.avg * ((index+1)/aggressive.timeline.length),
        'Conservative Avg': simulationResults.conservative.outcomes.avg * ((index+1)/aggressive.timeline.length),
    }));

    const interactivePrompts = [
        "Simulate my financial freedom age across both modes.",
        "Visualize the break-even point where passive income equals living cost.",
        "What happens if I re-run the projection with inflation at 3%?",
        "Explain the risk trade-offs between the Aggressive and Conservative modes.",
        "Generate a 'Bank Bang Bang Score' for my profile (Growth + Stability + Liquidity)."
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-extrabold text-slate-900">Your Financial Future, Analyzed.</h2>
                <button onClick={onReset} className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-lg transition border border-slate-300">
                    <RepeatIcon className="h-4 w-4" />
                    Start Over
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main AI Coach */}
                <Card title="Gemini Financial Coach" icon={<MessageSquareIcon className="h-6 w-6 text-brand-primary" />} className="lg:col-span-2">
                    <div className="prose prose-sm md:prose-base max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: aiAdvice.advice.replace(/\n/g, '<br />') }} />
                     {aiAdvice.sources && aiAdvice.sources.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-semibold text-sm text-slate-500">Sources:</h4>
                            <ul className="list-disc list-inside text-xs">
                                {aiAdvice.sources.map((source, index) => (
                                    <li key={index} className="truncate">
                                        <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                            {source.web?.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </Card>

                {/* Post-Retirement Scenarios */}
                <Card title="Retirement Income" icon={<TrendingUpIcon className="h-6 w-6 text-brand-primary" />}>
                    <div className="space-y-4">
                        {postRetirementScenarios.map(scenario => (
                            <div key={scenario.name} className="bg-slate-100 p-3 rounded-lg">
                                <p className="text-sm font-semibold text-slate-800">{scenario.name}</p>
                                <p className="text-2xl font-bold text-brand-primary">{formatCurrency(scenario.monthlyPassiveIncome)}<span className="text-sm text-slate-500">/mo</span></p>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
                                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(scenario.coverageRatio * 100, 100)}%` }}></div>
                                </div>
                                <p className="text-xs text-right text-slate-500 mt-1">{(scenario.coverageRatio * 100).toFixed(0)}% of Goal ({formatCurrency(userProfile.monthly_spend_retire)})</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Charts */}
            <Card title="Wealth Growth Simulations" icon={<LineChartIcon className="h-6 w-6 text-brand-primary" />}>
                 <div className="h-96 w-full">
                    <ResponsiveContainer>
                        <AreaChart data={combinedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="year" tick={{ fill: '#4b5563' }} />
                            <YAxis tickFormatter={formatCurrency} tick={{ fill: '#4b5563' }}/>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                             <Area type="monotone" dataKey="Aggressive Avg" stroke="#34d399" fill="url(#colorAggressive)" strokeWidth={2} />
                            <Area type="monotone" dataKey="Conservative Avg" stroke="#60a5fa" fill="url(#colorConservative)" strokeWidth={2} />
                             <defs>
                                <linearGradient id="colorAggressive" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Simulation Outcomes */}
                <Card title="Retirement Wealth Outcomes" icon={<ShieldIcon className="h-6 w-6 text-brand-primary" />}>
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-lg mb-2">Aggressive Strategy</h4>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div><p className="text-xs text-slate-500">Worst</p><p className="font-bold text-lg text-red-500">{formatCurrency(aggressive.outcomes.worst)}</p></div>
                                <div><p className="text-xs text-slate-500">Average</p><p className="font-bold text-lg text-slate-800">{formatCurrency(aggressive.outcomes.avg)}</p></div>
                                <div><p className="text-xs text-slate-500">Best</p><p className="font-bold text-lg text-green-500">{formatCurrency(aggressive.outcomes.best)}</p></div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-2">Conservative Strategy</h4>
                             <div className="grid grid-cols-3 gap-2 text-center">
                                <div><p className="text-xs text-slate-500">Worst</p><p className="font-bold text-lg text-red-500">{formatCurrency(conservative.outcomes.worst)}</p></div>
                                <div><p className="text-xs text-slate-500">Average</p><p className="font-bold text-lg text-slate-800">{formatCurrency(conservative.outcomes.avg)}</p></div>
                                <div><p className="text-xs text-slate-500">Best</p><p className="font-bold text-lg text-green-500">{formatCurrency(conservative.outcomes.best)}</p></div>
                            </div>
                        </div>
                    </div>
                </Card>

                 {/* Interactive Prompts */}
                <Card title="Ask Gemini" icon={<ZapIcon className="h-6 w-6 text-brand-primary" />}>
                     <div className="flex flex-wrap gap-2 mb-4">
                        {interactivePrompts.map(prompt => (
                            <button key={prompt} onClick={() => onInteractivePrompt(prompt)} disabled={interactiveLoading} className="text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-medium py-1.5 px-3 rounded-full transition">
                                {prompt}
                            </button>
                        ))}
                    </div>
                     {interactiveLoading && <div className="flex justify-center items-center h-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div></div>}
                    {interactiveResponse && (
                        <div className="prose prose-sm max-w-none text-slate-600 bg-slate-50 p-4 rounded-lg">
                            {interactiveResponse}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default FinancialReport;