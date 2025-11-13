
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Plus, Play, Settings,
  Database, Search, Filter, Eye, Trash2, Edit2, Clock, TrendingUp,
  Activity, Zap, RefreshCw, FileText, Link2, Lock, AlertCircle,
  Sparkles, Brain
} from "lucide-react";
import AIAnomalyDetector from "../components/ai/AIAnomalyDetector";

export default function AdminDataIntegrity() {
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkProgress, setCheckProgress] = useState(0);

  const [newRule, setNewRule] = useState({
    rule_name: '',
    rule_type: 'unique_constraint',
    entity_name: 'Product',
    field_name: '',
    rule_definition: {
      expression: '',
      error_message: '',
      severity: 'error'
    },
    auto_check: false,
    check_frequency: 'daily'
  });

  const queryClient = useQueryClient();

  const { data: integrityRules = [] } = useQuery({
    queryKey: ['integrityRules'],
    queryFn: () => base44.entities.DataIntegrityRule.list('-created_date'),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list(),
    initialData: [],
  });

  const entities = ['Product', 'Order', 'User', 'BlogPost']; // Simplified entities from outline

  const createRuleMutation = useMutation({
    mutationFn: (ruleData) => base44.entities.DataIntegrityRule.create(ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrityRules'] });
      setShowCreateRule(false);
      setNewRule({ // Reset form to initial state
        rule_name: '',
        rule_type: 'unique_constraint',
        entity_name: 'Product',
        field_name: '',
        rule_definition: {
          expression: '',
          error_message: '',
          severity: 'error'
        },
        auto_check: false,
        check_frequency: 'daily'
      });
      alert('✅ Rule created successfully!');
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId) => base44.entities.DataIntegrityRule.delete(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrityRules'] });
      alert('✅ Rule deleted!');
    },
  });

  const findDuplicates = (data, field) => {
    const seen = new Map();
    const duplicates = [];
    data.forEach(item => {
      const value = item[field];
      if (value && seen.has(value)) {
        duplicates.push({ record_id: item.id, field: field, value: value, issue: 'Duplicate value', duplicate_of_record: seen.get(value) });
      } else if (value) {
        seen.set(value, item.id);
      }
    });
    return duplicates;
  };

  const findNulls = (data, field) => {
    const nulls = [];
    data.forEach(item => {
      const value = item[field];
      if (value === null || value === undefined || value === '') {
        nulls.push({ record_id: item.id, field: field, value: value, issue: 'Null or empty value' });
      }
    });
    return nulls;
  };

  const runIntegrityCheck = async (rule) => {
    setChecking(true);
    setCheckProgress(0);
    setSelectedRule(rule);

    // Simulate check progress
    for (let i = 0; i <= 100; i += 10) {
      setCheckProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Run actual check based on rule type
    let violations = [];
    let checked_records_count = 0;
    let data_to_check = [];

    // Determine which entity data to use
    if (rule.entity_name === 'Product') {
      data_to_check = products;
    } else if (rule.entity_name === 'Order') {
      data_to_check = orders;
    }
    // Add more entities as needed

    checked_records_count = data_to_check.length;

    if (rule.rule_type === 'unique_constraint') {
      violations = findDuplicates(data_to_check, rule.field_name);
    } else if (rule.rule_type === 'not_null') {
      violations = findNulls(data_to_check, rule.field_name);
    }
    // Add more check types here as they are implemented

    // Update rule with results
    await base44.entities.DataIntegrityRule.update(rule.id, {
      last_check_date: new Date().toISOString(),
      violations_count: violations.length,
      last_violations: violations.slice(0, 10) // Store a sample of violations
    });

    queryClient.invalidateQueries({ queryKey: ['integrityRules'] });

    setChecking(false);
    setCheckProgress(0);
    alert(`✅ Check complete for rule "${rule.rule_name}"! Found ${violations.length} violations.`);
  };

  const runAllChecks = async () => {
    setChecking(true);
    // Filter for active rules that are not auto_check (if you want to differentiate)
    // For now, run all active rules
    const rulesToRun = integrityRules.filter(r => r.is_active); 
    
    for (let i = 0; i < rulesToRun.length; i++) {
        const rule = rulesToRun[i];
        setSelectedRule(rule); // Indicate which rule is being checked
        setCheckProgress(0); // Reset progress for each rule
        await runIntegrityCheck(rule); // This will update rule-specific progress and then reset it
        // A small delay between checks to make it visible
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    setSelectedRule(null);
    setChecking(false);
    setCheckProgress(0);
    alert('✅ All active checks completed!');
  };


  const activeRules = integrityRules.filter(r => r.is_active);
  const totalViolations = integrityRules.reduce((sum, r) => sum + (r.violations_count || 0), 0);
  const passingChecks = integrityRules.filter(r => (r.violations_count || 0) === 0).length;
  const criticalIssues = integrityRules.filter(r => r.rule_definition?.severity === 'error' && (r.violations_count || 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Data Integrity Center</h2>
          <p className="text-slate-400 font-semibold">Define rules, monitor data quality, and detect anomalies with AI</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runAllChecks} variant="outline" className="border-slate-700" disabled={checking || activeRules.length === 0}>
            <Play className="w-4 h-4 mr-2" />
            Run All Checks
          </Button>
          <Button onClick={() => setShowCreateRule(true)} className="bg-cyan-500 hover:bg-cyan-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <Shield className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{activeRules.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Active Rules</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{passingChecks}</p>
            <p className="text-slate-400 text-sm font-semibold">Passing Checks</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <AlertTriangle className="w-10 h-10 text-orange-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{totalViolations}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Violations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <XCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{criticalIssues}</p>
            <p className="text-slate-400 text-sm font-semibold">Critical Issues</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Anomaly Detector */}
      <AIAnomalyDetector data={integrityRules} dataType="integrity" />

      {/* Checking Progress */}
      {checking && (
        <Card className="bg-cyan-900/20 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                <span className="text-cyan-300 font-bold">
                  {selectedRule ? `Checking rule: ${selectedRule.rule_name}...` : 'Running integrity checks...'}
                </span>
              </div>
              <span className="text-cyan-200 font-bold">{checkProgress}%</span>
            </div>
            <Progress value={checkProgress} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Integrity Rules List */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Integrity Rules</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {integrityRules.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold text-xl mb-2">No Rules Defined</h3>
              <p className="text-slate-400 mb-6">Create your first data integrity rule</p>
              <Button onClick={() => setShowCreateRule(true)} className="bg-cyan-500 hover:bg-cyan-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Rule
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {integrityRules.map(rule => (
                <Card key={rule.id} className={`bg-slate-900/50 ${
                  (rule.violations_count || 0) > 0 ? 'border-red-500/30' : 'border-slate-700'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-white font-bold">{rule.rule_name}</h4>
                          <Badge className="bg-cyan-500">{rule.rule_type}</Badge>
                          <Badge className={rule.is_active ? 'bg-green-500' : 'bg-slate-500'}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {(rule.violations_count || 0) > 0 && (
                            <Badge className="bg-red-500">{rule.violations_count} violations</Badge>
                          )}
                          {(rule.violations_count === 0 && rule.last_check_date) && (
                            <Badge className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Passing
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">
                          {rule.entity_name}.{rule.field_name} • {rule.rule_definition?.severity || 'error'}
                        </p>
                        {rule.last_check_date && (
                          <p className="text-slate-500 text-xs mt-1">
                            Last checked: {new Date(rule.last_check_date).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => runIntegrityCheck(rule)}
                          disabled={checking}
                          className="bg-purple-500 hover:bg-purple-600"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRuleMutation.mutate(rule.id)}
                          className="border-red-500/30 text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Create Rule Modal */}
      {showCreateRule && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateRule(false)}>
          <Card className="bg-[#1a1f3a] border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">Create Integrity Rule</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-white font-bold mb-2 block">Rule Name</Label>
                <Input
                  placeholder="e.g., Unique Product SKU"
                  value={newRule.rule_name}
                  onChange={(e) => setNewRule({...newRule, rule_name: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white font-bold mb-2 block">Rule Type</Label>
                  <Select value={newRule.rule_type} onValueChange={(value) => setNewRule({...newRule, rule_type: value})}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="unique_constraint" className="text-white">Unique Constraint</SelectItem>
                      <SelectItem value="not_null" className="text-white">Not Null</SelectItem>
                      <SelectItem value="foreign_key" className="text-white">Foreign Key</SelectItem>
                      <SelectItem value="check_constraint" className="text-white">Check Constraint</SelectItem>
                      <SelectItem value="data_format" className="text-white">Data Format</SelectItem>
                      <SelectItem value="range_validation" className="text-white">Range Validation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white font-bold mb-2 block">Entity</Label>
                  <Select value={newRule.entity_name} onValueChange={(value) => setNewRule({...newRule, entity_name: value})}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {entities.map(entity => (
                        <SelectItem key={entity} value={entity} className="text-white">
                          {entity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Field Name</Label>
                <Input
                  placeholder="e.g., sku, email, price"
                  value={newRule.field_name}
                  onChange={(e) => setNewRule({...newRule, field_name: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={newRule.auto_check}
                    onCheckedChange={(checked) => setNewRule({...newRule, auto_check: checked})}
                  />
                  <span className="text-slate-300 text-sm">Enable automatic checking</span>
                </label>
                
                {newRule.auto_check && (
                  <div>
                    <Label className="text-white font-bold mb-2 block">Check Frequency</Label>
                    <Select value={newRule.check_frequency} onValueChange={(value) => setNewRule({...newRule, check_frequency: value})}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="hourly" className="text-white">Hourly</SelectItem>
                        <SelectItem value="daily" className="text-white">Daily</SelectItem>
                        <SelectItem value="weekly" className="text-white">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowCreateRule(false)} variant="outline" className="flex-1 border-slate-700">
                  Cancel
                </Button>
                <Button onClick={() => createRuleMutation.mutate({...newRule, is_active: true})} className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                  Create Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
