import React, { useState, useEffect } from "react";
import { logger, LogLevel } from "../services/Logger";
import { PrimaryButton, Dropdown, IDropdownOption, Toggle, TextField } from "@fluentui/react";

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState(logger.getLogHistory());
  const [logLevel, setLogLevel] = useState<LogLevel>(logger.getLogLevel());
  const [consoleEnabled, setConsoleEnabled] = useState(true);
  const [filter, setFilter] = useState('');
  const [contextFilter, setContextFilter] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLogs(logger.getLogHistory());
      setConsoleEnabled(localStorage.getItem('docuid_console_logging') !== 'false');
    }
  }, [isOpen]);

  const handleLogLevelChange = (_event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    if (option) {
      const newLevel = option.key as LogLevel;
      setLogLevel(newLevel);
      logger.setLogLevel(newLevel);
    }
  };

  const handleConsoleToggle = (_event: React.MouseEvent<HTMLElement>, checked?: boolean) => {
    setConsoleEnabled(checked || false);
    logger.setConsoleOutput(checked || false);
  };

  const handleClearLogs = () => {
    logger.clearLogHistory();
    setLogs([]);
  };

  const handleExportLogs = () => {
    const logData = logger.exportLogs();
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `docuid-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    const matchesMessage = !filter || log.message.toLowerCase().includes(filter.toLowerCase());
    const matchesContext = !contextFilter || log.context.toLowerCase().includes(contextFilter.toLowerCase());
    return matchesMessage && matchesContext;
  });

  const logLevelOptions: IDropdownOption[] = [
    { key: LogLevel.DEBUG, text: 'DEBUG' },
    { key: LogLevel.INFO, text: 'INFO' },
    { key: LogLevel.WARN, text: 'WARN' },
    { key: LogLevel.ERROR, text: 'ERROR' },
  ];

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG: return '#666666';
      case LogLevel.INFO: return '#0078d4';
      case LogLevel.WARN: return '#ff8c00';
      case LogLevel.ERROR: return '#d13438';
      default: return '#000000';
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '500px',
      height: '100vh',
      backgroundColor: 'white',
      borderLeft: '1px solid #e1e1e1',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-2px 0 8px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e1e1e1',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Debug Panel</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ×
        </button>
      </div>

      {/* Controls */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e1e1e1' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <Dropdown
            label="Log Level"
            selectedKey={logLevel}
            options={logLevelOptions}
            onChange={handleLogLevelChange}
            styles={{ root: { width: '120px' } }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Toggle
              label="Console Output"
              checked={consoleEnabled}
              onChange={handleConsoleToggle}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <TextField
            label="Filter messages"
            value={filter}
            onChange={(_, value) => setFilter(value || '')}
            placeholder="Search logs..."
            styles={{ root: { flex: 1 } }}
          />
          <TextField
            label="Filter context"
            value={contextFilter}
            onChange={(_, value) => setContextFilter(value || '')}
            placeholder="AuthService, DocumentService..."
            styles={{ root: { flex: 1 } }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <PrimaryButton text="Clear Logs" onClick={handleClearLogs} />
          <PrimaryButton text="Export Logs" onClick={handleExportLogs} />
        </div>
      </div>

      {/* Log Display */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        fontFamily: 'monospace',
        fontSize: '12px',
        backgroundColor: '#f8f9fa'
      }}>
        {filteredLogs.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            No logs to display
          </div>
        ) : (
          filteredLogs.slice(-100).reverse().map((log, index) => (
            <div key={index} style={{
              marginBottom: '8px',
              padding: '8px',
              backgroundColor: 'white',
              borderRadius: '4px',
              border: '1px solid #e1e1e1',
              fontFamily: 'Consolas, Monaco, monospace'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{
                  color: getLogLevelColor(log.level),
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}>
                  [{LogLevel[log.level]}]
                </span>
                <span style={{ color: '#666', fontSize: '10px' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div style={{ color: '#666', fontSize: '10px', marginBottom: '4px' }}>
                {log.context}
              </div>
              <div style={{ wordWrap: 'break-word', marginBottom: '4px' }}>
                {log.message}
              </div>
              {log.data && (
                <pre style={{
                  backgroundColor: '#f5f5f5',
                  padding: '4px',
                  borderRadius: '2px',
                  fontSize: '10px',
                  margin: '4px 0',
                  overflow: 'auto',
                  maxHeight: '100px'
                }}>
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
              {log.error && (
                <div style={{
                  color: '#d13438',
                  fontSize: '10px',
                  marginTop: '4px',
                  wordWrap: 'break-word'
                }}>
                  Error: {log.error.message}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
