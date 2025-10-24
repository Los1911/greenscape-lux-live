import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RLSPolicyGenerator } from './RLSPolicyGenerator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import { RLSAuditSystem, RLSAuditReport, RLSTestResult } from '@/utils/rlsAuditSystem';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export function RLSAuditPanel() {
  const [auditSystem] = useState(() => new RLSAuditSystem());
  const [auditReport, setAuditReport] = useState<RLSAuditReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('all');

  const runAudit = async () => {
    setIsRunning(true);
    try {
      const report = await auditSystem.runComprehensiveAudit();
      setAuditReport(report);
    } catch (error) {
      console.error('Audit failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getResultsByTable = (table: string): RLSTestResult[] => {
    if (!auditReport) return [];
    return auditReport.results.filter(r => r.table === table);
  };

  const getUniqueTablesFromResults = (): string[] => {
    if (!auditReport) return [];
    return [...new Set(auditReport.results.map(r => r.table))].sort();
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            RLS Security Audit System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                Comprehensive Row Level Security policy testing and validation
              </p>
              {auditReport && (
                <p className="text-xs text-gray-500">
                  Last run: {new Date(auditReport.timestamp).toLocaleString()}
                </p>
              )}
            </div>
            <Button 
              onClick={runAudit} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Running Audit...' : 'Run Security Audit'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Overview */}
      {auditReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{auditReport.totalTests}</div>
              <p className="text-xs text-gray-600">Total Tests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{auditReport.passedTests}</div>
              <p className="text-xs text-gray-600">Passed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{auditReport.failedTests}</div>
              <p className="text-xs text-gray-600">Failed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {auditReport.securityIssues.length}
              </div>
              <p className="text-xs text-gray-600">Security Issues</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Issues */}
      {auditReport && auditReport.securityIssues.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Security Issues Detected:</p>
              <ul className="list-disc list-inside space-y-1">
                {auditReport.securityIssues.map((issue, index) => (
                  <li key={index} className="text-sm">{issue}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="audit" className="w-full">
        <TabsList>
          <TabsTrigger value="audit">Security Audit</TabsTrigger>
          <TabsTrigger value="generator">Policy Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          {/* Detailed Results */}
          {auditReport && (
            <Tabs defaultValue="by-table" className="w-full">
              <TabsList>
                <TabsTrigger value="by-table">By Table</TabsTrigger>
                <TabsTrigger value="by-role">By Role</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>
              <TabsContent value="by-table" className="space-y-4">
                {getUniqueTablesFromResults().map(table => (
                  <Card key={table}>
                    <CardHeader>
                      <CardTitle className="text-lg">{table}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['anon', 'authenticated', 'service_role'].map(role => (
                          <div key={role} className="space-y-2">
                            <h4 className="font-medium capitalize">{role}</h4>
                            <div className="space-y-1">
                              {['SELECT', 'INSERT', 'UPDATE', 'DELETE'].map(operation => {
                                const result = getResultsByTable(table).find(
                                  r => r.role === role && r.operation === operation
                                );
                                return (
                                  <div key={operation} className="flex items-center justify-between text-sm">
                                    <span>{operation}</span>
                                    <div className={`flex items-center gap-1 ${getStatusColor(result?.success || false)}`}>
                                      {getStatusIcon(result?.success || false)}
                                      <Badge variant={result?.success ? 'default' : 'destructive'}>
                                        {result?.success ? 'Pass' : 'Fail'}
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="by-role" className="space-y-4">
                {['anon', 'authenticated', 'service_role'].map(role => (
                  <Card key={role}>
                    <CardHeader>
                      <CardTitle className="capitalize">{role} Role</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Table</th>
                              <th className="text-left p-2">Operation</th>
                              <th className="text-left p-2">Status</th>
                              <th className="text-left p-2">Error</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditReport.results
                              .filter(r => r.role === role)
                              .map((result, index) => (
                                <tr key={index} className="border-b">
                                  <td className="p-2">{result.table}</td>
                                  <td className="p-2">{result.operation}</td>
                                  <td className="p-2">
                                    <Badge variant={result.success ? 'default' : 'destructive'}>
                                      {result.success ? 'Pass' : 'Fail'}
                                    </Badge>
                                  </td>
                                  <td className="p-2 text-xs text-gray-600">
                                    {result.error || 'None'}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="recommendations">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {auditReport.recommendations.length > 0 ? (
                      <ul className="space-y-2">
                        {auditReport.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-green-600">No security issues detected. All RLS policies appear to be properly configured.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>

        <TabsContent value="generator">
          <RLSPolicyGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}