import React, { useState, useEffect } from 'react';
import { checkSupabaseConfigHealth, type SupabaseConfigHealth } from '@/lib/configHealthCheck';
import { runDiagnosticAudit, type DiagnosticReport } from '@/lib/diagnosticAudit';
import { ConfigTestPanel } from '@/components/ConfigTestPanel';
export default function ConfigHealthPanel() {
  const [healthData, setHealthData] = useState<SupabaseConfigHealth | null>(null);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'health' | 'diagnostic' | 'test'>('health');

  useEffect(() => {
    setHealthData(checkSupabaseConfigHealth());
    setDiagnosticData(runDiagnosticAudit());
    
    // Log diagnostic report to console
    console.log('🔍 FAMOUS DIAGNOSTIC AUDIT:', runDiagnosticAudit());
  }, []);

  const copyReport = async () => {
    if (!healthData || !diagnosticData) return;
    try {
      const report = {
        healthCheck: healthData,
        diagnosticAudit: diagnosticData
      };
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const close = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('health');
    window.history.replaceState({}, '', url.toString());
    window.location.reload();
  };

  if (!healthData || !diagnosticData) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-auto shadow-[0_0_40px_rgba(16,185,129,0.15)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-emerald-200">Famous Diagnostic Audit</h2>
          <button onClick={close} className="text-emerald-300 hover:text-white text-xl">×</button>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6 border-b border-emerald-500/20">
          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-2 font-semibold ${activeTab === 'health' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-emerald-200'}`}
          >
            Health Check
          </button>
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`px-4 py-2 font-semibold ${activeTab === 'diagnostic' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-emerald-200'}`}
          >
            Full Diagnostic
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-4 py-2 font-semibold ${activeTab === 'test' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-emerald-200'}`}
          >
            ?sb= Test
          </button>
        </div>

        {activeTab === 'health' && (
          <>
            <div className="mb-6">
              <div className="text-lg font-semibold mb-2">Active Source:</div>
              <div className={`text-3xl font-bold ${
                healthData.activeSource === 'ENV' ? 'text-emerald-400' :
                healthData.activeSource === 'LOCAL' ? 'text-yellow-400' :
                healthData.activeSource === 'QUERY' ? 'text-blue-400' :
                'text-red-400'
              }`}>
                {healthData.activeSource}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-zinc-800 rounded-lg p-4 border border-emerald-500/20">
                <h3 className="font-semibold text-emerald-300 mb-3">Environment Variables</h3>
                <div className="space-y-2 text-sm">
                  <div>URL: <span className="text-emerald-200">{healthData.envVars.url || 'Not set'}</span></div>
                  <div>Anon Key: <span className="text-emerald-200">{healthData.envVars.anonKey || 'Not set'}</span></div>
                </div>
              </div>

              <div className="bg-zinc-800 rounded-lg p-4 border border-emerald-500/20">
                <h3 className="font-semibold text-emerald-300 mb-3">Local Storage</h3>
                <div className="space-y-2 text-sm">
                  <div>URL: <span className="text-emerald-200">{healthData.localStorage.url || 'Not set'}</span></div>
                  <div>Anon Key: <span className="text-emerald-200">{healthData.localStorage.anonKey || 'Not set'}</span></div>
                </div>
              </div>

              <div className="bg-zinc-800 rounded-lg p-4 border border-emerald-500/20">
                <h3 className="font-semibold text-emerald-300 mb-3">Query Parameters</h3>
                <div className="space-y-2 text-sm">
                  <div>URL: <span className="text-emerald-200">{healthData.queryParams.url || 'Not set'}</span></div>
                  <div>Anon Key: <span className="text-emerald-200">{healthData.queryParams.anonKey || 'Not set'}</span></div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'diagnostic' && (
          <div className="space-y-6">
            {/* Pass/Fail Status */}
            <div className="bg-zinc-800 rounded-lg p-4 border border-emerald-500/20">
              <h3 className="font-semibold text-emerald-300 mb-3">Pass/Fail Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {Object.entries(diagnosticData.passFailStatus).map(([key, status]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key}:</span>
                    <span className={status === 'PASS' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Build Time */}
            <div className="bg-zinc-800 rounded-lg p-4 border border-emerald-500/20">
              <h3 className="font-semibold text-emerald-300 mb-3">Build Time Environment</h3>
              <div className="space-y-2 text-sm">
                <div>URL: <span className="text-emerald-200">{diagnosticData.buildTime.viteSupabaseUrl}</span></div>
                <div>Anon Key: <span className="text-emerald-200">{diagnosticData.buildTime.viteSupabaseAnonKey}</span></div>
                <div>All Env Vars: <span className="text-emerald-200">{JSON.stringify(diagnosticData.buildTime.allEnvVars)}</span></div>
              </div>
            </div>

            {/* Runtime */}
            <div className="bg-zinc-800 rounded-lg p-4 border border-emerald-500/20">
              <h3 className="font-semibold text-emerald-300 mb-3">Runtime Detection</h3>
              <div className="space-y-2 text-sm">
                <div>Runtime Config Source: <span className="text-emerald-200">{diagnosticData.runtime.runtimeConfigSource}</span></div>
                <div>Health Check Source: <span className="text-emerald-200">{diagnosticData.runtime.healthCheckSource}</span></div>
              </div>
            </div>

            {/* Conflicts */}
            {diagnosticData.conflicts.length > 0 && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-red-300 mb-2">Conflicts:</h3>
                <ul className="space-y-1 text-sm text-red-200">
                  {diagnosticData.conflicts.map((conflict, index) => (
                    <li key={index}>• {conflict}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {diagnosticData.recommendations.length > 0 && (
              <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-300 mb-2">Recommendations:</h3>
                <ul className="space-y-1 text-sm text-yellow-200">
                  {diagnosticData.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'test' && (
          <div className="text-emerald-200">
            <ConfigTestPanel />
          </div>
        )}

        {(healthData.errors.length > 0) && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-300 mb-2">Errors:</h3>
            <ul className="space-y-1 text-sm text-red-200">
              {healthData.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={copyReport}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Full Report'}
          </button>
          <button
            onClick={close}
            className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}