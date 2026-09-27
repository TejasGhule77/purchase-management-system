import React from 'react';
import { FileText, CheckCircle2, DollarSign, Package, Truck, CreditCard } from 'lucide-react';

const WorkflowSteps = ({ currentStep = 1, compact = false }) => {
  const steps = [
    { number: 1, label: 'Purchase Request', icon: FileText, desc: 'Created & Submitted' },
    { number: 2, label: 'Manager Approval', icon: CheckCircle2, desc: 'Approved' },
    { number: 3, label: 'Supplier Quotations', icon: DollarSign, desc: 'Quotes Compared & Selected' },
    { number: 4, label: 'Purchase Order', icon: Package, desc: 'PO Issued' },
    { number: 5, label: 'Goods Receipt', icon: Truck, desc: 'Items Verified' },
    { number: 6, label: 'Payment Done', icon: CreditCard, desc: 'Settled & Completed' },
  ];

  if (compact) {
    return (
      <div className="flex items-center space-x-2 overflow-x-auto py-2">
        {steps.map((step, idx) => {
          const isDone = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          return (
            <React.Fragment key={step.number}>
              <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isDone ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                isCurrent ? 'bg-blue-50 text-blue-700 border border-blue-300 font-semibold ring-2 ring-blue-100' :
                'bg-slate-100 text-slate-400'
              }`}>
                <span>{step.number}. {step.label}</span>
              </div>
              {idx < steps.length - 1 && <span className="text-slate-300 text-xs">→</span>}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Purchase Lifecycle Workflow</h4>
        <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">Stage {currentStep} of 6</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {steps.map((step) => {
          const isDone = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const Icon = step.icon;

          return (
            <div
              key={step.number}
              className={`relative p-3 rounded-lg border transition-all ${
                isDone
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : isCurrent
                  ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm ring-2 ring-blue-100'
                  : 'bg-slate-50/50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
                  isDone ? 'bg-emerald-600 text-white' :
                  isCurrent ? 'bg-blue-600 text-white' :
                  'bg-slate-200 text-slate-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold opacity-60">0{step.number}</span>
              </div>
              <p className="text-xs font-semibold leading-tight">{step.label}</p>
              <p className="text-[11px] opacity-75 mt-0.5 truncate">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowSteps;
