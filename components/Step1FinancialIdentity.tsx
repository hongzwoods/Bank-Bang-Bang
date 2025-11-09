import React from 'react';
import { UserProfile } from '../types';
import { RocketIcon } from './Icons';

interface Step1Props {
    userProfile: UserProfile;
    onProfileUpdate: (profile: UserProfile) => void;
    onNext: () => void;
    isLoading: boolean;
}

// Reusable Input component
const InputField: React.FC<{ label: string; id: keyof UserProfile; value: number; onChange: (id: keyof UserProfile, value: number) => void; type?: 'number' | 'percentage'; }> = ({ label, id, value, onChange, type = 'number' }) => {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
            <div className="relative">
                <input
                    type="number"
                    id={id}
                    name={id}
                    value={value}
                    onChange={(e) => onChange(id, parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-100 border border-slate-300 rounded-md shadow-sm py-2 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                    placeholder={type === 'number' ? 'e.g. 50000' : 'e.g. 3'}
                />
                {type === 'number' && <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">$</span>}
                {type === 'percentage' && <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">%</span>}
            </div>
        </div>
    );
};

const Step1FinancialIdentity: React.FC<Step1Props> = ({ userProfile, onProfileUpdate, onNext, isLoading }) => {

    const handleChange = (id: keyof UserProfile, value: number) => {
        onProfileUpdate({ ...userProfile, [id]: value });
    };

    const fields: {id: keyof UserProfile; label: string; type?: 'number' | 'percentage';}[] = [
        {id: "age", label: "Current Age"},
        {id: "current_cash", label: "Current Investible Cash / Liquid Assets"},
        {id: "annual_salary", label: "Annual Salary"},
        {id: "salary_growth", label: "Expected Salary Growth per Year", type: "percentage"},
        {id: "monthly_spend", label: "Current Total Monthly Spending"},
        {id: "retirement_age", label: "Expected Retirement Age"},
        {id: "monthly_spend_retire", label: "Expected Monthly Expenditure After Retirement"},
        {id: "stable_income_retire", label: "Expected Stable Monthly Income After Retirement"}
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-slate-900 text-center mb-1">Financial Identity Setup</h2>
                    <p className="text-center text-slate-500 mb-8">Provide your financial details to start the projection.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {fields.map(field => (
                           <InputField key={field.id} label={field.label} id={field.id} value={userProfile[field.id]} onChange={handleChange} type={field.type} />
                       ))}
                    </div>

                    <div className="mt-10 flex justify-center">
                        <button
                            onClick={onNext}
                            disabled={isLoading}
                            className="w-full md:w-auto flex items-center justify-center gap-3 bg-brand-primary hover:bg-green-500 disabled:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:scale-100"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Analyzing Future...
                                </>
                            ) : (
                                <>
                                    <RocketIcon className="h-5 w-5" />
                                    Launch Financial Projection
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Step1FinancialIdentity;