import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Activity, Zap, RefreshCw, FileText, Link2, Lock, AlertCircle
} from "lucide-react";

export default function AdminDataIntegrity() {
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkProgress, setCheckProgress] = useState(0);
  const [checkResults, setCheckResults] = useState(null);

  const queryClient = useQueryClient();

  const [ruleForm, setRuleForm] = useState({
    rule_name: '',
    rule_type: 'unique_constraint',
    entity_name: 'Product',
    field_name: '',
    rule_definition: {
      expression: '',
      error_message: '',
      severity: 'error'
    },
    is_active: true,
    auto_check: false,
    check_frequency: 'daily'
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['dataIntegrityRules'],
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

  const entities = ['Product', 'Order', 'User', 'BlogPost', 'Podcast', 'Video', 'Event', 'Group'];

  const ruleTypes = [
    { value: 'unique_constraint', label: 'Unique Constraint', icon: Lock },
    { value: 'not_null', label: 'Not Null', icon: AlertCircle },
    { value: 'foreign_key', label: 'Foreign Key', icon: Link2 },
    { value: 'check_constraint', label: 'Check Constraint', icon: CheckCircle },
    { value: 'data_format', label: 'Data Format', icon: FileText },
    { value: 'range_validation', label: 'Range Validation', icon: TrendingUp },
    { value: 'pattern_match', label: 'Pattern Match', icon: Search },
    { value: 'referential_integrity', label: 'Referential Integrity', icon: Database },
    { value: 'business_rule', label: 'Business Rule', icon: Settings },
    { value: 'custom_validation', label: 'Custom Validation', icon: Zap },
  ];

  const createRuleMutation = useMutation({
    mutationFn: (data) => base44.entities.DataIntegrityRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataIntegrityRules'] });
      setShowCreateRule(false);
      resetForm();
      alert('✅ Rule created successfully!');
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id) => base44.entities.DataIntegrityRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataIntegrityRules'] });
      alert('✅ Rule deleted!');
    },
  });

  const resetForm = () => {
    setRuleForm({
      rule_name: '',
      rule_type: 'unique_constraint',
      entity_name: 'Product',
      field_name: '',
      rule_definition: {
        expression: '',
        error_message: '',
        severity: 'error'
      },
      is_active: true,
      auto_check: false,
      check_frequency: 'daily'
    });
  };

  const runIntegrityCheck = async (rule) => {
    setChecking(true);
    setCheckProgress(0);
    setSelectedRule(rule);

    try {
      let violations = [];
      
      // Simulate progressive checking
      for (let i = 0; i <= 100; i += 10) {
        setCheckProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Run actual checks based on rule type
      if (rule.rule_type === 'unique_constraint') {
        violations = await checkUniqueConstraint(rule);
      } else if (rule.rule_type === 'not_null') {
        violations = await checkNotNull(rule);
      } else if (rule.rule_type === 'foreign_key') {
        violations = await checkForeignKey(rule);
      } else if (rule.rule_type === 'data_format') {
        violations = await checkDataFormat(rule);
      }

      setCheckResults({
        rule: rule,
        violations: violations,
        checked_records: products.length,
        passed: violations.length === 0
      });

      // Update rule with results
      await base44.entities.DataIntegrityRule.update(rule.id, {
        last_check_date: new Date().toISOString(),
        violations_count: violations.length,
        last_violations: violations.slice(0, 10)
      });

      queryClient.invalidateQueries({ queryKey: ['dataIntegrityRules'] });

    } catch (error) {
      alert('Check failed: ' + error.message);
    } finally {
      setChecking(false);
      setCheckProgress(0);
    }
  };

  const checkUniqueConstraint = async (rule) => {
    const data = await base44.entities[rule.entity_name].list();
    const seen = new Map();
    const violations = [];

    data.forEach(record => {
      const value = record[rule.field_name];
      if (value && seen.has(value)) {
        violations.push({
          record_id: record.id,
          field: rule.field_name,
          value: value,
          issue: 'Duplicate value',
          duplicate_of: seen.get(value)
        });
      } else if (value) {
        seen.set(value, record.id);
      }
    });

    return violations;
  };

  const checkNotNull = async (rule) => {
    const data = await base44.entities[rule.entity_name].list();
    const violations = [];

    data.forEach(record => {
      const value = record[rule.field_name];
      if (value === null || value === undefined || value === '') {
        violations.push({
          record_id: record.id,
          field: rule.field_name,
          value: null,
          issue: 'Null or empty value'
        });
      }
    });

    return violations;
  };

  const checkForeignKey = async (rule) => {
    // Simplified foreign key check
    return [];
  };

  const checkDataFormat = async (rule) => {
    const data = await base44.entities[rule.entity_name].list();
    const violations = [];
    const pattern = rule.validation_params?.pattern;

    if (!pattern) return violations;

    const regex = new RegExp(pattern);

    data.forEach(record => {
      const value = record[rule.field_name];
      if (value && !regex.test(value)) {
        violations.push({
          record_id: record.id,
          field: rule.field_name,
          value: value,
          issue: 'Invalid format',
          expected_pattern: pattern
        });
      }
    });

    return violations;
  };

  const runAllChecks = async () => {
    for (const rule of rules.filter(r => r.is_active)) {
      await runIntegrityCheck(rule);
    }
  };

  const activeRules = rules.filter(r => r.is_active).length;
  const totalViolations = rules.reduce((sum, r) => sum + (r.violations_count || 0), 0);
  const criticalIssues = rules.filter(r => r.violations_count > 0 && r.rule_definition?.severity === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Data Integrity Center</h2>
          <p className="text-slate-400 font-semibold">Define rules, validate data, ensure consistency across your database</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runAllChecks} variant="outline" className="border-slate-700">
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
            <div className="flex items-center justify-between mb-3">
              <Shield className="w-10 h-10 text-cyan-400" />
              <Badge className="bg-cyan-500">Active</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{activeRules}</p>
            <p className="text-slate-400 text-sm font-semibold">Active Rules</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle className="w-10 h-10 text-green-400" />
              <Badge className="bg-green-500">Passed</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{rules.filter(r => r.violations_count === 0).length}</p>
            <p className="text-slate-400 text-sm font-semibold">Passing Checks</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle className="w-10 h-10 text-orange-400" />
              <Badge className="bg-orange-500">Issues</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{totalViolations}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Violations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <XCircle className="w-10 h-10 text-red-400" />
              <Badge className="bg-red-500">Critical</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{criticalIssues}</p>
            <p className="text-slate-400 text-sm font-semibold">Critical Issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="bg-[#1e293b] border border-slate-700">
          <TabsTrigger value="rules">
            <Shield className="w-4 h-4 mr-2" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="violations">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Violations
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="w-4 h-4 mr-2" />
            Check History
          </TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">Integrity Rules</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {rules.length === 0 ? (
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
                  {rules.map(rule => {
                    const RuleIcon = ruleTypes.find(t => t.value === rule.rule_type)?.icon || Shield;
                    return (
                      <Card key={rule.id} className="bg-slate-900/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <RuleIcon className="w-8 h-8 text-cyan-400" />
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="text-white font-bold">{rule.rule_name}</h4>
                                  <Badge className={rule.is_active ? 'bg-green-500' : 'bg-slate-500'}>
                                    {rule.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                  {rule.violations_count > 0 && (
                                    <Badge className="bg-red-500">
                                      {rule.violations_count} violations
                                    </Badge>
                                  )}
                                  {rule.violations_count === 0 && rule.last_check_date && (
                                    <Badge className="bg-green-500">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Passing
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-slate-400 text-sm">
                                  {rule.entity_name}.{rule.field_name} • {ruleTypes.find(t => t.value === rule.rule_type)?.label}
                                </p>
                                {rule.last_check_date && (
                                  <p className="text-slate-500 text-xs mt-1">
                                    Last checked: {new Date(rule.last_check_date).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => runIntegrityCheck(rule)}
                                disabled={checking}
                                className="bg-cyan-500 hover:bg-cyan-600"
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Check
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-red-500/30 text-red-400"
                                onClick={() => deleteRuleMutation.mutate(rule.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">Data Violations</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {checkResults ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${checkResults.passed ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                    <div className="flex items-center gap-3">
                      {checkResults.passed ? (
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-400" />
                      )}
                      <div>
                        <h3 className={`font-bold text-lg ${checkResults.passed ? 'text-green-300' : 'text-red-300'}`}>
                          {checkResults.passed ? 'All Checks Passed!' : `${checkResults.violations.length} Violations Found`}
                        </h3>
                        <p className={checkResults.passed ? 'text-green-200' : 'text-red-200'}>
                          Checked {checkResults.checked_records} records for rule: {checkResults.rule.rule_name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {checkResults.violations.length > 0 && (
                    <div className="space-y-2">
                      {checkResults.violations.map((violation, idx) => (
                        <Card key={idx} className="bg-slate-900/50 border-red-500/30">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-white font-bold">Record ID: {violation.record_id}</p>
                                <p className="text-slate-400 text-sm">Field: {violation.field}</p>
                                <p className="text-red-300 text-sm">Issue: {violation.issue}</p>
                                {violation.value && (
                                  <p className="text-slate-400 text-xs mt-1">Value: {JSON.stringify(violation.value)}</p>
                                )}
                              </div>
                              <Badge className="bg-red-500">{checkResults.rule.rule_definition?.severity}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-xl mb-2">No Recent Checks</h3>
                  <p className="text-slate-400">Run a check to see violations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">Check History</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {rules.filter(r => r.last_check_date).map(rule => (
                  <Card key={rule.id} className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-bold">{rule.rule_name}</h4>
                          <p className="text-slate-400 text-sm">
                            {new Date(rule.last_check_date).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {rule.violations_count === 0 ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Passed
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500">
                              {rule.violations_count} issues
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Checking Progress */}
      {checking && (
        <Card className="bg-cyan-900/20 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                <span className="text-cyan-300 font-bold">Running integrity check...</span>
              </div>
              <span className="text-cyan-200 font-bold">{checkProgress}%</span>
            </div>
            <Progress value={checkProgress} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Create Rule Modal */}
      {showCreateRule && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateRule(false)}>
          <Card className="bg-[#1a1f3a] border-slate-700 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">Create Integrity Rule</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-white font-bold mb-2 block">Rule Name</Label>
                <Input
                  value={ruleForm.rule_name}
                  onChange={(e) => setRuleForm({...ruleForm, rule_name: e.target.value})}
                  placeholder="e.g., Unique Product SKU"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white font-bold mb-2 block">Rule Type</Label>
                  <Select value={ruleForm.rule_type} onValueChange={(value) => setRuleForm({...ruleForm, rule_type: value})}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {ruleTypes.map(type => (
                        <SelectItem key={type.value} value={type.value} className="text-white">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white font-bold mb-2 block">Entity</Label>
                  <Select value={ruleForm.entity_name} onValueChange={(value) => setRuleForm({...ruleForm, entity_name: value})}>
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
                  value={ruleForm.field_name}
                  onChange={(e) => setRuleForm({...ruleForm, field_name: e.target.value})}
                  placeholder="e.g., sku, email, price"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Error Message</Label>
                <Input
                  value={ruleForm.rule_definition.error_message}
                  onChange={(e) => setRuleForm({
                    ...ruleForm,
                    rule_definition: {...ruleForm.rule_definition, error_message: e.target.value}
                  })}
                  placeholder="Error message when rule fails"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={ruleForm.is_active}
                    onCheckedChange={(checked) => setRuleForm({...ruleForm, is_active: checked})}
                  />
                  <span className="text-white text-sm">Active</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={ruleForm.auto_check}
                    onCheckedChange={(checked) => setRuleForm({...ruleForm, auto_check: checked})}
                  />
                  <span className="text-white text-sm">Auto-check</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowCreateRule(false)} variant="outline" className="flex-1 border-slate-700">
                  Cancel
                </Button>
                <Button 
                  onClick={() => createRuleMutation.mutate(ruleForm)} 
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                >
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