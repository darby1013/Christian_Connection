import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronRight, Code2, Shield, Zap, FileText } from 'lucide-react';

export default function TechDebtWidget({ techDebtAnalysis }) {
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const getCategoryDetails = (category) => {
    const details = {
      'Code Smells': {
        issues: [
          { file: 'components/store/ProductCard.jsx', issue: 'Duplicate code block', severity: 'Medium', effort: '2h' },
          { file: 'pages/AdminDashboard.jsx', issue: 'Complex conditional logic', severity: 'Low', effort: '1h' },
          { file: 'components/cart/CartItem.jsx', issue: 'Long parameter list', severity: 'Low', effort: '1.5h' }
        ]
      },
      'Security Issues': {
        issues: [
          { file: 'pages/Checkout.jsx', issue: 'Unvalidated user input', severity: 'Critical', effort: '4h' },
          { file: 'components/payment/PaymentForm.jsx', issue: 'Missing CSRF protection', severity: 'High', effort: '3h' },
          { file: 'api/authService.js', issue: 'Weak password hashing', severity: 'Critical', effort: '5h' }
        ]
      },
      'Performance': {
        issues: [
          { file: 'pages/Store.jsx', issue: 'Unnecessary re-renders', severity: 'Medium', effort: '3h' },
          { file: 'components/ProductList.jsx', issue: 'Missing memoization', severity: 'High', effort: '2h' },
          { file: 'utils/dataProcessing.js', issue: 'Inefficient algorithm', severity: 'High', effort: '4h' }
        ]
      },
      'Documentation': {
        issues: [
          { file: 'components/admin/*', issue: 'Missing JSDoc comments', severity: 'Low', effort: '8h' },
          { file: 'api/integration.js', issue: 'No API documentation', severity: 'Medium', effort: '4h' },
          { file: 'README.md', issue: 'Outdated setup instructions', severity: 'Low', effort: '2h' }
        ]
      }
    };
    return details[category] || { issues: [] };
  };

  const handleDrilldown = (item) => {
    setSelectedCategory(item);
    setDrilldownOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded">
            <p className="text-red-300 text-xs font-bold mb-1">Total Debt</p>
            <p className="text-white font-black text-xl">{techDebtAnalysis.totalDebt}</p>
          </div>
          <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
            <p className="text-yellow-300 text-xs font-bold mb-1">Est. Cost</p>
            <p className="text-white font-black text-xl">{techDebtAnalysis.estimatedCost}</p>
          </div>
        </div>
        <div className="space-y-2">
          {techDebtAnalysis.breakdown.map((item, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between p-2 bg-slate-800 rounded text-sm hover:bg-slate-700 cursor-pointer transition-all group"
              onClick={() => handleDrilldown(item)}
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-300">{item.category}</span>
                <Badge className="bg-slate-700 text-slate-400">{item.items} items</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{item.hours}h</span>
                <Badge className={
                  item.priority === 'Critical' ? 'bg-red-600' :
                  item.priority === 'High' ? 'bg-orange-500' :
                  item.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }>{item.priority}</Badge>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={drilldownOpen} onOpenChange={setDrilldownOpen}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              {selectedCategory?.category === 'Security Issues' && <Shield className="w-5 h-5 text-red-400" />}
              {selectedCategory?.category === 'Performance' && <Zap className="w-5 h-5 text-orange-400" />}
              {selectedCategory?.category === 'Code Smells' && <Code2 className="w-5 h-5 text-yellow-400" />}
              {selectedCategory?.category === 'Documentation' && <FileText className="w-5 h-5 text-blue-400" />}
              {selectedCategory?.category} - Detailed Breakdown
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg text-center">
                <p className="text-slate-400 text-xs font-bold mb-1">TOTAL ITEMS</p>
                <p className="text-white font-black text-2xl">{selectedCategory?.items}</p>
              </div>
              <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg text-center">
                <p className="text-slate-400 text-xs font-bold mb-1">EFFORT REQUIRED</p>
                <p className="text-white font-black text-2xl">{selectedCategory?.hours}h</p>
              </div>
              <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg text-center">
                <p className="text-slate-400 text-xs font-bold mb-1">PRIORITY</p>
                <Badge className={
                  selectedCategory?.priority === 'Critical' ? 'bg-red-600 text-lg px-4 py-1' :
                  selectedCategory?.priority === 'High' ? 'bg-orange-500 text-lg px-4 py-1' :
                  selectedCategory?.priority === 'Medium' ? 'bg-yellow-500 text-lg px-4 py-1' : 'bg-blue-500 text-lg px-4 py-1'
                }>
                  {selectedCategory?.priority}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3">Issues Detected</h4>
              <div className="space-y-3">
                {getCategoryDetails(selectedCategory?.category).issues.map((issue, idx) => (
                  <div key={idx} className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-white font-semibold mb-1">{issue.file}</p>
                        <p className="text-slate-400 text-sm">{issue.issue}</p>
                      </div>
                      <Badge className={
                        issue.severity === 'Critical' ? 'bg-red-600' :
                        issue.severity === 'High' ? 'bg-orange-500' : 'bg-yellow-500'
                      }>
                        {issue.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-slate-500 text-xs">Estimated effort: {issue.effort}</span>
                      <Button size="sm" className="ml-auto bg-cyan-600 hover:bg-cyan-700">
                        Fix Issue
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}