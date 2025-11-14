import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { Wand2, Sparkles, Loader2, Copy, RefreshCw } from 'lucide-react';

export default function AdminAIToneEditor() {
  const [originalText, setOriginalText] = useState('');
  const [targetTone, setTargetTone] = useState('professional');
  const [rewriting, setRewriting] = useState(false);
  const [rewrittenText, setRewrittenText] = useState('');

  const tones = [
    { value: 'professional', label: 'Professional', desc: 'Formal and business-appropriate' },
    { value: 'casual', label: 'Casual', desc: 'Relaxed and conversational' },
    { value: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
    { value: 'persuasive', label: 'Persuasive', desc: 'Convincing and compelling' },
    { value: 'inspirational', label: 'Inspirational', desc: 'Motivating and uplifting' },
    { value: 'humorous', label: 'Humorous', desc: 'Light and entertaining' },
    { value: 'formal', label: 'Formal', desc: 'Academic and scholarly' },
    { value: 'empathetic', label: 'Empathetic', desc: 'Understanding and compassionate' }
  ];

  const rewriteContent = async () => {
    if (!originalText) {
      alert('Please enter text to rewrite');
      return;
    }

    setRewriting(true);
    try {
      const selectedTone = tones.find(t => t.value === targetTone);
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Rewrite the following text in a ${selectedTone.label.toLowerCase()} tone (${selectedTone.desc}):

Original text:
${originalText}

Requirements:
- Maintain the core message and facts
- Adjust language, vocabulary, and style to match the ${selectedTone.label.toLowerCase()} tone
- Keep approximately the same length
- Ensure clarity and readability
- Make it sound natural and authentic

Provide only the rewritten text.`
      });

      setRewrittenText(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setRewriting(false);
    }
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI Tone Editor"
        subtitle="Rewrite content in different tones and styles"
        icon={Wand2}
        badge="AI"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-white font-bold mb-2 block">Original Text</label>
              <Textarea
                placeholder="Paste your content here..."
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white h-64"
              />
              <p className="text-slate-500 text-xs mt-1">{originalText.split(' ').filter(w => w).length} words</p>
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-3 block">Target Tone</label>
              <div className="grid gap-2">
                {tones.map(t => (
                  <div
                    key={t.value}
                    onClick={() => setTargetTone(t.value)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      targetTone === t.value ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <p className={`font-bold text-sm ${targetTone === t.value ? 'text-cyan-300' : 'text-white'}`}>{t.label}</p>
                    <p className="text-slate-400 text-xs">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={rewriteContent}
              disabled={rewriting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 font-bold h-12"
            >
              {rewriting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Rewriting...</> : <><Wand2 className="w-5 h-5 mr-2" />Rewrite Text</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-white font-bold">Rewritten Text</label>
              {rewrittenText && (
                <Button size="sm" onClick={() => navigator.clipboard.writeText(rewrittenText)} variant="outline" className="border-slate-600">
                  <Copy className="w-3 h-3 mr-1" />Copy
                </Button>
              )}
            </div>

            {rewrittenText ? (
              <>
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 min-h-64 max-h-96 overflow-y-auto">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{rewrittenText}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-xs">{rewrittenText.split(' ').filter(w => w).length} words</p>
                  <Badge className="bg-purple-500">Tone: {tones.find(t => t.value === targetTone)?.label}</Badge>
                </div>
              </>
            ) : (
              <div className="text-center py-24 bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-700">
                <Wand2 className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Rewritten text will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}