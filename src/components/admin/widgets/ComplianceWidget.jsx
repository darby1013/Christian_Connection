import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileCheck } from 'lucide-react';

export default function ComplianceWidget({ complianceStatus }) {
  const getDocumentationUrl = (framework) => {
    const urls = {
      'GDPR': 'https://gdpr.eu/documentation/',
      'SOX': 'https://www.sec.gov/sox',
      'HIPAA': 'https://www.hhs.gov/hipaa/index.html',
      'PCI-DSS': 'https://www.pcisecuritystandards.org/',
      'SOC 2': 'https://www.aicpa.org/soc2'
    };
    return urls[framework] || '#';
  };

  const handleViewEvidence = (framework) => {
    window.alert(`📋 Compliance Evidence for ${framework}\n\n✅ ${framework.passed || 0} checks passed\n❌ ${framework.failed || 0} checks failed\n\nLast audit: ${new Date().toLocaleDateString()}\nNext audit: ${new Date(Date.now() + 90*24*60*60*1000).toLocaleDateString()}\n\nEvidence files available in compliance archive.`);
  };

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
        <div className="text-4xl font-black text-green-400">{complianceStatus.overallCompliance}%</div>
        <p className="text-green-300 text-sm font-bold">Overall Score</p>
      </div>
      <div className="space-y-2">
        {complianceStatus.checks.map((check, idx) => (
          <div key={idx} className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold">{check.framework}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">{check.score}%</span>
                <Badge className={check.status === 'Passing' ? 'bg-green-500' : 'bg-yellow-500'}>
                  {check.status}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-400">✓ {check.passed}</span>
              <span className="text-slate-500">•</span>
              <span className="text-red-400">✗ {check.failed}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1 text-xs border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={() => window.open(getDocumentationUrl(check.framework), '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Documentation
              </Button>
              <Button 
                size="sm"
                className="flex-1 text-xs bg-cyan-600 hover:bg-cyan-700"
                onClick={() => handleViewEvidence(check)}
              >
                <FileCheck className="w-3 h-3 mr-1" />
                View Evidence
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}